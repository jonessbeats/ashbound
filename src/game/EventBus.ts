// ────────────────────────────────────────────────────────────────
// EventBus.ts — единый канал связи между Phaser-сценой и React.
// Phaser эмитит события, React их слушает, и наоборот.
// Это всё, что нужно для связи — без Redux и сложного state (ТЗ §5).
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';

// Один общий эмиттер на всё приложение.
export const EventBus = new Phaser.Events.EventEmitter();

// Имена событий. Чтобы не путать строки, держим их в одном месте.
export const GameEvents = {
  // Phaser -> React
  HUD_UPDATE: 'hud-update',
  LEVEL_UP: 'level-up',
  CHEST_OPEN: 'chest-open',   // сундук открыт: варианты оружий/апгрейдов
  GAME_OVER: 'game-over',
  WAVE_CHANGED: 'wave-changed',
  SCENE_READY: 'scene-ready',

  // React -> Phaser
  MOVE_INPUT: 'move-input',
  UPGRADE_PICKED: 'upgrade-picked',
  CHEST_PICKED: 'chest-picked', // игрок выбрал оружие из сундука
  START_LOCATION: 'start-location',
  RESTART: 'restart',
} as const;
