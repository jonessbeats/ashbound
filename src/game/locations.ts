// ────────────────────────────────────────────────────────────────
// locations.ts — конфиг локаций (уровней) игры.
//
// Каждая локация = арена с фиксированным числом волн.
// Пережил все волны → локация пройдена → открывается следующая.
// Это новая система прогрессии поверх MVP (исходный ТЗ §18 — одна арена).
// ────────────────────────────────────────────────────────────────

import type { EnemyKind } from './types';

// Описание одной волны внутри локации.
export interface WaveConfig {
  count: number; // сколько врагов в волне
  // Веса врагов в этой волне: какие виды и насколько часто.
  // Чем больше число — тем чаще этот вид. 0 или отсутствие — вид не спавнится.
  weights: Partial<Record<EnemyKind, number>>;
  hpMultiplier: number; // множитель HP врагов в этой волне (рост сложности)
  boss?: boolean; // true — боссовая волна: спавнится дракон + свита (count)
}

// Описание локации целиком.
export interface LocationConfig {
  id: string; // уникальный id (для localStorage прогресса)
  name: string; // отображаемое название
  description: string; // короткое описание для экрана выбора
  floorTexture: string; // ключ текстуры пола (floor-ruins/forest/crypt)
  decorTheme: string; // ключ спрайтшита декора (decor-catacombs/swamp/inferno)
  decorCount: number; // сколько декор-объектов разбросать по арене
  waves: WaveConfig[]; // список волн по порядку
}

