import * as Phaser from 'phaser';

const FRAME = { w: 15, h: 5 };
const DISPLAY_SCALE = 3;

export default class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number;

  private vx: number;
  private vy: number;
  private bornAt: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
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
    this.setRotation(angle);

    const r = Math.round(FRAME.h / 2);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(r, Math.round(FRAME.w / 2 - r), Math.round(FRAME.h / 2 - r));
    body.setAllowGravity(false);
    body.setDrag(0, 0);

    this.play('boss-fire-fly');
  }

  public manualUpdate(delta: number): void {
    if (!this.active) return;
    const dt = delta / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.scene.time.now - this.bornAt > 2500) this.destroy();
  }
}
