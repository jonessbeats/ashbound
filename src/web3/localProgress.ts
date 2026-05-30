import type { RunResult } from '@/game/types';
import { LOCATIONS, FIRST_LOCATION_ID } from '@/game/locations';

const KEY = 'ashbound:progress';

export interface LocalProgress {
  bestScore: number;
  totalRuns: number;
  bestSurvivalTime: number;
  clearedLocations: string[];
}

const EMPTY: LocalProgress = {
  bestScore: 0,
  totalRuns: 0,
  bestSurvivalTime: 0,
  clearedLocations: [],
};

export function loadProgress(): LocalProgress {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

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
  }
  return next;
}

export function isLocationUnlocked(_locationId: string, _cleared: string[]): boolean {
  return true;
}
