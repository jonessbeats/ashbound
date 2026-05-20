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
  HUD_UPDATE: 'hud-update', // payload: HudState (каждый кадр)
  LEVEL_UP: 'level-up', // payload: Upgrade[] (3 варианта на выбор)
  GAME_OVER: 'game-over', // payload: RunResult (победа ИЛИ смерть, см. victory)
  WAVE_CHANGED: 'wave-changed', // payload: WaveState (волна сменилась)

  // React -> Phaser
  MOVE_INPUT: 'move-input', // payload: { x: number; y: number } (джойстик)
  UPGRADE_PICKED: 'upgrade-picked', // payload: UpgradeId
  START_LOCATION: 'start-location', // payload: locationId (запуск выбранной локации)
  RESTART: 'restart', // без payload — перезапуск текущей локации
} as const;
