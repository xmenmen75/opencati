import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Card as CardType } from '@/types/card';

interface OwnedCardsDialogProps {
  cards: CardType[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnedCardsDialog({ cards, isOpen, onOpenChange }: OwnedCardsDialogProps) {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const handleSelectCard = (cardId: string) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCards.size === cards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(cards.map(card => card.id)));
    }
  };

  const isAllSelected = selectedCards.size === cards.length && cards.length > 0;
  const isSomeSelected = selectedCards.size > 0 && selectedCards.size < cards.length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Your Cards Collection</span>
          </DialogTitle>
        </DialogHeader>

        {/* Select All Controls */}
        <div className="flex items-center gap-3 p-1 pb-4 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className={isSomeSelected ? "data-[state=checked]:bg-blue-300" : ""}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select All
            </label>
          </div>
          {selectedCards.size > 0 && (
            <div className="text-sm text-gray-600">
              {selectedCards.size} selected
            </div>
          )}
        </div>

        {/* Cards Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4 px-2">
          {cards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No cards in your collection yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {cards.map((card) => {
                  const isSelected = selectedCards.has(card.id);
                  return (
                    <div
                      key={card.id}
                      className={cn(
                        "relative cursor-pointer transition-all duration-200 hover:shadow-lg rounded-lg border bg-white",
                        isSelected
                          ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50 border-gray-200"
                      )}
                      onClick={() => handleSelectCard(card.id)}
                    >
                      <div className="p-3 pb-2">
                        {/* Selection indicator - only show when selected */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 z-10">
                            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Card display */}
                        <div className="w-full aspect-[3/4] bg-gradient-to-b from-gray-600 to-gray-800 rounded flex items-center justify-center text-white mb-2">
                          <div className="text-center">
                            <div className="text-lg font-bold">{card.rank}</div>
                            <div className="text-xs opacity-80">RANK</div>
                          </div>
                        </div>
                        
                        {/* Card name */}
                        <div className="text-sm text-center font-medium truncate">
                          {card.name}
                        </div>
                        
                        {/* Card rank indicator */}
                        <div className="text-xs text-center text-gray-500 mt-1">
                          Rank: {card.rank}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-gray-600">
              {selectedCards.size} of {cards.length} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedCards(new Set())}
                disabled={selectedCards.size === 0}
              >
                Clear Selection
              </Button>
              <Button
                onClick={() => {
                  // TODO: Handle selected cards action (e.g., trade, sell, etc.)
                  console.log('Selected cards:', Array.from(selectedCards));
                }}
                disabled={selectedCards.size === 0}
              >
                Withdraw Selected ({selectedCards.size})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
