import React from 'react';
import { CardService } from '@/services/cardService';
import { cn } from '@/lib/utils';

interface ProbabilityDisplayProps {
  className?: string;
}

export const ProbabilityDisplay: React.FC<ProbabilityDisplayProps> = ({ className }) => {
  const probabilities = CardService.getAllProbabilities();

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg p-4 shadow-lg", className)}>
      <h3 className="text-gray-800 font-bold text-lg mb-4 text-center">Card Probabilities</h3>
      <div className="space-y-2">
        {probabilities.map((prob) => (
          <div 
            key={prob.rank}
            className="flex items-center justify-between p-2 rounded-md bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <div className={cn("w-4 h-4 rounded-full", prob.color)} />
              <span className="text-gray-800 font-semibold">{prob.rank}</span>
            </div>
            <span className="text-gray-600 text-sm">
              {(prob.probability * 100).toFixed(3)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};