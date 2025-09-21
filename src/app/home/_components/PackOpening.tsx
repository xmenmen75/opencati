import React from 'react';
import { Button } from '@/components/ui/button';
import { CardDisplay } from '@/app/home/_components/CardDisplay';
import { PackOpeningAnimation } from '@/app/home/_components/PackOpeningAnimation';
import { cn } from '@/lib/utils';
import { usePackOpening } from '@/app/hooks/usePackOpening';

interface PackOpeningProps {
  className?: string;
  canOpenPacks?: boolean;
}

export const PackOpening: React.FC<PackOpeningProps> = ({ className, canOpenPacks = true }) => {
  const { isOpening, result, failureResult, openPack, resetResult, error } = usePackOpening();

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)]",
      className
    )}>
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Card Pack Opening
          </h1>
          <p className="text-white/80 text-lg">
            {canOpenPacks 
              ? "Click the Open button to reveal your card!" 
              : "Get more CATI to start opening packs!"}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Pack Opening Section */}
          <div className="flex-1 flex flex-col items-center space-y-6">
            {/* Open Button or Insufficient Balance Message */}
            {!isOpening && !result && !failureResult && (
              <>
                {canOpenPacks ? (
                  <Button
                    onClick={openPack}
                    size="lg"
                    className="px-8 py-4 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105 transition-all duration-200 shadow-2xl border-0"
                  >
                    Open Pack
                  </Button>
                ) : (
                  <div className="text-center p-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg max-w-md">
                    <h3 className="text-yellow-200 font-bold text-lg mb-2">Insufficient CATI Balance</h3>
                    <p className="text-yellow-200/80">
                      You need at least 500 CATI to open a pack. Get more CATI to continue playing!
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Opening Animation */}
            {isOpening && <PackOpeningAnimation isOpening={isOpening} />}

            {/* Error Display */}
            {error && (
              <div className="text-center p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-200 font-medium">Error: {error}</p>
                <Button
                  onClick={resetResult}
                  variant="outline"
                  className="mt-2 border-red-500/50 text-red-200 hover:bg-red-500/10"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Pack Failure Result */}
            {failureResult && !isOpening && (
              <div className="flex flex-col items-center space-y-6">
                <div className="text-center p-8 bg-orange-500/20 border border-orange-500/50 rounded-lg max-w-md">
                  <div className="text-6xl mb-4">💸</div>
                  <h3 className="text-orange-200 font-bold text-xl mb-2">Pack Failed!</h3>
                  <p className="text-orange-200/90 mb-1">{failureResult.message}</p>
                  <p className="text-orange-200/70 text-sm">{failureResult.failureReason}</p>
                  <div className="mt-4 p-3 bg-orange-600/30 rounded">
                    <p className="text-orange-100 text-sm font-medium">
                      Your 500 CATI has been spent, but you didn't win a card this time.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={openPack}
                    disabled={isOpening || !canOpenPacks}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={resetResult}
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {/* Card Result */}
            {result && !isOpening && (
              <div className="flex flex-col items-center space-y-6">
                <CardDisplay
                  card={result.card}
                  className="transform animate-fade-in-up"
                />
                <div className="flex space-x-4">
                  <Button
                    onClick={openPack}
                    disabled={isOpening || !canOpenPacks}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                  >
                    Open Another
                  </Button>
                  <Button
                    onClick={resetResult}
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* <div className="text-center text-gray-600 text-sm">
          <p>Each pack contains one random card based on the probability rates shown.</p>
        </div> */}
      </div>
    </div>
  );
};