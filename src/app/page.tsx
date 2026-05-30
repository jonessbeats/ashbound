'use client';
// menu → location select → game.
import { useState } from 'react';
import dynamic from 'next/dynamic';
import MainMenu from '@/components/MainMenu';
import LocationSelect from '@/components/LocationSelect';

const GameContainer = dynamic(() => import('@/components/GameContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0a0c14] font-mono text-sm text-slate-500">
      Loading arena…
    </div>
  ),
});

type Screen = 'menu' | 'select' | 'game';

export default function Page() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState(0);

  return (
    <main>
      {screen === 'menu' && <MainMenu onStart={() => setScreen('select')} />}

      {screen === 'select' && (
        <LocationSelect
          onPick={(id) => {
            setLocationId(id);
            setGameKey((k) => k + 1);
            setScreen('game');
          }}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'game' && locationId && (
        <GameContainer
          key={gameKey}
          locationId={locationId}
          onExit={() => setScreen('select')}
        />
      )}
    </main>
  );
}
