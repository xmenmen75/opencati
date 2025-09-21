import { useState, useCallback } from 'react';
import { useOpenPack } from '@/hooks/queries';
import type { PackOpeningResult, Card } from '@/types/card';

interface UsePackOpeningState {
  isOpening: boolean;
  result: PackOpeningResult | null;
  openPack: () => Promise<void>;
  resetResult: () => void;
  error: string | null;
}

export const usePackOpening = (): UsePackOpeningState => {
  const [result, setResult] = useState<PackOpeningResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const openPackMutation = useOpenPack();

  const openPack = useCallback(async () => {
    if (openPackMutation.isPending) return;
    
    setResult(null);
    setError(null);
    
    try {
      // Call the actual API
      const packResult = await openPackMutation.mutateAsync();
      
      if (packResult && packResult.success && packResult.card) {
        // Convert the API response to Card for the result
        const card: Card = {
          id: packResult.card.id,
          rank: packResult.card.rank,
          name: packResult.card.name,
          image: (packResult.card as any).imageUrl, // API returns imageUrl
        };
        setResult({ card });
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
    setError(null);
    openPackMutation.reset();
  }, [openPackMutation]);

  return {
    isOpening: openPackMutation.isPending,
    result,
    openPack,
    resetResult,
    error,
  };
};