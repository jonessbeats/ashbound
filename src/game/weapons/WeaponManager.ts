// ────────────────────────────────────────────────────────────────
// WeaponManager — DEBUG версия. Логирует всё, иконки крупные.
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';
import type Player from '../Player';
import type Enemy from '../Enemy';
import type Boss from '../Boss';
import Projectile from '../Projectile';
import Arrow from './Arrow';
import {
  type WeaponId,
  type WeaponState,
  makeWeaponState,
} from './weaponTypes';

export const MAX_WEAPON_SLOTS = 4;

const SLOT_ANGLES = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
const ICON_ORBIT = 24;
const ICON_SCALE = 1.0;

function isAlive(s: { active?: boolean; body?: unknown; x?: unknown; y?: unknown } | null | undefined): boolean {
  return !!(s && s.active && s.body && typeof s.x === 'number' && typeof s.y === 'number');
}

export default class WeaponManager {
  private scene: Phaser.Scene;
  private player!: Player;
  public slots: WeaponState[] = [];

  public projectiles!: Phaser.Physics.Arcade.Group;
  public arrows!: Phaser.Physics.Arcade.Group;
  public onKillBoss: (() => void) | null = null;
  public onKill: ((e: Enemy) => void) | null = null; // вызывается когда враг умер от melee

