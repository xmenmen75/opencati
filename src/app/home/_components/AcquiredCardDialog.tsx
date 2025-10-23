'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface UserCardDetails {
  id: string;
  userId: string;
  cardId: number;
  seasonId: string;
  catiSpent: string;
  catiReward: string | null;
  acquiredAt: string;
  user: {
    id: string;
    walletAddress: string;
    userNickname: string;
    profilePictureUrl: string | null;
  };
  card: {
    id: number;
    name: string;
    rank: string;
    imageUrl: string;
    rarityColor: string;
    designer: string;
  };
  season: {
    id: string;
    name: string;
    slogan: string;
    startDate: string;
    endDate: string;
    bidPoolAmount: string;
    additionalTotalPool: string;
    status: string;
  };
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
  const [cardDetails, setCardDetails] = useState<UserCardDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch card details when dialog opens
  useEffect(() => {
    if (isOpen && userCardId) {
      fetchCardDetails();
    }
  }, [isOpen, userCardId]);

  const fetchCardDetails = async () => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const data: UserCardDetails = await apiClient.get(`/api/cards/owned/${userCardId}`);
      setCardDetails(data);
      
      // Update tip message with actual rank
      setTipMessage(`I got a ${data.card.rank} rank card.`);
    } catch (error) {
      console.error('Error fetching card details:', error);
      let errorMessage = 'Failed to fetch card details';
      
      if (error instanceof Error) {
        // Handle specific authentication errors
        if (error.message.includes('No authentication token') || 
            error.message.includes('Invalid token') ||
            error.message.includes('expired')) {
          errorMessage = 'Please log in again to view card details';
        } else {
          errorMessage = error.message;
        }
      }
      
      setFetchError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
      await apiClient.post('/api/cards/broadcast', {
        user_card_id: userCardId,
        content: tipMessage.trim(),
        only_celebrate: onlyTipToCelebrate,
        tip_cati: selectedTipAmount
      });

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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600">Loading card details...</span>
          </div>
        )}

        {/* Error State */}
        {fetchError && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-md mb-4">
            <p className="text-red-800 text-sm font-medium">{fetchError}</p>
            <Button 
              onClick={fetchCardDetails} 
              className="mt-2 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Card Content */}
        {cardDetails && !isLoading && (
          <>
            {/* Card Image and Details - Side by Side */}
            <div className="flex gap-6 mb-6">
              {/* Card Image */}
              <div className="flex-shrink-0">
                <div className="relative w-64 h-80 rounded-lg overflow-hidden border border-white 
                bg-gradient-to-b from-purple-900 via-blue-800 to-purple-900">
                  <img 
                    src={cardDetails.card.imageUrl} 
                    alt={cardDetails.card.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Rank Badge */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-bold">
                    {cardDetails.card.rank}
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="flex-1 space-y-4">
                {/* Card Name */}
                <h3 className="text-lg font-bold text-black">{cardDetails.card.name}</h3>

                {/* Acquired Date */}
                <div className="text-sm text-gray-800">
                  Acquired Date: {new Date(cardDetails.acquiredAt).toLocaleDateString()}
                </div>

                {/* CATI Spent */}
                <div className="text-sm text-gray-800">
                  CATI Spent: {cardDetails.catiSpent} CATI
                </div>

                {/* Reward Info */}
                <div className="text-sm text-gray-800">
                  {cardDetails.catiReward ? (
                    <>({cardDetails.catiReward}) CATI is rewarded by{' '}</>
                  ) : (
                    'Reward pending - '
                  )}
                  <span className="text-blue-600 underline cursor-pointer">OpenCati</span>
                </div>

                {/* Season Info */}
                <div className="text-sm text-gray-700 bg-gray-200 p-2 rounded">
                  <div className="font-semibold">Season: {cardDetails.season.name}</div>
                  <div>{cardDetails.season.slogan}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(cardDetails.season.startDate).toLocaleDateString()} - {new Date(cardDetails.season.endDate).toLocaleDateString()}
                  </div>
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
          </>
        )}

        {/* Withdraw Options - Below the Card and Details */}
        {cardDetails && !isLoading && (
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
        )}
      </DialogContent>
    </Dialog>
  );
}