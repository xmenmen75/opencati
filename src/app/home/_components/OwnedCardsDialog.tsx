import { useState, useMemo } from 'react';
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
import { Check, CheckCheck, Lock, Clock, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OwnedCard } from '@/types/card';

interface OwnedCardsDialogProps {
  cards: OwnedCard[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnedCardsDialog({ cards, isOpen, onOpenChange }: OwnedCardsDialogProps) {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Group cards by season and sort seasons by status and date
  const cardsBySeason = useMemo(() => {
    const grouped = cards.reduce((acc, card) => {
      const seasonId = card.season.id;
      if (!acc[seasonId]) {
        acc[seasonId] = {
          season: card.season,
          cards: [],
        };
      }
      acc[seasonId].cards.push(card);
      return acc;
    }, {} as Record<string, { season: OwnedCard['season']; cards: OwnedCard[] }>);

    // Convert to array and sort by season priority (ACTIVE > ENDED > UPCOMING > others)
    const seasonOrder = { 'ACTIVE': 0, 'ENDED': 1, 'DISTRIBUTED': 2, 'UPCOMING': 3 };
    return Object.values(grouped).sort((a, b) => {
      const aOrder = seasonOrder[a.season.status as keyof typeof seasonOrder] ?? 99;
      const bOrder = seasonOrder[b.season.status as keyof typeof seasonOrder] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // If same status, sort by season ID (newer seasons have higher ID)
      return parseInt(b.season.id) - parseInt(a.season.id);
    });
  }, [cards]);

  // Get withdrawable cards (not from active season)
  const withdrawableCards = useMemo(() => {
    return cards.filter(card => card.season.status !== 'ACTIVE');
  }, [cards]);

  const handleSelectCard = (cardId: string, isLocked: boolean) => {
    if (isLocked) return; // Don't allow selection of locked cards
    
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
    if (selectedCards.size === withdrawableCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(withdrawableCards.map(card => card.id)));
    }
  };

  const isAllSelected = selectedCards.size === withdrawableCards.length && withdrawableCards.length > 0;
  const isSomeSelected = selectedCards.size > 0 && selectedCards.size < withdrawableCards.length;

  const getSeasonStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="w-4 h-4 text-green-500" />;
      case 'ENDED':
        return <Trophy className="w-4 h-4 text-blue-500" />;
      case 'DISTRIBUTED':
        return <Check className="w-4 h-4 text-gray-500" />;
      case 'UPCOMING':
        return <Calendar className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getSeasonStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Current Season';
      case 'ENDED':
        return 'Season Ended';
      case 'DISTRIBUTED':
        return 'Rewards Distributed';
      case 'UPCOMING':
        return 'Upcoming Season';
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
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
              Select All Withdrawable
            </label>
          </div>
          {selectedCards.size > 0 && (
            <div className="text-sm text-gray-600">
              {selectedCards.size} selected
            </div>
          )}
          <div className="text-xs text-gray-500 ml-auto">
            {withdrawableCards.length} of {cards.length} cards can be withdrawn
          </div>
        </div>

        {/* Cards by Season - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4 px-2">
          {cards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No cards in your collection yet
            </div>
          ) : (
            <div className="space-y-6">
              {cardsBySeason.map(({ season, cards: seasonCards }) => {
                const isCurrentSeason = season.status === 'ACTIVE';
                const seasonStats = {
                  total: seasonCards.length,
                  selected: seasonCards.filter(card => selectedCards.has(card.id)).length,
                };

                return (
                  <div key={season.id} className="space-y-3">
                    {/* Season Header */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        {getSeasonStatusIcon(season.status || '')}
                        <h3 className="font-semibold text-sm">{season.name}</h3>
                      </div>
                      <div className="text-xs text-gray-500">
                        {seasonStats.total} cards
                        {seasonStats.selected > 0 && ` • ${seasonStats.selected} selected`}
                      </div>
                    </div>

                    {/* Season Cards Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {seasonCards.map((card) => {
                        const isSelected = selectedCards.has(card.id);
                        const isLocked = isCurrentSeason;
                        
                        return (
                          <div
                            key={card.id}
                            className={cn(
                              "relative transition-all duration-200 rounded-lg border bg-white",
                              isLocked 
                                ? "opacity-75 cursor-not-allowed" 
                                : "cursor-pointer hover:shadow-lg",
                              isSelected && !isLocked
                                ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                                : "hover:bg-gray-50 border-gray-200"
                            )}
                            onClick={() => handleSelectCard(card.id, isLocked)}
                          >
                            <div className="p-3 pb-2">
                              {/* On going badge for current season cards */}
                              {isLocked && (
                                <div className="absolute top-1 right-1 z-10">
                                  <div className="px-2 py-1 rounded-md bg-yellow-600 text-white text-xs font-medium shadow-lg">
                                    on going
                                  </div>
                                </div>
                              )}

                              {/* Selection indicator - only show when selected and not locked */}
                              {isSelected && !isLocked && (
                                <div className="absolute top-1 right-1 z-10">
                                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}

                              {/* Card display */}
                              <div 
                                className="w-full aspect-[3/4] rounded flex items-center justify-center text-white mb-2"
                                style={{ backgroundColor: card.rarityColor || '#374151' }}
                              >
                                <div className="text-center">
                                  <div className="text-lg font-bold">{card.rank}</div>
                                  <div className="text-xs opacity-80">RANK</div>
                                </div>
                              </div>
                              
                              {/* CATI reward amount */}
                              <div className="text-sm text-center font-medium truncate">
                                {
                                  Number(card.catiReward) > 0
                                  ? `${card.catiReward} CATI`
                                  : `(Cal) CATI`
                                }
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between items-center w-full">
            {/* <div className="text-sm text-gray-600">
              <div>{selectedCards.size} of {withdrawableCards.length} withdrawable selected</div>
              <div className="text-xs text-gray-500">
                {cards.length - withdrawableCards.length} cards locked in current season
              </div>
            </div> */}
            <div className=" ml-auto flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedCards(new Set())}
                disabled={selectedCards.size === 0}
              >
                Clear Selection
              </Button>
              <Button
                onClick={() => {
                  // TODO: Handle selected cards withdrawal
                  const selectedCardsList = Array.from(selectedCards);
                  console.log('Withdrawing cards:', selectedCardsList);
                  // Here you would typically call an API to process the withdrawal
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
