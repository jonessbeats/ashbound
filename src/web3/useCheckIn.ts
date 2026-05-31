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
  canCheckIn: boolean;
  streak: number;
  bestStreak: number;
  total: number;
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

  const [checkedThisSession, setCheckedThisSession] = useState(false);
  const canCheckIn = Boolean(canData) && !checkedThisSession;

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
    if (isPending || isConfirming || checkedThisSession) return;
    resetWrite();
    if (wrongNetwork) {
      pending.current = true;
      switchChain({ chainId: activeChain.id });
    } else {
      sendCheckIn();
    }
  }, [address, isPending, isConfirming, checkedThisSession, wrongNetwork, switchChain, sendCheckIn, resetWrite]);

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
