// ────────────────────────────────────────────────────────────────
// EnemyProjectile.ts — снаряд врага (огонь дракона).
// Летит ПО ПРЯМОЙ в позицию игрока на момент выстрела.
//
// Движение реализовано ВРУЧНУЮ через update() — каждый кадр сдвигаем
// позицию на vx*dt, vy*dt. Это надёжнее, чем полагаться на Arcade Physics
// body.velocity: были баги, когда скорость не применялась и снаряд залипал.
// Хитбокс физтела остаётся для коллизий с игроком.
// Спрайт — sprFirebolt из Debts in the Depths (CC0).
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';

const FRAME = { w: 15, h: 5 };
const DISPLAY_SCALE = 3; // спрайт огня тонкий — увеличиваем

export default class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number;

  private vx: number; // скорость по X (px/s) — задаём в конструкторе, не меняем
  private vy: number; // скорость по Y (px/s)
  private bornAt: number; // время рождения (мс)

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number, // направление полёта (радианы)
    speed: number,
    damage: number,
  ) {
    super(scene, x, y, 'boss-fire', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.damage = damage;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.bornAt = scene.time.now;

    this.setDepth(8);
    this.setScale(DISPLAY_SCALE);
    this.setRotation(angle); // визуальный поворот по направлению

    // Хитбокс для коллизий с игроком (физика как «триггер» — без скорости).
    const r = Math.round(FRAME.h / 2);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(r, Math.round(FRAME.w / 2 - r), Math.round(FRAME.h / 2 - r));
    // На всякий случай — гарантируем, что физика не тормозит снаряд.
    body.setAllowGravity(false);
    body.setDrag(0, 0);

    this.play('boss-fire-fly');
  }

  // Зовётся каждый кадр из GameScene.handleEnemyProjectiles.
  // delta — время прошедшего кадра в миллисекундах.
  public manualUpdate(delta: number): void {
    if (!this.active) return;
    // Сдвигаем позицию вручную. delta в мс → /1000 для секунд.
    const dt = delta / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // Истекаем через 2.5с после рождения.
    if (this.scene.time.now - this.bornAt > 2500) this.destroy();
  }
}
