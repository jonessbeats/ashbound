// ────────────────────────────────────────────────────────────────
// XPOrb.ts — XP-орб. Падает с убитого врага.
// Притягивается к игроку, когда тот в радиусе подбора (ТЗ §26).
// Анимированные монеты/гемы из Tiny RPG Forest by Ansimuz (CC0).
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';

export default class XPOrb extends Phaser.Physics.Arcade.Sprite {
  public value: number;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    // Гемы (value >= 30) — с элиток, монеты — обычные
    const texKey = value >= 30 ? 'xp-gem' : 'xp-coin';
    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.value = value;
    this.setDepth(4);
    this.setScale(value >= 30 ? 3.5 : 3);

    // Запускаем анимацию вращения
    this.play(texKey + '-spin');
  }

  // Притянуться к игроку, если он ближе радиуса подбора.
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

  // Принудительное притяжение — автосбор между волнами.
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
