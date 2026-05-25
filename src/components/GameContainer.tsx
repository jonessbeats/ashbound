'use client';

// ────────────────────────────────────────────────────────────────
// GameContainer.tsx — монтирует Phaser и накладывает React-UI поверх.
// Получает locationId — какую локацию запускать (через EventBus в сцену).
// ────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import type * as Phaser from 'phaser';
import { createGame } from '@/game/phaserGame';
import { EventBus, GameEvents } from '@/game/EventBus';
import HUD from './HUD';
import Joystick from './Joystick';
import UpgradeModal from './UpgradeModal';
import GameOverModal from './GameOverModal';
import WaveBanner from './WaveBanner';

interface Props {
  locationId: string; // какую локацию играть
  onExit: () => void; // выход к экрану выбора локаций
}

export default function GameContainer({ locationId, onExit }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;
    gameRef.current = createGame(hostRef.current);

    // Сцена грузится асинхронно — ждём её готовности, потом шлём локацию.
    // 300мс достаточно даже на слабых мобильных устройствах.
    const t = setTimeout(() => {
      EventBus.emit(GameEvents.START_LOCATION, locationId);
    }, 300);

    return () => {
      clearTimeout(t);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [locationId]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0c14]">
      {/* Слой Phaser-canvas */}
      <div ref={hostRef} className="absolute inset-0" />

      {/* Слои React-UI поверх игры */}
      <HUD onExit={onExit} />
      <WaveBanner />
      <Joystick />
      <UpgradeModal />
      <GameOverModal />
    </div>
  );
}
