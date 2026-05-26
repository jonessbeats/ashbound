// ────────────────────────────────────────────────────────────────
// Arrow.ts — стрела лука. Летит в цель с лёгким хомингом.
// Слабее чем у фаербола — стрела почти прямая, но докручивается.
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';
import type Enemy from '../Enemy';

const ARROW_SPEED = 450;
const HOMING_STRENGTH = 0.22; // сильный хоминг — стрела ВСЕГДА попадает

export default class Arrow extends Phaser.Physics.Arcade.Sprite {
  public damage: number;
  public isCrit: boolean;
  private vx: number;
  private vy: number;
  private readonly maxRange: number;
  private traveledSq = 0;
  private target: Enemy | { x: number; y: number; active?: boolean } | null;
  public hitEnemies: Set<number> = new Set();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    isCrit: boolean,
    maxRange: number,
    target: Enemy | { x: number; y: number; active?: boolean } | null = null,
  ) {
    super(scene, x, y, 'arrow');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.damage = damage;
    this.isCrit = isCrit;
    this.maxRange = maxRange;
    this.target = target;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.pushable = false;
    this.setVelocity(this.vx, this.vy);
    this.setRotation(angle);
    this.setDepth(5);
    this.setScale(0.6);

    scene.time.delayedCall(2000, () => {
      if (this.active) this.destroy();
    });
  }

  public manualUpdate(delta: number): void {
    if (!this.active) return;

    // Лёгкий хоминг — если цель ещё жива, плавно докручиваем направление.
    if (this.target && (this.target as Enemy).active !== false) {
      const desiredAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const currentAngle = Math.atan2(this.vy, this.vx);
      const diff = Phaser.Math.Angle.Wrap(desiredAngle - currentAngle);
      const newAngle = currentAngle + diff * HOMING_STRENGTH;
      this.vx = Math.cos(newAngle) * ARROW_SPEED;
      this.vy = Math.sin(newAngle) * ARROW_SPEED;
      this.setRotation(newAngle);
    }

    this.setVelocity(this.vx, this.vy);

    const dx = this.vx * (delta / 1000);
    const dy = this.vy * (delta / 1000);
    this.traveledSq += dx * dx + dy * dy;
    if (this.traveledSq > this.maxRange * this.maxRange) {
      this.destroy();
    }
  }
}
