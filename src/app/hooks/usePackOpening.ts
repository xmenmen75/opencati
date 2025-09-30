import { useState, useCallback } from 'react';
import { useOpenPack } from '@/hooks/queries';
import type { PackOpeningResult, Card, CardRank } from '@/types/card';
import type { PackOpenResponse } from '@/services/api';

interface PackFailureResult {
  success: false;
  failureReason: string;
  message: string;
}

interface UsePackOpeningState {
  isOpening: boolean;
  result: PackOpeningResult | null;
  failureResult: PackFailureResult | null;
  openPack: () => Promise<void>;
  resetResult: () => void;
  error: string | null;
}

export const usePackOpening = (): UsePackOpeningState => {
  const [result, setResult] = useState<PackOpeningResult | null>(null);
  const [failureResult, setFailureResult] = useState<PackFailureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const openPackMutation = useOpenPack();

  const openPack = useCallback(async () => {
    if (openPackMutation.isPending) return;
    
    setResult(null);
    setFailureResult(null);
    setError(null);
    
    try {
      // Call the actual API
      const packResult: PackOpenResponse = await openPackMutation.mutateAsync();
      
      if (packResult && packResult.success && packResult.card) {
        // Successful pack opening - convert the API response to Card for the result
        const card: Card = {
          id: packResult.card.id,
          rank: packResult.card.rank as CardRank,
          name: packResult.card.name,
          image: (packResult.card as any).imageUrl, 
        };
        setResult({ 
          card,
          userCardId: (packResult as any).userCardId || packResult.card.id // fallback to card.id if userCardId not available
        });
      } else if (packResult && !packResult.success) {
        // Pack failure - no card won but CATI was spent
        setFailureResult({
          success: false,
          failureReason: packResult.failureReason || 'Unknown failure',
          message: packResult.message || 'Pack opened but no card was won',
        });
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.error || 'Failed to open pack';
      setError(errorMessage);
      console.error('Pack opening failed:', err);
    }
  }, [openPackMutation]);

  const resetResult = useCallback(() => {
    setResult(null);
    setFailureResult(null);
    setError(null);
    openPackMutation.reset();
  }, [openPackMutation]);

  return {
    isOpening: openPackMutation.isPending,
    result,
    failureResult,
    openPack,
    resetResult,
    error,
  };
};