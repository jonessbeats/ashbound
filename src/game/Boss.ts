import * as Phaser from 'phaser';
import { BOSS_CONFIG } from './config';

const FRAME = { w: 70, h: 73 };

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

  constructor(scene: Phaser.Scene, x: number, y: number, difficulty: number) {
    super(scene, x, y, 'boss-dragon', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHp = Math.round(BOSS_CONFIG.hp * difficulty);
    this.hp = this.maxHp;
    this.speed = BOSS_CONFIG.speed;
    this.contactDamage = BOSS_CONFIG.contactDamage;
    this.xpValue = BOSS_CONFIG.xp;

    this.setDepth(6);

    const scale = BOSS_CONFIG.size / FRAME.h;
    this.setScale(scale);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const radius = Math.round(FRAME.h * 0.38);
    body.setCircle(radius, Math.round(FRAME.w / 2 - radius), Math.round(FRAME.h / 2 - radius));

    this.play('boss-dragon-fly');
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

    this.setTint(0xffffff);
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
        .sprite(this.x, this.y, 'boss-fire-hit', 0)
        .setDepth(7)
        .setScale(5);
      roar.play('boss-fire-hit');
      roar.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => roar.destroy());
    }
  }
}
