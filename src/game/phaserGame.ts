// ────────────────────────────────────────────────────────────────
// phaserGame.ts — создание Phaser-инстанса.
// Canvas адаптируется под размер устройства, portrait-first (ТЗ §10, §14).
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';
import BootScene from './BootScene';
import GameScene from './GameScene';

// Создать игру внутри переданного DOM-контейнера.
export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO, // WebGL, fallback на Canvas
    parent,
    backgroundColor: '#0a0c14',
    // RESIZE — canvas занимает весь контейнер и сам ресайзится (ТЗ §14).
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    pixelArt: true, // чёткие пиксели, без сглаживания
    fps: { target: 60 }, // целевые 60 FPS (ТЗ §47)
    scene: [BootScene, GameScene],
  });
}
