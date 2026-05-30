//
//
'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { ASHBOUND_ABI } from './contract';
import { CONTRACT_ADDRESS, activeChain } from './chains';

export interface MintState {
  mint: (locationId: number) => void;
  reset: () => void;
  isSwitching: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: `0x${string}` | undefined;
  wrongNetwork: boolean;
  alreadyMinted: boolean;
}

export function useMintRunBadge(locationId: number | null): MintState {
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

  const { data: alreadyMintedData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ASHBOUND_ABI,
    functionName: 'hasMinted',
    args:
      address && locationId !== null
        ? [address, locationId]
        : undefined,
    query: { enabled: !!address && locationId !== null && !wrongNetwork },
  });
  const alreadyMinted = Boolean(alreadyMintedData);

  const pendingLocation = useRef<number | null>(null);

  const sendMint = useCallback(
    (loc: number) => {
      if (!address) return;
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ASHBOUND_ABI,
        functionName: 'mintRunBadge',
        args: [loc],
      });
    },
    [address, writeContract],
  );

  const mint = useCallback(
    (loc: number) => {
      if (!address) return;

      if (wrongNetwork) {
        pendingLocation.current = loc;
        switchChain({ chainId: activeChain.id });
      } else {
        sendMint(loc);
      }
    },
    [address, wrongNetwork, switchChain, sendMint],
  );

  useEffect(() => {
    if (!wrongNetwork && pendingLocation.current !== null) {
      const loc = pendingLocation.current;
      pendingLocation.current = null;
      sendMint(loc);
    }
  }, [wrongNetwork, sendMint]);

  const reset = useCallback(() => {
    pendingLocation.current = null;
    resetWrite();
  }, [resetWrite]);

  const anyError = switchError || writeError;
  let errorMessage: string | null = null;
  if (anyError) {
    const raw = anyError.message;
    if (raw.includes('AlreadyMintedForLocation')) {
      errorMessage = 'You already minted this badge for this location.';
    } else if (raw.includes('InvalidLocation')) {
      errorMessage = 'Invalid location id.';
    } else if (raw.includes('SoulboundNonTransferable')) {
      errorMessage = 'This badge is soulbound — non-transferable.';
    } else if (raw.includes('EnforcedPause')) {
      errorMessage = 'Minting is paused. Try again later.';
    } else if (raw.includes('User rejected') || raw.includes('User denied')) {
      errorMessage = 'Transaction rejected in wallet.';
    } else {
      errorMessage = raw.split('\n')[0];
    }
  }

  return {
    mint,
    reset,
    isSwitching,
    isPending,
    isConfirming,
    isSuccess,
    error: errorMessage,
    txHash,
    wrongNetwork,
    alreadyMinted,
  };
}
