import React from 'react';
import { Button } from '@/components/ui/button';
import { CardDisplay } from '@/components/CardDisplay';
import { PackOpeningAnimation } from '@/components/PackOpeningAnimation';
import { ProbabilityDisplay } from '@/components/ProbabilityDisplay';
import { cn } from '@/lib/utils';
import { usePackOpening } from '@/app/hooks/usePackOpening';

interface PackOpeningProps {
  className?: string;
}

export const PackOpening: React.FC<PackOpeningProps> = ({ className }) => {
  const { isOpening, result, openPack, resetResult } = usePackOpening();

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
            Click the Open button to reveal your card!
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Pack Opening Section */}
          <div className="flex-1 flex flex-col items-center space-y-6">
            {/* Open Button */}
            {!isOpening && !result && (
              <Button
                onClick={openPack}
                size="lg"
                className="px-8 py-4 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105 transition-all duration-200 shadow-2xl border-0"
              >
                Open Pack
              </Button>
            )}

            {/* Opening Animation */}
            {isOpening && <PackOpeningAnimation isOpening={isOpening} />}

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
                    disabled={isOpening}
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

          {/* <div className="lg:w-80">
            <ProbabilityDisplay />
          </div> */}
        </div>

        {/* <div className="text-center text-gray-600 text-sm">
          <p>Each pack contains one random card based on the probability rates shown.</p>
        </div> */}
      </div>
    </div>
  );
};