import React from 'react';
import { cn } from '@/lib/utils';

interface PackOpeningAnimationProps {
  isOpening: boolean;
  className?: string;
}

export const PackOpeningAnimation: React.FC<PackOpeningAnimationProps> = ({
  isOpening,
  className
}) => {
  if (!isOpening) return null;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4",
      className
    )}>
      {/* Pack Animation */}
      <div className="relative w-32 h-40">
        {/* Pack Base */}
        <div className="w-full h-full bg-gradient-to-b from-purple-600 to-purple-800 rounded-lg border-2 border-purple-400 shadow-xl animate-bounce">
          <div className="absolute inset-2 border border-purple-300 rounded-md opacity-50" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-sm">
            PACK
          </div>
        </div>
        
        {/* Sparkle Effects */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping animation-delay-200" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full animate-ping animation-delay-400" />
        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-pink-400 rounded-full animate-ping animation-delay-600" />
      </div>
      
      {/* Opening Text */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white animate-pulse">
          Opening Pack...
        </h3>
        <div className="flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-200" />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-400" />
        </div>
      </div>
    </div>
  );
};