import * as Phaser from 'phaser';
import { ENEMY_CONFIG } from './config';
import type { EnemyKind } from './types';

const FRAME_SIZE: Record<EnemyKind, { w: number; h: number }> = {
  slime: { w: 16, h: 16 },
  bat: { w: 19, h: 28 },
  skeleton: { w: 19, h: 20 },
  elite: { w: 31, h: 24 },
  // Tiny RPG Forest by Ansimuz (CC0)
  treant: { w: 31, h: 35 },
  mole: { w: 24, h: 24 },
  // 2D Pixel Dungeon Asset Pack by Pixel_Poem (commercial OK)
  skeleton2: { w: 32, h: 32 },
  vampire: { w: 32, h: 32 },
  goblin: { w: 16, h: 16 },
  orc: { w: 16, h: 16 },
  mummy: { w: 16, h: 16 },
  zombie: { w: 16, h: 16 },
  fire_skull: { w: 16, h: 16 },
};

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  public kind: EnemyKind;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public contactDamage: number;
  public xpValue: number;
  public readonly id: number = ++Enemy.nextId;
  private static nextId = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind, difficulty: number) {
    super(scene, x, y, 'enemy-' + kind, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const c = ENEMY_CONFIG[kind];
    const frame = FRAME_SIZE[kind];
    this.kind = kind;
    this.maxHp = Math.round(c.hp * difficulty);
    this.hp = this.maxHp;
    this.speed = c.speed;
    this.contactDamage = c.contactDamage;
    this.xpValue = c.xp;

    this.setDepth(5);

    const maxSide = Math.max(frame.w, frame.h);
    const scale = c.size / maxSide;
    this.setScale(scale);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const radius = Math.min(frame.w, frame.h) * 0.42;
    body.setCircle(radius, frame.w / 2 - radius, frame.h / 2 - radius);

    this.play('enemy-' + kind);
  }

  public chase(targetX: number, targetY: number): void {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);

    const dx = targetX - this.x;
    if (dx < -6) this.setFlipX(true);
    else if (dx > 6) this.setFlipX(false);
  }

  public takeDamage(amount: number): boolean {
    this.hp -= amount;

    this.setTint(0xff3333);
    this.scene.time.delayedCall(90, () => {
      if (this.active) this.clearTint();
    });

    const isCrit = amount > 20;
    const dmgText = this.scene.add.text(
      this.x + Phaser.Math.Between(-8, 8),
      this.y - 12,
      Math.round(amount).toString(),
      {
        fontSize: isCrit ? '14px' : '11px',
        color: isCrit ? '#ffee44' : '#ffffff',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'bold',
      },
    ).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: dmgText,
      y: dmgText.y - 24,
      alpha: 0,
      duration: 600,
      ease: 'Sine.Out',
      onComplete: () => dmgText.destroy(),
    });

    return this.hp <= 0;
  }
}
