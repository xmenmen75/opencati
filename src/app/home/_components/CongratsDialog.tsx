'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Sparkles, ThumbsUp, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface CongratsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientNickname: string;
  recipientWalletAddress: string;
}

type Reaction = 'heart' | 'confetti' | 'thumbsup' | null;

function CongratsDialog({ isOpen, onClose, recipientNickname, recipientWalletAddress }: CongratsDialogProps) {
  const [message, setMessage] = useState('');
  const [selectedReaction, setSelectedReaction] = useState<Reaction>(null);
  const [catiAmount, setCatiAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const presetAmounts = [10, 100, 1000];

  const handleReactionSelect = (reaction: Reaction) => {
    setSelectedReaction(selectedReaction === reaction ? null : reaction);
  };

  const handleCustomAmountChange = (value: string) => {
    setCatiAmount(value);
  };

  const handleImageUpload = () => {
    // TODO: Implement image upload functionality
    toast.info('Image upload feature coming soon!');
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedReaction && !catiAmount) {
      setSubmitError('Please add a message, reaction, or CATI amount');
      return;
    }

    const finalCatiAmount = catiAmount ? parseInt(catiAmount) : 0;

    if (catiAmount && isNaN(parseInt(catiAmount))) {
      setSubmitError('Please enter a valid CATI amount');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // TODO: Implement API call to send congratulations message
      const payload = {
        recipientWalletAddress,
        message: message.trim(),
        reaction: selectedReaction,
        catiAmount: finalCatiAmount
      };

      console.log('Sending congratulations:', payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Congratulations sent successfully!');
      
      // Reset form
      setMessage('');
      setSelectedReaction(null);
      setCatiAmount('');
      
      // Close dialog
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send congratulations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReactionIcon = (reaction: Reaction) => {
    switch (reaction) {
      case 'heart':
        return <Heart className="h-5 w-5" fill={selectedReaction === 'heart' ? 'currentColor' : 'none'} />;
      case 'confetti':
        return <Sparkles className="h-5 w-5" fill={selectedReaction === 'confetti' ? 'currentColor' : 'none'} />;
      case 'thumbsup':
        return <ThumbsUp className="h-5 w-5" fill={selectedReaction === 'thumbsup' ? 'currentColor' : 'none'} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-md bg-white p-6">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Message to: {recipientNickname}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Recipient wallet address */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">
            {recipientWalletAddress}
          </span>
          <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
          </div>
        </div>

        {/* Message textarea */}
        <div className="mb-4">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full h-24 p-3 pr-16 pb-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={255}
            />
            
            {/* Image upload and reactions inside textarea */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              {/* Image upload button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImageUpload}
                className="p-1 h-7 w-7 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              >
                <Plus className="h-4 w-4" />
              </Button>

              {/* Reaction buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReactionSelect('heart')}
                  className={`p-1 h-7 w-7 hover:bg-gray-100 ${
                    selectedReaction === 'heart' 
                      ? 'bg-red-100 text-red-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {getReactionIcon('heart')}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReactionSelect('confetti')}
                  className={`p-1 h-7 w-7 hover:bg-gray-100 ${
                    selectedReaction === 'confetti' 
                      ? 'bg-yellow-100 text-yellow-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {getReactionIcon('confetti')}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReactionSelect('thumbsup')}
                  className={`p-1 h-7 w-7 hover:bg-gray-100 ${
                    selectedReaction === 'thumbsup' 
                      ? 'bg-blue-100 text-blue-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {getReactionIcon('thumbsup')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CATI amount section */}
        <div className="mb-4">
          {/* Combined amount input with preset buttons */}
          <div className="flex items-center gap-2 mb-3">
            <Input
              type="number"
              value={catiAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="Input the CATI amount you want to send"
              className="flex-1"
              min="1"
            />
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
              CATI
            </div>
          </div>

          {/* Preset amount buttons that populate the input */}
          <div className="flex gap-2">
            {presetAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => setCatiAmount(amount.toString())}
                className={`flex-1 ${
                  catiAmount === amount.toString()
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                {amount} CATI
              </Button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {submitError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-800 text-sm font-medium">{submitError}</p>
          </div>
        )}

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={isSubmitting}
          className="w-full bg-gray-400 hover:bg-gray-500 text-white font-medium py-3"
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default CongratsDialog;