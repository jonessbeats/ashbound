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
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle-down', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);
    this.setScale(1.2);

    (this.body as Phaser.Physics.Arcade.Body).setSize(22, 28);
    (this.body as Phaser.Physics.Arcade.Body).setOffset(21, 34);

    this.play('player-idle-down');

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
    this.setFlipX(false);

    if (moving) {
      // Pick direction by the dominant axis of movement.
      if (Math.abs(vx) >= Math.abs(vy)) {
        this.facing = vx >= 0 ? 'right' : 'left';
      } else {
        this.facing = vy >= 0 ? 'down' : 'up';
      }
      const want = 'player-run-' + this.facing;
      if (this.anims.currentAnim?.key !== want) {
        this.play(want, true);
      }
    } else {
      // Idle in the last-faced direction.
      const want = 'player-idle-' + this.facing;
      if (this.anims.currentAnim?.key !== want) {
        this.play(want, true);
      }
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