// ── Список всех локаций по порядку прохождения ──
// Первая открыта всегда, остальные — после прохождения предыдущей.
export const LOCATIONS: LocationConfig[] = [
  {
    id: 'ashen-ruins',
    name: 'Ashen Ruins',
    description: 'Where the first ash fell. Five waves to survive.',
    floorTexture: 'floor-ruins',
    decorTheme: 'decor-catacombs',
    decorCount: 14,
    waves: [
      { count: 6, weights: { slime: 5 }, hpMultiplier: 1.0 },
      { count: 9, weights: { slime: 4, bat: 3 }, hpMultiplier: 1.1 },
      { count: 12, weights: { slime: 3, bat: 3, skeleton: 2 }, hpMultiplier: 1.25 },
      { count: 15, weights: { bat: 3, skeleton: 4 }, hpMultiplier: 1.4 },
      { count: 6, weights: { skeleton: 3, bat: 3 }, hpMultiplier: 1.6, boss: true },
    ],
  },
  {
    id: 'dead-forest',
    name: 'Dead Forest',
    description: 'Twisted trees and restless bones. Seven waves.',
    floorTexture: 'floor-forest',
    decorTheme: 'decor-forest',
    decorCount: 20,
    waves: [
      { count: 10, weights: { slime: 3, bat: 4 }, hpMultiplier: 1.3 },
      { count: 13, weights: { bat: 4, skeleton: 3 }, hpMultiplier: 1.45 },
      { count: 16, weights: { slime: 2, bat: 3, skeleton: 4 }, hpMultiplier: 1.6 },
      { count: 18, weights: { bat: 3, skeleton: 5 }, hpMultiplier: 1.8 },
      { count: 16, weights: { skeleton: 5, elite: 1 }, hpMultiplier: 2.0 },
      { count: 20, weights: { bat: 4, skeleton: 4 }, hpMultiplier: 2.2 },
      { count: 8, weights: { skeleton: 4, elite: 1 }, hpMultiplier: 2.5, boss: true },
    ],
  },
  {
    id: 'frozen-crypt',
    name: 'Frozen Crypt',
    description: 'The deepest cold. Nine waves. Only the strong return.',
    floorTexture: 'floor-crypt',
    decorTheme: 'decor-inferno',
    decorCount: 12,
    waves: [
      { count: 14, weights: { bat: 4, skeleton: 4 }, hpMultiplier: 2.0 },
      { count: 16, weights: { skeleton: 5, elite: 1 }, hpMultiplier: 2.2 },
      { count: 18, weights: { bat: 3, skeleton: 5 }, hpMultiplier: 2.4 },
      { count: 20, weights: { skeleton: 5, elite: 2 }, hpMultiplier: 2.7 },
      { count: 22, weights: { bat: 4, skeleton: 5 }, hpMultiplier: 3.0 },
      { count: 22, weights: { skeleton: 5, elite: 2 }, hpMultiplier: 3.3 },
      { count: 24, weights: { bat: 5, skeleton: 5 }, hpMultiplier: 3.6 },
      { count: 24, weights: { skeleton: 5, elite: 3 }, hpMultiplier: 4.0 },
      { count: 10, weights: { skeleton: 4, elite: 3 }, hpMultiplier: 4.5, boss: true },
    ],
  },
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    description: 'Ancient trees breathe with dark magic. Ten waves.',
    floorTexture: 'floor-enchanted',
    decorTheme: 'decor-forest',
    decorCount: 22,
    waves: [
      { count: 14, weights: { mole: 4, bat: 3 }, hpMultiplier: 3.0 },
      { count: 16, weights: { mole: 4, treant: 2 }, hpMultiplier: 3.3 },
      { count: 18, weights: { mole: 3, treant: 2, bat: 3 }, hpMultiplier: 3.6 },
      { count: 20, weights: { treant: 3, skeleton: 4 }, hpMultiplier: 4.0 },
      { count: 20, weights: { mole: 4, treant: 3 }, hpMultiplier: 4.3 },
      { count: 22, weights: { treant: 3, skeleton: 5 }, hpMultiplier: 4.7 },
      { count: 22, weights: { mole: 5, treant: 3 }, hpMultiplier: 5.0 },
      { count: 24, weights: { treant: 4, skeleton: 4 }, hpMultiplier: 5.5 },
      { count: 24, weights: { mole: 5, treant: 4 }, hpMultiplier: 6.0 },
      { count: 8, weights: { treant: 4, mole: 3 }, hpMultiplier: 6.5, boss: true },
    ],
  },
  {
    id: 'mountain-pass',
    name: 'Mountain Pass',
    description: 'The final ascent. Eleven waves. Legends are forged here.',
    floorTexture: 'floor-mountain',
    decorTheme: 'decor-catacombs',
    decorCount: 16,
    waves: [
      { count: 18, weights: { mole: 4, treant: 3 }, hpMultiplier: 5.0 },
      { count: 20, weights: { treant: 4, skeleton: 4 }, hpMultiplier: 5.5 },
      { count: 22, weights: { mole: 5, treant: 3, elite: 1 }, hpMultiplier: 6.0 },
      { count: 22, weights: { treant: 4, skeleton: 5 }, hpMultiplier: 6.5 },
      { count: 24, weights: { mole: 5, treant: 4, elite: 1 }, hpMultiplier: 7.0 },
      { count: 24, weights: { treant: 5, skeleton: 5 }, hpMultiplier: 7.5 },
      { count: 26, weights: { mole: 5, treant: 4, elite: 2 }, hpMultiplier: 8.0 },
      { count: 26, weights: { treant: 5, skeleton: 5, elite: 2 }, hpMultiplier: 8.8 },
      { count: 28, weights: { mole: 5, treant: 5, elite: 2 }, hpMultiplier: 9.5 },
      { count: 28, weights: { treant: 5, skeleton: 5, elite: 3 }, hpMultiplier: 10.5 },
      { count: 10, weights: { treant: 4, mole: 4, elite: 2 }, hpMultiplier: 12.0, boss: true },
    ],
  },
];

// Найти локацию по id (вернёт undefined, если нет такой).
export function getLocation(id: string): LocationConfig | undefined {
  return LOCATIONS.find((l) => l.id === id);
}

// Индекс локации по id (для определения «следующей»).
export function getLocationIndex(id: string): number {
  return LOCATIONS.findIndex((l) => l.id === id);
}

// id первой локации — она открыта всегда.
export const FIRST_LOCATION_ID = LOCATIONS[0].id;
