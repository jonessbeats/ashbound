// ────────────────────────────────────────────────────────────────
// XPOrb.ts — XP-орб. Падает с убитого врага.
// Притягивается к игроку, когда тот в радиусе подбора (ТЗ §26).
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';

export default class XPOrb extends Phaser.Physics.Arcade.Sprite {
  public value: number;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    super(scene, x, y, 'tex-xp');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.value = value;
    this.setDepth(4);
    this.setScale(value >= 30 ? 1.8 : 1); // крупный орб = много XP (с элиток)
  }

  // Притянуться к игроку, если он ближе радиуса подбора.
  // Зовётся каждый кадр из GameScene.
  public magnetTo(px: number, py: number, radius: number): void {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      const angle = Math.atan2(dy, dx);
      this.setVelocity(Math.cos(angle) * 280, Math.sin(angle) * 280);
    } else {
      this.setVelocity(0, 0); // вне радиуса — лежит на месте
    }
  }

  // Принудительное притяжение к игроку с любого расстояния.
  // Используется при автосборе между волнами/локациями.
  public forceMagnetTo(px: number, py: number): void {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return; // уже у игрока
    const angle = Math.atan2(dy, dx);
    // Скорость растёт с расстоянием, чтобы дальние орбы успели долететь за паузу.
    const speed = Math.max(400, Math.min(900, dist * 4));
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
}