  private icons: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, player: Player | null, startWeapon: WeaponId = 'sword') {
    this.scene = scene;
    if (player) this.player = player;
    this.addWeapon(startWeapon);
  }

  // Полный сброс к стартовому состоянию (1 меч, базовые статы оружия).
  // Вызывается при входе в локацию — каждый забег начинается с нуля.
  public reset(startWeapon: WeaponId = 'sword'): void {
    this.icons.forEach((ic) => { try { ic.destroy(); } catch { /**/ } });
    this.icons = [];
    this.slots = [];
    this.addWeapon(startWeapon);
  }

  public setPlayer(player: Player): void {
    this.player = player;
    // Сбрасываем cooldown'ы всех оружий — иначе на новой локе оружия "ждут"
    // старое значение nextAttackAt из прошлой локи и не атакуют.
    this.slots.forEach((ws) => { ws.nextAttackAt = 0; });
    this.rebuildIcons();
    console.log('[WM] setPlayer at', player.x, player.y, 'slots:', this.slots.length, 'icons:', this.icons.length);
  }

  public addWeapon(id: WeaponId): boolean {
    if (this.slots.length >= MAX_WEAPON_SLOTS) return false;
    if (this.slots.find((s) => s.def.id === id)) return false;
    this.slots.push(makeWeaponState(id));
    this.rebuildIcons();
    return true;
  }

  public hasWeapon(id: WeaponId): boolean {
    return this.slots.some((s) => s.def.id === id);
  }

  public upgradeWeapon(id: WeaponId): void {
    const ws = this.slots.find((s) => s.def.id === id);
    if (!ws || ws.level >= 5) return;
    ws.level++;
    ws.damage = Math.round(ws.damage * 1.12);
    ws.cooldown = Math.max(150, Math.round(ws.cooldown * 0.94));
    ws.range = Math.round(ws.range * 1.05);
  }

  private rebuildIcons(): void {
    this.icons.forEach((ic) => { try { ic.destroy(); } catch { /**/ } });
    this.icons = [];
    // Игрок может быть ещё не в физике — создаём иконки в 0,0,
    // updateIconPositions их потом переместит когда player.x появится.
    const px = (typeof this.player?.x === 'number') ? this.player.x : 0;
    const py = (typeof this.player?.y === 'number') ? this.player.y : 0;

    this.slots.forEach((ws, i) => {
      const texExists = this.scene.textures.exists(ws.def.spriteKey);
        if (!texExists) {
        const g = this.scene.add.graphics();
        g.fillStyle(0xff0000, 1);
        g.fillCircle(0, 0, 8);
        g.generateTexture('fallback-' + ws.def.id, 16, 16);
        g.destroy();
      }
      const angle = SLOT_ANGLES[i] ?? (i * Math.PI * 0.5);
      const key = texExists ? ws.def.spriteKey : ('fallback-' + ws.def.id);
      try {
        const icon = this.scene.add.image(
          px + Math.cos(angle) * ICON_ORBIT,
          py + Math.sin(angle) * ICON_ORBIT,
          key,
        )
          .setScale(ICON_SCALE)
          .setDepth(50)
          .setAlpha(1.0);
        this.icons.push(icon);
          } catch (err) {
          }
    });
  }

  private updateIconPositions(): void {
    if (typeof this.player?.x !== 'number' || typeof this.player?.y !== 'number') return;
    const px = this.player.x;
    const py = this.player.y;
    this.slots.forEach((_ws, i) => {
      const icon = this.icons[i];
      if (!icon?.active) return;
      const baseAngle = SLOT_ANGLES[i] ?? 0;
      const t = this.scene.time.now / 1800;
      const angle = baseAngle + t * 0.5;
      icon.setPosition(px + Math.cos(angle) * ICON_ORBIT, py + Math.sin(angle) * ICON_ORBIT);
      icon.setRotation(angle + Math.PI / 4);
    });
  }

  public tick(elapsedMs: number, enemiesRaw: Phaser.GameObjects.GameObject[], bossRaw: Boss | null): void {

    // Иконки создаём/обновляем независимо от состояния игрока
    if (this.icons.length < this.slots.length) this.rebuildIcons();
    this.updateIconPositions();

    // Для атак нужен живой игрок
    if (!isAlive(this.player)) return;


    const enemies: Enemy[] = [];
    for (const e of enemiesRaw) {
      if (isAlive(e as never)) enemies.push(e as Enemy);
    }
    const boss: Boss | null = isAlive(bossRaw as never) ? bossRaw : null;

    for (let i = 0; i < this.slots.length; i++) {
      const ws = this.slots[i];
      if (elapsedMs < ws.nextAttackAt) continue;
      if (!isAlive(this.player)) return;
      if (ws.def.style === 'melee') {
        this.doMeleeAttack(i, ws, elapsedMs, enemies, boss);
      } else {
        this.doRangedAttack(i, ws, elapsedMs, enemies, boss);
      }
    }
  }

  private doMeleeAttack(slotIdx: number, ws: WeaponState, elapsedMs: number, enemies: Enemy[], boss: Boss | null): void {
    if (!isAlive(this.player)) return;
    const px = this.player.x as number;
    const py = this.player.y as number;

    const inRange: Enemy[] = [];
    for (const e of enemies) {
      if (!isAlive(e)) continue;
      // Радиус считаем от КРАЯ врага, не от центра — большие враги бьются с запаса
      const eRadius = ((e as unknown as { displayWidth?: number }).displayWidth ?? 24) / 2;
      const d = Phaser.Math.Distance.Between(px, py, e.x, e.y) - eRadius;
      if (d <= ws.range) inRange.push(e);
    }
    if (boss && isAlive(boss)) {
      // Босс крупный — его displayWidth большой, поэтому радиус ощутимый
      const bRadius = ((boss as unknown as { displayWidth?: number }).displayWidth ?? 80) / 2;
      const d = Phaser.Math.Distance.Between(px, py, boss.x, boss.y) - bRadius;
      if (d <= ws.range) {
        inRange.push(boss as unknown as Enemy);
      }
    }
    if (inRange.length === 0) return;

    ws.nextAttackAt = elapsedMs + ws.cooldown;

    let nearest: Enemy | null = null;
    let nearestD = Infinity;
    for (const e of inRange) {
      if (!isAlive(e)) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
      if (d < nearestD) { nearest = e; nearestD = d; }
    }
    if (!nearest) return;

    const centerAngle = Math.atan2(nearest.y - py, nearest.x - px);
    const halfArc = (ws.def.swingArc ?? Math.PI) / 2;
    const critChance = this.player.stats?.critChance ?? 0;
    const isCrit = Math.random() < critChance;
    const dmg = isCrit ? ws.damage * 2 : ws.damage;

    for (const e of inRange) {
      if (!isAlive(e)) continue;
      const eAngle = Math.atan2(e.y - py, e.x - px);
      let diff = Math.abs(Phaser.Math.Angle.Wrap(eAngle - centerAngle));
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff <= halfArc) {
        try {
          const died = e.takeDamage(dmg);
          if (died) {
            // Если это босс (был ли в inRange исходно бо boss?) — onKillBoss
            // Различаем по отсутствию kind у Boss
            if ((e as unknown as { kind?: unknown }).kind === undefined) {
              if (this.onKillBoss) this.onKillBoss();
            } else {
              if (this.onKill) this.onKill(e);
            }
          }
        } catch { /**/ }
      }
    }

    this.playSwingAnim(slotIdx, ws, centerAngle, halfArc, isCrit);
  }

  private doRangedAttack(slotIdx: number, ws: WeaponState, elapsedMs: number, enemies: Enemy[], boss: Boss | null): void {
    if (!isAlive(this.player)) return;
    const px = this.player.x as number;
    const py = this.player.y as number;

    let target: Enemy | Boss | null = null;
    let bestDist = ws.range;
    for (const e of enemies) {
      if (!isAlive(e)) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
      if (d < bestDist) { bestDist = d; target = e; }
    }
    if (!target && boss && isAlive(boss)) {
      if (Phaser.Math.Distance.Between(px, py, boss.x, boss.y) <= ws.range) target = boss;
    }
    if (!target) return;

    ws.nextAttackAt = elapsedMs + ws.cooldown;
    const tx = (target as { x: number }).x;
    const ty = (target as { y: number }).y;
    const angle = Math.atan2(ty - py, tx - px);
    const critChance = this.player.stats?.critChance ?? 0;
    const isCrit = Math.random() < critChance;
    const dmg = isCrit ? ws.damage * 2 : ws.damage;
    const speed = ws.def.projectileSpeed ?? 350;

    // Спавним снаряд от позиции иконки оружия (лук, посох) — выглядит так
    // будто стрела вылетает из лука, а фаербол — из посоха.
    const icon = this.icons[slotIdx];
    const spawnX = icon?.active ? icon.x : px;
    const spawnY = icon?.active ? icon.y : py;

    try {
      if (ws.def.id === 'bow') {
        // Лук — стрела (отдельный спрайт, лёгкий хоминг)
        this.arrows.add(new Arrow(this.scene, spawnX, spawnY, angle, speed, dmg, isCrit, ws.range, target as unknown as Enemy));
      } else {
        // Посох и др. — хоминг-фаербол
        this.projectiles.add(new Projectile(this.scene, spawnX, spawnY, angle, speed, dmg, isCrit, target as unknown as Enemy));
      }
    } catch { /**/ }
  }

  private playSwingAnim(slotIdx: number, ws: WeaponState, centerAngle: number, halfArc: number, isCrit: boolean): void {
    if (!isAlive(this.player)) return;
    const icon = this.icons[slotIdx];
    if (!icon?.active) return;

    const px = this.player.x as number;
    const py = this.player.y as number;
    const RADIUS = ws.range * 0.7;
    const startAngle = centerAngle - halfArc;
    const duration = Math.min(ws.cooldown * 0.5, 320);

    if (icon.active) icon.setAlpha(0);

    const key = this.scene.textures.exists(ws.def.spriteKey) ? ws.def.spriteKey : ('fallback-' + ws.def.id);

    let swing: Phaser.GameObjects.Image;
    try {
      swing = this.scene.add.image(
        px + Math.cos(startAngle) * RADIUS,
        py + Math.sin(startAngle) * RADIUS,
        key,
      )
        .setScale(1.5)
        .setDepth(50)
        .setTint(isCrit ? 0xffee44 : 0xffffff);
    } catch {
      if (icon.active) icon.setAlpha(1.0);
      return;
    }

    // Камера-флеш убран — был слишком назойливый при множественных критах.

    this.scene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration,
      ease: 'Sine.Out',
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        if (!isAlive(this.player) || !swing.active) return;
        const t = tween.getValue() as number;
        const angle = startAngle + t * halfArc * 2;
        swing.setPosition(
          (this.player.x as number) + Math.cos(angle) * RADIUS,
          (this.player.y as number) + Math.sin(angle) * RADIUS,
        );
        swing.setRotation(angle + Math.PI / 4);
      },
      onComplete: () => {
        try { swing.destroy(); } catch { /**/ }
        if (icon.active) icon.setAlpha(1.0);
      },
    });
  }

  public destroy(): void {
    this.icons.forEach((icon) => { try { icon.destroy(); } catch { /**/ } });
    this.icons = [];
  }
}
