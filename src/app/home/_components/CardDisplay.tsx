import type { Card } from '@/types/card';
import { cn } from '@/lib/utils';
import { CardService } from '@/app/services/cardService';
import { useState } from 'react';
import { AcquiredCardDialog } from './AcquiredCardDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CardDisplayProps {
  card: Card;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  onCardClick?: (userCardId: string) => void;
  userCardId?: string;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({ 
  card, 
  className,
  isOpen,
  onClose,
  onCardClick,
  userCardId
}) => {
  const probability = CardService.getCardProbability(card.rank);
  const [showAcquiredDialog, setShowAcquiredDialog] = useState(false);
  const handleCardClick = () => {
    if (onCardClick) {
      onClose();
      setTimeout(() => {
        onCardClick(userCardId || card.id.toString());
      }, 200);
    } else {
      onClose();
      setTimeout(() => {
        setShowAcquiredDialog(true);
      }, 200);
    }
  }

  return (
    <>
      <AcquiredCardDialog 
        userCardId={userCardId!}
        isOpen={showAcquiredDialog} 
        onClose={() => setShowAcquiredDialog(false)} 
      />
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent showCloseButton={false} 
        className="w-fit p-0 bg-transparent border-none shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Card Acquired - {card.rank} Rank</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col rounded-md bg-white border-2 border-yellow-500 animate-in fade-in-0 zoom-in-95 duration-300">
            <span className="text-center font-semibold text-md mt-2">
              Card Acquired!
            </span>
            <div
              onClick={handleCardClick}
              className={cn(
                "relative w-48 h-64 rounded-xl overflow-hidden cursor-pointer m-2",
                "border-2 border-white/20 backdrop-blur-sm",
                probability?.color,
                probability?.glowColor,
                "shadow-2xl transform transition-all duration-300 hover:scale-95",
                className
              )}
            >
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10" />
              
              {/* Card Content */}
              <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-center">
                {/* Card Rank Display */}
                <div className="w-24 h-24 bg-white/20 rounded-full mb-4 flex items-center justify-center border-2 border-white/30">
                  <span className="text-4xl font-bold text-white">{card.rank}</span>
                </div>
              </div>
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-slide-shine" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};