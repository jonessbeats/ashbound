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

    // Ждём SCENE_READY от Phaser — только тогда шлём локацию.
    // Это надёжнее таймаута: работает на любой скорости устройства.
    const onReady = () => {
      EventBus.emit(GameEvents.START_LOCATION, locationId);
    };
    EventBus.once(GameEvents.SCENE_READY, onReady);

    return () => {
      EventBus.off(GameEvents.SCENE_READY, onReady);
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
