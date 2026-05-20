'use client';

// ────────────────────────────────────────────────────────────────
// page.tsx — корневая страница. Три экрана:
// menu → location select → game.
// GameContainer грузится динамически без SSR (Phaser требует window).
// ────────────────────────────────────────────────────────────────

import { useState } from 'react';
import dynamic from 'next/dynamic';
import MainMenu from '@/components/MainMenu';
import LocationSelect from '@/components/LocationSelect';

// Phaser работает только в браузере — отключаем серверный рендер.
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
  // Какую локацию запускать — выбирается на экране select.
  const [locationId, setLocationId] = useState<string | null>(null);

  return (
    <main>
      {screen === 'menu' && <MainMenu onStart={() => setScreen('select')} />}

      {screen === 'select' && (
        <LocationSelect
          onPick={(id) => {
            setLocationId(id);
            setScreen('game');
          }}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'game' && locationId && (
        <GameContainer locationId={locationId} onExit={() => setScreen('select')} />
      )}
    </main>
  );
}
