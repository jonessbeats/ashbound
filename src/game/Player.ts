import * as Phaser from 'phaser';
import { PLAYER_CONFIG } from './config';
import type { PlayerStats } from './types';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  public hpCurrent: number;
  public xp = 0;
  public level = 1;
  public alive = true;

  private invulnUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);

    (this.body as Phaser.Physics.Arcade.Body).setSize(20, 22);
    (this.body as Phaser.Physics.Arcade.Body).setOffset(22, 18);

    this.play('player-idle');

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

  public updateAnimation(vx: number, vy: number): void {
    const moving = Math.abs(vx) > 1 || Math.abs(vy) > 1;

    if (vx < -1) this.setFlipX(true);
    else if (vx > 1) this.setFlipX(false);

    const want = moving ? 'player-run' : 'player-idle';
    if (this.anims.currentAnim?.key !== want) {
      this.play(want, true);
    }
  }

  public takeDamage(amount: number, now: number): boolean {
    if (!this.alive || now < this.invulnUntil) return false;

    this.hpCurrent = Math.max(0, this.hpCurrent - amount);
    this.invulnUntil = now + 350;

    this.setTint(0xff5a4a);
    this.scene.time.delayedCall(110, () => {
      if (this.active) this.clearTint();
    });

    if (this.hpCurrent <= 0) this.alive = false;
    return true;
  }

  public heal(amount: number): void {
    this.hpCurrent = Math.min(this.stats.maxHp, this.hpCurrent + amount);
  }
}
