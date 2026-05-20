// ────────────────────────────────────────────────────────────────
// Player.ts — игрок. Хранит статы и текущее HP.
// Движение и автоатаку задаёт GameScene — здесь только данные и урон.
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';
import { PLAYER_CONFIG } from './config';
import type { PlayerStats } from './types';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats; // текущие статы (меняются апгрейдами)
  public hpCurrent: number; // текущее HP
  public xp = 0; // накопленный XP на текущем уровне
  public level = 1;
  public alive = true;

  private invulnUntil = 0; // мс — короткая неуязвимость после получения урона

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Стартуем с idle-спрайтшита (кадр 0).
    super(scene, x, y, 'player-idle', 0);
    scene.add.existing(this); // добавить в список отрисовки
    scene.physics.add.existing(this); // включить физическое тело

    this.setCollideWorldBounds(true); // не выходить за пределы арены
    this.setDepth(10); // игрок поверх врагов

    // Хитбокс — небольшой круг по центру нижней части спрайта
    // (спрайт 64×44 с большим прозрачным полем, тело делаем компактным).
    (this.body as Phaser.Physics.Arcade.Body).setSize(20, 22);
    (this.body as Phaser.Physics.Arcade.Body).setOffset(22, 18);

    this.play('player-idle'); // запустить анимацию покоя

    // Копируем базовые статы — апгрейды меняют копию, а не конфиг.
    this.stats = {
      maxHp: PLAYER_CONFIG.hp,
      moveSpeed: PLAYER_CONFIG.moveSpeed,
      attackDamage: PLAYER_CONFIG.attackDamage,
      attackCooldown: PLAYER_CONFIG.attackCooldown,
      attackRange: PLAYER_CONFIG.attackRange,
      critChance: PLAYER_CONFIG.critChance,
      projectileSpeed: PLAYER_CONFIG.projectileSpeed,
      projectileCount: PLAYER_CONFIG.projectileCount,
      pickupRadius: PLAYER_CONFIG.pickupRadius,
    };
    this.hpCurrent = PLAYER_CONFIG.hp;
  }

  // Обновить анимацию по вектору движения. Зовётся каждый кадр из GameScene.
  // vx, vy — текущая скорость игрока.
  public updateAnimation(vx: number, vy: number): void {
    const moving = Math.abs(vx) > 1 || Math.abs(vy) > 1;

    // Разворот спрайта по горизонтали: бежит влево — зеркалим.
    if (vx < -1) this.setFlipX(true);
    else if (vx > 1) this.setFlipX(false);

    // Переключаем анимацию только если она реально сменилась
    // (иначе анимация дёргалась бы с первого кадра каждый тик).
    const want = moving ? 'player-run' : 'player-idle';
    if (this.anims.currentAnim?.key !== want) {
      this.play(want, true);
    }
  }

  // Получить урон. Вернёт true, если урон реально прошёл (не в i-frames).
  public takeDamage(amount: number, now: number): boolean {
    if (!this.alive || now < this.invulnUntil) return false;

    this.hpCurrent = Math.max(0, this.hpCurrent - amount);
    this.invulnUntil = now + 350; // 0.35с неуязвимости после удара

    // Красная вспышка как обратная связь (tint, не fill — чтобы спрайт остался виден).
    this.setTint(0xff5a4a);
    this.scene.time.delayedCall(110, () => {
      if (this.active) this.clearTint();
    });

    if (this.hpCurrent <= 0) this.alive = false;
    return true;
  }

  // Восстановить HP (не выше maxHp).
  public heal(amount: number): void {
    this.hpCurrent = Math.min(this.stats.maxHp, this.hpCurrent + amount);
  }
}
