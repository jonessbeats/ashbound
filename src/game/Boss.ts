import * as Phaser from 'phaser';
import { BOSS_CONFIG } from './config';

const BOSS_VARIANTS = {
  dragon:    { texture: 'boss-dragon',    anim: 'boss-dragon-fly',    w: 70,  h: 73,  roar: 'boss-fire-hit',      bodyR: 0.38 },
  based_one: { texture: 'boss-based-one', anim: 'boss-based-one-fly', w: 128, h: 128, roar: 'boss-fire-hit-blue', bodyR: 0.5 },
} as const;
type BossVariant = keyof typeof BOSS_VARIANTS;

type PhaseParams = {
  hpThreshold: number;
  fireMul: number;
  summonMul: number;
  speedMul: number;
};

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  public hp: number;
  public maxHp: number;
  public speed: number;
  public contactDamage: number;
  public xpValue: number;

  private nextFireAt = 0;
  private nextSummonAt = 0;

  private phase = 1;
  private phaseParams: PhaseParams = BOSS_CONFIG.phases.phase1;

  private phaseTint = 0xffffff;
  private roarKey: string;

  constructor(scene: Phaser.Scene, x: number, y: number, difficulty: number, variant: BossVariant = 'dragon') {
    super(scene, x, y, BOSS_VARIANTS[variant].texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const v = BOSS_VARIANTS[variant];
    this.roarKey = v.roar;

    this.maxHp = Math.round(BOSS_CONFIG.hp * difficulty);
    this.hp = this.maxHp;
    this.speed = BOSS_CONFIG.speed;
    this.contactDamage = BOSS_CONFIG.contactDamage;
    this.xpValue = BOSS_CONFIG.xp;

    this.setDepth(7);

    const scale = BOSS_CONFIG.size / v.h;
    this.setScale(scale);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const radius = Math.round(v.h * v.bodyR);
    body.setCircle(radius, Math.round(v.w / 2 - radius), Math.round(v.h / 2 - radius));
    body.setImmovable(true);

    this.play(v.anim);
  }

  public initAbilities(now: number): void {
    this.nextFireAt = now + 1500;
    this.nextSummonAt = now + BOSS_CONFIG.summonInterval;
  }

  public shouldFire(now: number): boolean {
    if (now < this.nextFireAt) return false;
    this.nextFireAt = now + BOSS_CONFIG.fireInterval * this.phaseParams.fireMul;
    return true;
  }

  public shouldSummon(now: number): boolean {
    if (now < this.nextSummonAt) return false;
    this.nextSummonAt = now + BOSS_CONFIG.summonInterval * this.phaseParams.summonMul;
    return true;
  }

  public get hpFraction(): number {
    return Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
  }

  public chase(targetX: number, targetY: number): void {
    const sp = this.speed * this.phaseParams.speedMul;
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.setVelocity(Math.cos(angle) * sp, Math.sin(angle) * sp);

    const dx = targetX - this.x;
    if (dx < -8) this.setFlipX(true);
    else if (dx > 8) this.setFlipX(false);
  }

  public takeDamage(amount: number): boolean {
    this.hp -= amount;

    // Floating damage number above the boss
    const isCrit = amount > 25;
    const dmgText = this.scene.add
      .text(
        this.x + Phaser.Math.Between(-12, 12),
        this.y - this.displayHeight * 0.4,
        Math.round(amount).toString(),
        {
          fontSize: isCrit ? '16px' : '13px',
          color: isCrit ? '#ffee44' : '#ffffff',
          stroke: '#000',
          strokeThickness: 3,
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: dmgText,
      y: dmgText.y - 26,
      alpha: 0,
      duration: 650,
      ease: 'Sine.Out',
      onComplete: () => dmgText.destroy(),
    });

    this.setTint(0xff3333);
    this.scene.time.delayedCall(70, () => {
      if (!this.active) return;
      if (this.phaseTint === 0xffffff) this.clearTint();
      else this.setTint(this.phaseTint);
    });

    this.updatePhase();
    return this.hp <= 0;
  }

  private updatePhase(): void {
    const frac = this.hpFraction;
    let newPhase = 1;
    let newParams: PhaseParams = BOSS_CONFIG.phases.phase1;
    if (frac < BOSS_CONFIG.phases.phase3.hpThreshold) {
      newPhase = 3;
      newParams = BOSS_CONFIG.phases.phase3;
    } else if (frac < BOSS_CONFIG.phases.phase2.hpThreshold) {
      newPhase = 2;
      newParams = BOSS_CONFIG.phases.phase2;
    }
    if (newPhase === this.phase) return;

    this.phase = newPhase;
    this.phaseParams = newParams;

    if (this.phase === 2) this.phaseTint = 0xffb060;
    else if (this.phase === 3) this.phaseTint = 0xff5050;
    this.setTint(this.phaseTint);

    if (this.phase === 3) {
      const roar = this.scene.add
        .sprite(this.x, this.y, this.roarKey, 0)
        .setDepth(7)
        .setScale(5);
      roar.play(this.roarKey);
      roar.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => roar.destroy());
    }
  }
}
