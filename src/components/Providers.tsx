'use client';

// ────────────────────────────────────────────────────────────────
// Providers.tsx — клиентская обёртка с провайдерами web3.
// Оборачивает всё приложение: WagmiProvider + React Query.
// Используется в server-компоненте layout.tsx — стандартный паттерн Next.
// ────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/web3/wagmiConfig';

export default function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient создаём один раз через useState — не пересоздавать на рендерах.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
