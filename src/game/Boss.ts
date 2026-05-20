// ────────────────────────────────────────────────────────────────
// Boss.ts — босс локации (ТЗ §21). Появляется в финальной волне.
// Способности (Этап 2): огонь по прямой + призыв летучей свиты.
// Фазы (Этап 3): по HP босс становится злее — атаки чаще, скорость выше.
//   Фаза 1 (100..66% HP): базовые тайминги.
//   Фаза 2 (66..33%): атаки чаще, +оранжевый тинт.
//   Фаза 3 (<33%):    спам атак, +красный тинт, рык-вспышка при переходе.
// Спрайт — дракон из Debts in the Depths by Reaktori (CC0).
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';
import { BOSS_CONFIG } from './config';

// Размер кадра спрайтшита дракона.
const FRAME = { w: 70, h: 73 };

// Параметры одной фазы — что меняется относительно базовых.
type PhaseParams = {
  hpThreshold: number;
  fireMul: number;
  summonMul: number;
  speedMul: number;
};

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  public hp: number;
  public maxHp: number;
  public speed: number;
  public contactDamage: number;
  public xpValue: number;

  // Тайминги способностей — отсчитываются от игрового времени (elapsedMs).
  private nextFireAt = 0;
  private nextSummonAt = 0;

  // Текущая фаза (1, 2 или 3) и кэш её множителей.
  private phase = 1;
  private phaseParams: PhaseParams = BOSS_CONFIG.phases.phase1;

  // Длительный тинт фазы (оранжевый/красный) — отдельно от вспышки удара.
  // Когда вспышка удара заканчивается, восстанавливаем этот цвет.
  private phaseTint = 0xffffff;

  constructor(scene: Phaser.Scene, x: number, y: number, difficulty: number) {
    super(scene, x, y, 'boss-dragon', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // HP и урон масштабируются множителем финальной волны локации.
    this.maxHp = Math.round(BOSS_CONFIG.hp * difficulty);
    this.hp = this.maxHp;
    this.speed = BOSS_CONFIG.speed;
    this.contactDamage = BOSS_CONFIG.contactDamage;
    this.xpValue = BOSS_CONFIG.xp;

    this.setDepth(6); // чуть выше обычных врагов

    // Масштабируем спрайт так, чтобы высота равнялась BOSS_CONFIG.size.
    const scale = BOSS_CONFIG.size / FRAME.h;
    this.setScale(scale);

    // Хитбокс — крупный круг по центру (целые значения — Arcade Physics
    // капризна к дробным offset на масштабированном теле).
    const body = this.body as Phaser.Physics.Arcade.Body;
    const radius = Math.round(FRAME.h * 0.38);
    body.setCircle(radius, Math.round(FRAME.w / 2 - radius), Math.round(FRAME.h / 2 - radius));

    this.play('boss-dragon-fly');
  }

  // Инициализация таймеров способностей — зовётся при спавне босса.
  // now — текущее игровое время (elapsedMs).
  public initAbilities(now: number): void {
    // Первая атака — не сразу, даём игроку секунду осмотреться.
    this.nextFireAt = now + 1500;
    this.nextSummonAt = now + BOSS_CONFIG.summonInterval;
  }

  // Пора ли стрелять огнём. Если да — взводит таймер на следующий выстрел.
  // Интервал умножается на множитель текущей фазы (на фазе 3 — короче).
  public shouldFire(now: number): boolean {
    if (now < this.nextFireAt) return false;
    this.nextFireAt = now + BOSS_CONFIG.fireInterval * this.phaseParams.fireMul;
    return true;
  }

  // Пора ли призывать свиту. Аналогично — интервал зависит от фазы.
  public shouldSummon(now: number): boolean {
    if (now < this.nextSummonAt) return false;
    this.nextSummonAt = now + BOSS_CONFIG.summonInterval * this.phaseParams.summonMul;
    return true;
  }

  // Доля оставшегося HP (0..1) — для HP-бара босса в HUD.
  public get hpFraction(): number {
    return Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
  }

  // Двигаться к игроку. Зовётся каждый кадр из GameScene.
  // Скорость учитывает множитель текущей фазы.
  public chase(targetX: number, targetY: number): void {
    const sp = this.speed * this.phaseParams.speedMul;
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.setVelocity(Math.cos(angle) * sp, Math.sin(angle) * sp);

    // Разворот по направлению — с порогом, чтобы не дёргался.
    const dx = targetX - this.x;
    if (dx < -8) this.setFlipX(true);
    else if (dx > 8) this.setFlipX(false);
  }

  // Получить урон. Вернёт true, если босс повержен.
  // Если HP упало ниже порога фазы — обновить фазу и дёрнуть визуальный эффект.
  public takeDamage(amount: number): boolean {
    this.hp -= amount;

    // Белая вспышка-удар, потом восстанавливаем тинт фазы.
    this.setTint(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (!this.active) return;
      if (this.phaseTint === 0xffffff) this.clearTint();
      else this.setTint(this.phaseTint);
    });

    this.updatePhase();
    return this.hp <= 0;
  }

  // Пересчитать фазу по текущему HP. При смене фазы — визуальный сигнал.
  private updatePhase(): void {
    const frac = this.hpFraction;
    let newPhase = 1;
    let newParams: PhaseParams = BOSS_CONFIG.phases.phase1;
    if (frac < BOSS_CONFIG.phases.phase3.hpThreshold) {
      newPhase = 3;
      newParams = BOSS_CONFIG.phases.phase3;
    } else if (frac < BOSS_CONFIG.phases.phase2.hpThreshold) {
      newPhase = 2;
      newParams = BOSS_CONFIG.phases.phase2;
    }
    if (newPhase === this.phase) return; // фаза не сменилась

    this.phase = newPhase;
    this.phaseParams = newParams;

    // Тинт под фазу: 2 — оранжевый, 3 — красный.
    if (this.phase === 2) this.phaseTint = 0xffb060;
    else if (this.phase === 3) this.phaseTint = 0xff5050;
    this.setTint(this.phaseTint);

    // На фазе 3 — короткий «рык»: всплеск-взрыв пламени поверх босса.
    if (this.phase === 3) {
      const roar = this.scene.add
        .sprite(this.x, this.y, 'boss-fire-hit', 0)
        .setDepth(7)
        .setScale(5);
      roar.play('boss-fire-hit');
      roar.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => roar.destroy());
    }
  }
}
