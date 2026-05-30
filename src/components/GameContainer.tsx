'use client';
import { useEffect, useRef } from 'react';
import type * as Phaser from 'phaser';
import { createGame } from '@/game/phaserGame';
import { EventBus, GameEvents } from '@/game/EventBus';
import HUD from './HUD';
import Joystick from './Joystick';
import UpgradeModal from './UpgradeModal';
import ChestModal from './ChestModal';
import GameOverModal from './GameOverModal';
import WaveBanner from './WaveBanner';

interface Props {
  locationId: string;
  onExit: () => void;
}

export default function GameContainer({ locationId, onExit }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;

    const onReady = () => {
      EventBus.emit(GameEvents.START_LOCATION, locationId);
    };
    EventBus.once(GameEvents.SCENE_READY, onReady);

    gameRef.current = createGame(hostRef.current);

    return () => {
      EventBus.off(GameEvents.SCENE_READY, onReady);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [locationId]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0c14]">
      
      <div ref={hostRef} className="absolute inset-0" />

      
      <HUD onExit={onExit} />
      <WaveBanner />
      <Joystick />
      <UpgradeModal />
      <ChestModal />
      <GameOverModal />
    </div>
  );
}
