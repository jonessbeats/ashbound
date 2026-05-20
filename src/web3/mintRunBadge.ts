// ────────────────────────────────────────────────────────────────
// mintRunBadge.ts — хук для минта NFT-бейджа за run (ТЗ §31–32).
// Оборачивает wagmi useWriteContract + авто-переключение сети.
//
// Если кошелёк игрока на другой сети (например Ethereum mainnet),
// хук сам попросит его переключиться на нужную цепь Base —
// игроку остаётся одно нажатие «Switch» в окне кошелька.
// ────────────────────────────────────────────────────────────────

'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { ASHBOUND_ABI } from './contract';
import { CONTRACT_ADDRESS, activeChain } from './chains';
import type { RunResult } from '../game/types';

// Что возвращает хук в компонент GameOverModal.
export interface MintState {
  mint: (run: RunResult) => void; // запустить минт
  reset: () => void; // сбросить состояние минта (для нового забега)
  isSwitching: boolean; // идёт переключение сети
  isPending: boolean; // ждём подпись минта в кошельке
  isConfirming: boolean; // транзакция в блоке, ждём подтверждения
  isSuccess: boolean; // бейдж заминчен
  error: string | null; // текст ошибки, если что-то пошло не так
  txHash: `0x${string}` | undefined; // хэш транзакции (для ссылки на эксплорер)
  wrongNetwork: boolean; // кошелёк не на той сети
}

export function useMintRunBadge(): MintState {
  const { address } = useAccount();

  // На какой сети кошелёк сейчас.
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

  // Низкоуровневая запись в контракт.
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Отслеживаем майнинг транзакции по её хэшу.
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // На нужной ли мы сети (та, где задеплоен контракт).
  const wrongNetwork = chainId !== activeChain.id;

  // Запоминаем данные run между «переключили сеть» и «теперь минтим».
  const pendingRun = useRef<RunResult | null>(null);

  // Отправить транзакцию минта (вызывается, когда сеть уже правильная).
  const sendMint = useCallback(
    (run: RunResult) => {
      if (!address) return;
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ASHBOUND_ABI,
        functionName: 'mintRunBadge',
        args: [
          address,
          BigInt(run.score),
          BigInt(run.survivalTime),
          BigInt(run.level),
          BigInt(run.kills),
        ],
      });
    },
    [address, writeContract],
  );

  // Главная функция для UI: минт с авто-переключением сети.
  const mint = useCallback(
    (run: RunResult) => {
      if (!address) return; // кошелёк не подключён — UI этого не допустит

      if (wrongNetwork) {
        // Сеть не та — сначала просим кошелёк переключиться.
        // Сам минт уйдёт в useEffect ниже, когда сеть станет правильной.
        pendingRun.current = run;
        switchChain({ chainId: activeChain.id });
      } else {
        // Уже на нужной сети — минтим сразу.
        sendMint(run);
      }
    },
    [address, wrongNetwork, switchChain, sendMint],
  );

  // Как только сеть переключилась на правильную и есть отложенный run —
  // автоматически отправляем минт.
  useEffect(() => {
    if (!wrongNetwork && pendingRun.current) {
      const run = pendingRun.current;
      pendingRun.current = null;
      sendMint(run);
    }
  }, [wrongNetwork, sendMint]);

  // Сбросить состояние минта — нужно перед новым забегом,
  // иначе кнопка осталась бы «✓ заминчено» с прошлого раза.
  const reset = useCallback(() => {
    pendingRun.current = null;
    resetWrite();
  }, [resetWrite]);

  // Собираем текст ошибки из любого источника (переключение или сам минт).
  const anyError = switchError || writeError;

  return {
    mint,
    reset,
    isSwitching,
    isPending,
    isConfirming,
    isSuccess,
    error: anyError ? anyError.message.split('\n')[0] : null,
    txHash,
    wrongNetwork,
  };
}
