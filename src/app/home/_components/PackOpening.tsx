import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardDisplay } from '@/app/home/_components/CardDisplay';
import { AcquiredCardDialog } from '@/app/home/_components/AcquiredCardDialog';
import { cn } from '@/lib/utils';
import { usePackOpening } from '@/app/hooks/usePackOpening';
import CardPickerImage from '@/../public/images/card-picker.png';
import Image from 'next/image';

interface PackOpeningProps {
  className?: string;
  canOpenPacks?: boolean;
  onAnimationStateChange?: (isAnimating: boolean) => void;
}

export const PackOpening: React.FC<PackOpeningProps> = ({ className, canOpenPacks = true, onAnimationStateChange }) => {
  const { isOpening, result, failureResult, openPack, resetResult, error } = usePackOpening();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showAcquiredDialog, setShowAcquiredDialog] = useState(false);
  const [selectedUserCardId, setSelectedUserCardId] = useState<string>('');

  // Handle pack opening with animation
  const handleCardClick = async () => {
    if (!canOpenPacks || isAnimating) return;
    
    // Reset states and force animation restart
    setShowResult(false);
    setIsAnimating(false); // First set to false
    
    // Use setTimeout to force a re-render and restart animation
    setTimeout(() => {
      setIsAnimating(true);
      onAnimationStateChange?.(true); // Notify parent that animation started
    }, 10);
    
    // Start the pack opening API call
    await openPack();
    
    // Keep animation running for at least 4 seconds
    setTimeout(() => {
      setIsAnimating(false);
      setShowResult(true);
      onAnimationStateChange?.(false); // Notify parent that animation ended
    }, 4000);
  };

  // Reset states when resetResult is called
  useEffect(() => {
    if (!result && !failureResult && !error) {
      setShowResult(false);
      setIsAnimating(false);
      onAnimationStateChange?.(false); // Notify parent that animation ended
    }
  }, [result, failureResult, error, onAnimationStateChange]);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)]",
      className
    )}>
      <div className="max-w-4xl w-full space-y-8">


        {/* Main Content Area */}
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Card Pack Image */}
          <div className="relative flex flex-col items-center space-y-6">
            {/* The rotating card image */}
            <Image
              src={CardPickerImage}
              alt="Card Pack"
              onClick={handleCardClick}
              className={cn(
              "relative w-[70vw] max-w-[500px] h-auto cursor-pointer transform transition-all duration-300 hover:scale-105 rounded-xl",
              isAnimating && "animate-spin-ease",
              !canOpenPacks && "opacity-50 cursor-not-allowed"
              )}
              width={384}
              height={288}
            />

            {/* Result overlay - Show actual card instead of message */}
            {showResult && result && (
              <CardDisplay
                card={result.card}
                className="transform scale-75"
                isOpen={showResult}
                onClose={() => {
                  setShowResult(false);
                  resetResult();
                }}
                onCardClick={(userCardId) => {
                  setSelectedUserCardId(userCardId);
                  setShowAcquiredDialog(true);
                }}
                userCardId={result.userCardId}
              />
            )}

            {/* Acquired Card Dialog */}
            <AcquiredCardDialog 
              isOpen={showAcquiredDialog}
              onClose={() => setShowAcquiredDialog(false)}
              userCardId={selectedUserCardId || result?.userCardId || ''}
            />

            {/* Failure and error overlays */}
            {showResult && (failureResult || error) && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
                {failureResult && (
                  <div className="bg-orange-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg border border-orange-400">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">💸</span>
                      <span className="font-bold">No card this time</span>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg border border-red-400">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">❌</span>
                      <span className="font-bold">Error occurred</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            {!isAnimating && !showResult && !canOpenPacks && (
              <div className="text-center text-white/70 max-w-md">
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <p className="text-yellow-200 font-medium">
                    You need at least 500 CATI to open a pack
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons when result is shown - REMOVED */}
            {/* Remove buttons, only keep card image for interaction */}

            {/* Error handling - REMOVED, only card image for interaction */}
            {/* {error && showResult && (
              <div className="text-center p-4 bg-red-500/20 border border-red-500/50 rounded-lg max-w-md">
                <p className="text-red-200 font-medium mb-2">Error: {error}</p>
                <Button
                  onClick={resetResult}
                  variant="outline"
                  className="border-red-500/50 text-red-200 hover:bg-red-500/10"
                >
                  Try Again
                </Button>
              </div>
            )} */}

            {/* Show won card below - remove since we show it above */}
            {/* {showResult && result && (
              <div className="mt-8">
                <CardDisplay
                  card={result.card}
                  className="transform animate-fade-in-up"
                />
              </div>
            )} */}
          </div>
        </div>

        {/* <div className="text-center text-gray-600 text-sm">
          <p>Each pack contains one random card based on the probability rates shown.</p>
        </div> */}
      </div>
    </div>
  );
};