import * as Phaser from 'phaser';

export default class XPOrb extends Phaser.Physics.Arcade.Sprite {
  public value: number;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    const texKey = value >= 30 ? 'xp-gem' : 'xp-coin';
    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.value = value;
    this.setDepth(4);
    this.setScale(value >= 30 ? 2.0 : 1.5);

    this.play(texKey + '-spin');
  }

  public magnetTo(px: number, py: number, radius: number): void {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      const angle = Math.atan2(dy, dx);
      this.setVelocity(Math.cos(angle) * 280, Math.sin(angle) * 280);
    } else {
      this.setVelocity(0, 0);
    }
  }

  public forceMagnetTo(px: number, py: number): void {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const angle = Math.atan2(dy, dx);
    const speed = Math.max(400, Math.min(900, dist * 4));
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
}
