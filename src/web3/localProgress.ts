// ────────────────────────────────────────────────────────────────
// localProgress.ts — локальный прогресс через localStorage (ТЗ §30).
// Хранит лучший счёт, число run'ов, лучшее время и пройденные локации.
// ────────────────────────────────────────────────────────────────

import type { RunResult } from '@/game/types';
import { LOCATIONS, FIRST_LOCATION_ID } from '@/game/locations';

const KEY = 'ashbound:progress';

export interface LocalProgress {
  bestScore: number;
  totalRuns: number;
  bestSurvivalTime: number; // секунды
  clearedLocations: string[]; // id пройденных локаций
}

const EMPTY: LocalProgress = {
  bestScore: 0,
  totalRuns: 0,
  bestSurvivalTime: 0,
  clearedLocations: [],
};

// Прочитать прогресс. Безопасно при SSR и битых данных.
export function loadProgress(): LocalProgress {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

// Записать результат run и вернуть обновлённый прогресс.
// Если run победный — отмечаем локацию как пройденную.
export function saveRun(result: RunResult): LocalProgress {
  const prev = loadProgress();
  const cleared = [...prev.clearedLocations];
  if (result.victory && !cleared.includes(result.locationId)) {
    cleared.push(result.locationId);
  }
  const next: LocalProgress = {
    bestScore: Math.max(prev.bestScore, result.score),
    totalRuns: prev.totalRuns + 1,
    bestSurvivalTime: Math.max(prev.bestSurvivalTime, result.survivalTime),
    clearedLocations: cleared,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage недоступен (приватный режим) — молча игнорируем.
  }
  return next;
}

// Открыта ли локация для игры.
// DEV MODE: все локации открыты всегда.
export function isLocationUnlocked(_locationId: string, _cleared: string[]): boolean {
  return true;
}
