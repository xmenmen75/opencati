import { useState, useCallback } from 'react';
import { useOpenPack } from '@/hooks/queries';
import type { PackOpeningResult } from '@/types/card';
import { CardService } from '../services/cardService';

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
      // For now, use the existing CardService for mock data
      // In the future, this would call the actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      const packResult = CardService.openPack();
      
      // TODO: Replace with actual API call when backend is ready
      // const packResult = await openPackMutation.mutateAsync();
      
      setResult(packResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open pack';
      setError(errorMessage);
    }
  }, [openPackMutation.isPending]);

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