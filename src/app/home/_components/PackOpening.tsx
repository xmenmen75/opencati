import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardDisplay } from '@/app/home/_components/CardDisplay';
import { AcquiredCardDialog } from '@/app/home/_components/AcquiredCardDialog';
import { cn } from '@/lib/utils';
import { usePackOpening } from '@/app/hooks/usePackOpening';
import CardPickerImage from '@/../public/images/card-picker.png';
import Image from 'next/image';
import { Season } from '@/types/card';
import { Clock } from 'lucide-react';

interface PackOpeningProps {
  className?: string;
  canOpenPacks?: boolean;
  onAnimationStateChange?: (isAnimating: boolean) => void;
  activeSeason?: Season;
  hasActiveSeason?: boolean;
  hasEnoughBalance?: boolean;
}

export const PackOpening: React.FC<PackOpeningProps> = ({ className, canOpenPacks = true, onAnimationStateChange, activeSeason, hasActiveSeason, hasEnoughBalance }) => {
  const { isOpening, result, failureResult, openPack, resetResult, error } = usePackOpening();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showAcquiredDialog, setShowAcquiredDialog] = useState(false);
  const [selectedUserCardId, setSelectedUserCardId] = useState<string>('');

  // Format the season end date
  const formatSeasonEndDate = (endDateString?: string) => {
    if (!endDateString) return null;
    
    const endDate = new Date(endDateString);
    const now = new Date();
    
    // If season has ended, show "Season Ended"
    if (endDate <= now) {
      return "Season Ended";
    }
    
    // Format: "Sep 15, 2024 20:00 UTC" with 24-hour format
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Use 24-hour format
      timeZone: 'UTC',
      timeZoneName: 'short'
    };
    
    return endDate.toLocaleDateString('en-US', options);
  };

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
        {/* Season End Time Display */}
        {activeSeason && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm border border-purple-400/50 rounded-lg">
              <Clock className="w-4 h-4 text-purple-200" />
              <span className="text-purple-200 text-sm font-medium">
                Close: {formatSeasonEndDate(activeSeason.endDate)}
              </span>
            </div>
            
            {/* Pack Opening Status */}
            {!canOpenPacks && !isAnimating && !showResult && (
              <div className="text-center">
                {!hasActiveSeason ? (
                  <div className="px-4 py-2 bg-orange-500/20 border border-orange-400/50 rounded-lg">
                    <p className="text-orange-200 text-sm font-medium">
                      Season has ended. Wait for the next season to open packs.
                    </p>
                  </div>
                ) : !hasEnoughBalance ? (
                  <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-200 text-sm font-medium">
                      You need at least 500 CATI to open a pack.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

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




          </div>
        </div>
      </div>
    </div>
  );
};