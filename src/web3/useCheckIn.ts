// ────────────────────────────────────────────────────────────────
// useCheckIn.ts — хук ежедневного on-chain чек-ина.
//
// Бесплатно (только газ). Один чек-ин в UTC-сутки. Считает streak.
// Если кошелёк на другой сети — попросит переключиться.
// ────────────────────────────────────────────────────────────────

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { CHECKIN_ABI } from './checkInContract';
import { CHECKIN_ADDRESS, activeChain } from './chains';

export interface CheckInState {
  doCheckIn: () => void;
  reset: () => void;
  isSwitching: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: `0x${string}` | undefined;
  wrongNetwork: boolean;
  /** Можно ли чекиниться сегодня (ещё не отмечался). */
  canCheckIn: boolean;
  /** Текущая серия подряд. */
  streak: number;
  /** Лучшая серия за всё время. */
  bestStreak: number;
  /** Всего чек-инов. */
  total: number;
  /** Идёт загрузка данных игрока. */
  isLoadingRecord: boolean;
}

export function useCheckIn(): CheckInState {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const wrongNetwork = chainId !== activeChain.id;

  // Данные игрока: streak / bestStreak / total.
  const {
    data: recordData,
    isLoading: isLoadingRecord,
    refetch: refetchRecord,
  } = useReadContract({
    address: CHECKIN_ADDRESS,
    abi: CHECKIN_ABI,
    functionName: 'getRecord',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !wrongNetwork },
  });

  // Можно ли чекиниться сегодня.
  const { data: canData, refetch: refetchCan } = useReadContract({
    address: CHECKIN_ADDRESS,
    abi: CHECKIN_ABI,
    functionName: 'canCheckIn',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !wrongNetwork },
  });

  const streak = recordData ? Number(recordData[1]) : 0;
  const bestStreak = recordData ? Number(recordData[2]) : 0;
  const total = recordData ? Number(recordData[3]) : 0;

  // Оптимистичная блокировка: после успешной транзы RPC-нода ещё пару секунд
  // отдаёт старое значение canCheckIn=true. Чтобы юзер не нажал второй раз
  // (и не получил revert "already checked in"), блокируем локально сразу.
  const [checkedThisSession, setCheckedThisSession] = useState(false);
  const canCheckIn = Boolean(canData) && !checkedThisSession;

  // После успешного чек-ина — перечитываем данные и ставим локальный флаг.
  useEffect(() => {
    if (isSuccess) {
      setCheckedThisSession(true);
      refetchRecord();
      refetchCan();
    }
  }, [isSuccess, refetchRecord, refetchCan]);

  const sendCheckIn = useCallback(() => {
    if (!address) return;
    writeContract({
      address: CHECKIN_ADDRESS,
      abi: CHECKIN_ABI,
      functionName: 'checkIn',
      args: [],
    });
  }, [address, writeContract]);

  const pending = useRef(false);

  const doCheckIn = useCallback(() => {
    if (!address) return;
    // Защита от двойного клика: транза в полёте или уже отметился.
    if (isPending || isConfirming || checkedThisSession) return;
    // Сбрасываем прошлую ошибку перед новой попыткой.
    resetWrite();
    if (wrongNetwork) {
      pending.current = true;
      switchChain({ chainId: activeChain.id });
    } else {
      sendCheckIn();
    }
  }, [address, isPending, isConfirming, checkedThisSession, wrongNetwork, switchChain, sendCheckIn, resetWrite]);

  // После переключения сети — досылаем отложенный чек-ин.
  useEffect(() => {
    if (!wrongNetwork && pending.current) {
      pending.current = false;
      sendCheckIn();
    }
  }, [wrongNetwork, sendCheckIn]);

  const reset = useCallback(() => {
    pending.current = false;
    resetWrite();
  }, [resetWrite]);

  const anyError = switchError || writeError;
  let errorMessage: string | null = null;
  if (anyError) {
    const raw = anyError.message;
    if (raw.includes('Already checked in today')) {
      errorMessage = 'You already checked in today. Come back tomorrow!';
    } else if (raw.includes('User rejected') || raw.includes('User denied')) {
      errorMessage = 'Transaction rejected in wallet.';
    } else {
      errorMessage = raw.split('\n')[0];
    }
  }

  return {
    doCheckIn,
    reset,
    isSwitching,
    isPending,
    isConfirming,
    isSuccess,
    error: errorMessage,
    txHash,
    wrongNetwork,
    canCheckIn,
    streak,
    bestStreak,
    total,
    isLoadingRecord,
  };
}
