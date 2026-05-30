import * as Phaser from 'phaser';
import BootScene from './BootScene';
import GameScene from './GameScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0a0c14',
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
    pixelArt: true,
    fps: { target: 60 },
    scene: [BootScene, GameScene],
  });
}
