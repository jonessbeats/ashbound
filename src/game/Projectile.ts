import * as Phaser from 'phaser';
interface HomingTarget {
  x: number;
  y: number;
  active: boolean;
}

const FRAME = 16;
const BASE_SIZE = 22;

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number;
  public isCrit: boolean;

  private speed: number;
  private target: HomingTarget | null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    isCrit: boolean,
    target: HomingTarget | null,
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

    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    scene.time.delayedCall(1400, () => {
      if (this.active) this.destroy();
    });
  }

  public homeUpdate(): void {
    if (!this.active) return;

    if (!this.target || !this.target.active) {
      this.target = null;
      return;
    }

    const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }
}
