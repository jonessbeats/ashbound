import * as Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

export const GameEvents = {
  // Phaser -> React
  HUD_UPDATE: 'hud-update',
  LEVEL_UP: 'level-up',
  CHEST_OPEN: 'chest-open',
  GAME_OVER: 'game-over',
  WAVE_CHANGED: 'wave-changed',
  SCENE_READY: 'scene-ready',

  // React -> Phaser
  MOVE_INPUT: 'move-input',
  UPGRADE_PICKED: 'upgrade-picked',
  CHEST_PICKED: 'chest-picked',
  START_LOCATION: 'start-location',
  RESTART: 'restart',
} as const;
