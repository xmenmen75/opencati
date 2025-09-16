import { useState, useCallback } from 'react';
import type { PackOpeningResult } from '@/types/card';
import { CardService } from '../services/cardService';

interface UsePackOpeningState {
  isOpening: boolean;
  result: PackOpeningResult | null;
  openPack: () => Promise<void>;
  resetResult: () => void;
}

export const usePackOpening = (): UsePackOpeningState => {
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<PackOpeningResult | null>(null);

  const openPack = useCallback(async () => {
    if (isOpening) return;
    
    setIsOpening(true);
    setResult(null);
    
    // Simulate pack opening delay for better UX
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const packResult = CardService.openPack();
    setResult(packResult);
    setIsOpening(false);
  }, [isOpening]);

  const resetResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isOpening,
    result,
    openPack,
    resetResult,
  };
};