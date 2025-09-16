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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Your Cards Collection</span>
            <div className="text-sm font-normal text-gray-600">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'} total
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Select All Controls */}
          <div className="flex items-center gap-3 pb-4 border-b">
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

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto py-4">
            {cards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No cards in your collection yet
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cards.map((card) => {
                  const isSelected = selectedCards.has(card.id);
                  return (
                    <Card
                      key={card.id}
                      className={cn(
                        "relative cursor-pointer transition-all duration-200 hover:shadow-lg",
                        isSelected
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleSelectCard(card.id)}
                    >
                      <CardContent className="p-3">
                        {/* Selection indicator */}
                        <div className="absolute top-2 right-2">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-blue-500 border-blue-500 text-white"
                                : "border-gray-300 bg-white"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>

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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
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
                Use Selected ({selectedCards.size})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
