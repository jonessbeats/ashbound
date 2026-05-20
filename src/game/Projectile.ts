// ────────────────────────────────────────────────────────────────
// Projectile.ts — огненный болт (ТЗ §25 Firebolt).
// Самонаводящийся: каждый кадр доворачивает курс точно в свою цель,
// поэтому при автоатаке выстрел гарантированно догоняет врага.
// Если цель погибла — летит прямо по последнему вектору до таймаута.
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';
// Цель самонаведения — что угодно с позицией и флагом активности.
// Подходят и Enemy, и Boss.
interface HomingTarget {
  x: number;
  y: number;
  active: boolean;
}

const FRAME = 16; // кадр спрайтшита фаербола
const BASE_SIZE = 22; // желаемый размер обычного болта (px)

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number;
  public isCrit: boolean;

  private speed: number; // модуль скорости (px/s)
  private target: HomingTarget | null; // цель самонаведения

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number, // стартовое направление (радианы) — на момент выстрела
    speed: number,
    damage: number,
    isCrit: boolean,
    target: HomingTarget | null, // враг, в которого ведём болт
  ) {
    super(scene, x, y, 'firebolt', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.damage = damage;
    this.isCrit = isCrit;
    this.speed = speed;
    this.target = target;
    this.setDepth(8);

    const scale = (BASE_SIZE / FRAME) * (isCrit ? 1.6 : 1);
    this.setScale(scale);
    (this.body as Phaser.Physics.Arcade.Body).setCircle(FRAME / 2);

    this.play('firebolt-fly');

    // Начальная скорость по стартовому углу.
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Болт живёт максимум 1.4с (страховка, если цель так и не достигнута).
    scene.time.delayedCall(1400, () => {
      if (this.active) this.destroy();
    });
  }

  // Жёсткое самонаведение — зовётся каждый кадр из GameScene.
  // Пока цель жива, болт летит точно в неё.
  public homeUpdate(): void {
    if (!this.active) return;

    // Цель пропала или погибла — снимаем наведение, летим прямо.
    if (!this.target || !this.target.active) {
      this.target = null;
      return;
    }

    // Каждый кадр пересчитываем вектор точно в текущую позицию цели.
    const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }
}
