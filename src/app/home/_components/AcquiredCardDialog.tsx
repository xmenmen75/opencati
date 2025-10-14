'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Zap, Crown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface AcquiredCard {
  id: string;
  name: string;
  rank: string;
  imageUrl: string;
  attack: number;
  defense: number;
  selfHeal: number;
  areaAttack: number;
  speed: number;
  cost: number;
  specialAbility: string;
  hearts: number;
  lightning: number;
  crowns: number;
  acquiredDate: string;
  catiValue: number;
  rewardAmount: number;
}

interface AcquiredCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userCardId: string;
  onBroadcastSuccess?: () => void;
}

export function AcquiredCardDialog({ isOpen, onClose, userCardId, onBroadcastSuccess }: AcquiredCardDialogProps) {
  const [tipMessage, setTipMessage] = useState('I got a AA rank card.');
  const [onlyTipToCelebrate, setOnlyTipToCelebrate] = useState(true);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dummy card data (in real app this would come from props)
  const card: AcquiredCard = {
    id: '1',
    name: 'Black Soldier',
    rank: 'AA',
    imageUrl: '/images/black-soldier-card.jpg',
    attack: 2,
    defense: 8,
    selfHeal: 0,
    areaAttack: 0,
    speed: 1,
    cost: 2,
    specialAbility: 'Can change attack target upon entering opponent\'s territory.',
    hearts: 100,
    lightning: 20,
    crowns: 10,
    acquiredDate: '2025/9/26',
    catiValue: 400,
    rewardAmount: 200
  };


  const tipOptions = [
    { amount: 10, usd: 0.03 },
    { amount: 100, usd: 0.3 },
    { amount: 1000, usd: 3 },
    { amount: 10000, usd: 30 },
  ];
  console.log("Acquired User Card id is " + userCardId)
  const handleTipSelection = (tipAmount: number) => {
    setSelectedTipAmount(tipAmount);
    setSubmitError(null); // Clear any previous errors when selecting new tip
  };

  const handleFinalSubmission = async () => {
    if (!tipMessage.trim()) {
      setSubmitError('Please enter a message');
      return;
    }

    if (!selectedTipAmount) {
      setSubmitError('Please select a tip amount');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/cards/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_card_id: userCardId,
          content: tipMessage.trim(),
          only_celebrate: onlyTipToCelebrate,
          tip_cati: selectedTipAmount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to broadcast message');
      }
      toast.success('Broadcast successful!');
      
      // Trigger callback for manual refresh as fallback
      if (onBroadcastSuccess) {
        onBroadcastSuccess();
      }

      // Trigger manual refresh event as fallback for SSE
      window.dispatchEvent(new CustomEvent('broadcast-refresh'));
      
      // Close dialog after successful broadcast
      // Note: The SSE connection will automatically update all clients with the new broadcast
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to broadcast message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-400 p-6">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-black">
            Acquired Card
          </DialogTitle>
        </DialogHeader>

        {/* Card Image and Details - Side by Side */}
        <div className="flex gap-6 mb-6">
          {/* Card Image */}
          <div className="flex-shrink-0">
            <div className="relative w-64 h-80 rounded-lg overflow-hidden border border-white 
            bg-gradient-to-b from-purple-900 via-blue-800 to-purple-900">
              <img 
                src={card.imageUrl} 
                alt={card.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Card Details */}
          <div className="flex-1 space-y-4">
            {/* Stats Icons */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span>{card.hearts}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>{card.lightning}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp fill="currentColor" className="h-4 w-4 text-yellow-400" />
                <span>{card.crowns}</span>
              </div>
            </div>

            {/* Acquired Date */}
            <div className="text-sm text-gray-800">
              Acquired Date: {card.acquiredDate}
            </div>

            {/* CATI Value */}
            <div className="text-sm text-gray-800">
              CATI Value: {card.catiValue} CATI
            </div>

            {/* Reward Info */}
            <div className="text-sm text-gray-800">
              ({card.rewardAmount}) CATI is rewarded by{' '}
              <span className="text-blue-600 underline cursor-pointer">OpenCati</span>
            </div>

            {/* Description */}
            <div className="text-sm text-gray-700">
              OpenCati is Selling the Game Goods, Like CatiCoin Key holder, Black Soldier figure.
            </div>

            {/* Product Images */}
            <div className="flex gap-2">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded border">
                <img 
                  src="/placeholder-product.jpg" 
                  alt="Product" 
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw Options - Below the Card and Details */}
        <div className="space-y-4">
          <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3">
            Withdraw
          </Button>

          {/* Tip Message */}
          <div className="space-y-2">
            <Input
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              className="w-full bg-white border border-gray-300"
              placeholder="Enter your message..."
            />
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tipToCelebrate"
                checked={onlyTipToCelebrate}
                onChange={(e) => setOnlyTipToCelebrate(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="tipToCelebrate" className="text-sm text-gray-700">
                only tip to celebrate
              </label>
            </div>
          </div>
          
          {submitError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-800 text-sm font-medium">{submitError}</p>
            </div>
          )}

          {/* Tip Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {tipOptions.map((tip) => (
              <Button
                key={tip.amount}
                variant="outline"
                onClick={() => handleTipSelection(tip.amount)}
                className={`text-white border-gray-600 ${
                  selectedTipAmount === tip.amount 
                    ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                disabled={isSubmitting}
              >
                Tip {tip.amount} CATI ≈ {tip.usd} USDT
              </Button>
            ))}
          </div>
          
          {/* Selected tip amount display and final submission */}
          {selectedTipAmount && (
            <div className="space-y-3">
              <div className="text-center p-2 bg-blue-100 border border-blue-300 rounded-md">
                <p className="text-blue-800 text-sm font-medium">
                  Selected: {selectedTipAmount} CATI tip
                </p>
              </div>
              
              {/* Final Submission Button */}
              <Button 
                onClick={handleFinalSubmission}
                disabled={isSubmitting || !tipMessage.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                {isSubmitting ? 'Broadcasting...' : `Broadcast with ${selectedTipAmount} CATI Tip`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}