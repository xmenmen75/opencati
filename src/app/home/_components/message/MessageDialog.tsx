'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface MessageData {
  id: string;
  content: string;
  hasReply: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    nickname: string;
    walletAddress: string;
    profilePictureUrl?: string;
  };
  receiver: {
    id: string;
    nickname: string;
    walletAddress: string;
    profilePictureUrl?: string;
  };
  broadcast: {
    id: string;
    content: string;
    tipCati: number;
    onlyCelebrate: boolean;
    createdAt: string;
    userCard: {
      card: {
        name: string;
        rank: string;
        rarityColor: string;
      };
      user: {
        nickname: string;
        walletAddress: string;
      };
    };
  };
  reply: {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    sender: {
      id: string;
      nickname: string;
      walletAddress: string;
      profilePictureUrl?: string;
    };
  } | null;
  isCurrentUserSender: boolean;
  isCurrentUserReceiver: boolean;
  canReply: boolean;
}

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
}

function MessageDialog({ 
  isOpen, 
  onClose, 
  messageId
}: MessageDialogProps) {
  const [messageData, setMessageData] = useState<MessageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [catiAmount, setCatiAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const presetAmounts = [10, 100, 1000];

  const fetchMessage = async () => {
    if (!messageId) return;
    
    setLoading(true);
    setSubmitError(null);
    
    try {
      const token = localStorage.getItem('opencati_auth_token');
      if (!token) {
        setSubmitError('Authentication token not found. Please sign in again.');
        return;
      }

      const response = await fetch(`/api/messages/get?messageId=${messageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('opencati_auth_token');
          setSubmitError('Your session has expired. Please disconnect and reconnect your wallet to sign in again.');
        } else {
          setSubmitError(result.error || 'Failed to fetch message');
        }
        return;
      }

      setMessageData(result.message);
      
      // Pre-fill reply if it exists
      if (result.message.reply) {
        setReplyMessage(result.message.reply.content);
      }
      
    } catch (error) {
      console.error('Error fetching message:', error);
      setSubmitError('Failed to fetch message');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && messageId) {
      fetchMessage();
    }
  }, [isOpen, messageId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setMessageData(null);
      setReplyMessage('');
      setCatiAmount('');
      setSubmitError(null);
    }
  }, [isOpen]);

  const handleImageUpload = () => {
    // TODO: Implement image upload functionality
    toast.info('Image upload feature coming soon!');
  };

  const handleQuickReply = (message: string) => {
    setReplyMessage(message);
  };

  const handleSend = async () => {
    if (!replyMessage.trim() && !catiAmount) {
      setSubmitError('Please add a reply message or CATI amount');
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
      const payload = {
        messageId,
        content: replyMessage.trim(),
        catiAmount: finalCatiAmount
      };

      const token = localStorage.getItem('opencati_auth_token');
      if (!token) {
        setSubmitError('Authentication token not found. Please sign in again.');
        return;
      }

      const response = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          localStorage.removeItem('opencati_auth_token');
          setSubmitError('Your session has expired. Please disconnect and reconnect your wallet to sign in again.');
        } else {
          setSubmitError(result.error || 'Failed to send reply');
        }
        return;
      }
      
      toast.success('Reply sent successfully!');
      
      // Reset form
      setReplyMessage('');
      setCatiAmount('');
      
      // Close dialog
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-lg bg-white p-6">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-gray-800">
            {loading ? 'Loading...' : messageData ? `Messages from ${messageData.sender.nickname}` : 'Message'}
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

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading message...</div>
          </div>
        ) : !messageData ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Failed to load message</div>
          </div>
        ) : (
          <>
            {/* Sender wallet address */}
            <div className="text-sm text-gray-600 mb-4">
              {messageData.sender.walletAddress}
            </div>

            {/* Original message content */}
            <div className="mb-4">
              <p className="text-gray-800 text-sm leading-relaxed">
                {messageData.content}
              </p>
            </div>

            {/* Show existing reply if it exists */}
            {messageData.reply && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                <div className="text-xs text-gray-500 mb-1">
                  Your reply • {new Date(messageData.reply.createdAt).toLocaleString()}
                </div>
                <p className="text-gray-700 text-sm">
                  {messageData.reply.content}
                </p>
              </div>
            )}
          </>
        )}

        {/* Reply section */}
        {messageData && (
          <div className="border-t border-gray-200 pt-4">

            {!messageData.reply ? (
              messageData.canReply ? (
                <>
                  {/* Reply textarea with buttons */}
                  <div className="relative mb-4">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Enter your reply message..."
                      className="w-full h-24 p-3 pr-16 pb-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={255}
                    />
                    
                    {/* Image upload and quick reply buttons inside textarea */}
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

                      {/* Quick reply button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickReply('Thank you!')}
                        className="text-xs px-3 py-1 h-7 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        Thank you!
                      </Button>
                    </div>
                  </div>

                  {/* CATI amount section */}
                  <div className="mb-4">
                    {/* Custom amount input */}
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        type="number"
                        value={catiAmount}
                        onChange={(e) => setCatiAmount(e.target.value)}
                        placeholder="Input the CATI amount you want to send back"
                        className="flex-1"
                        min="1"
                      />
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                        CATI
                      </div>
                    </div>

                    {/* Preset amount buttons */}
                    <div className="flex gap-2">
                      {presetAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          onClick={() => setCatiAmount(amount.toString())}
                          className={`flex-1 text-sm ${
                            catiAmount === amount.toString()
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'border-gray-300 text-gray-700'
                          }`}
                        >
                          Tip {amount}CATI
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
                    disabled={isSubmitting || (!replyMessage.trim() && !catiAmount)}
                    className="w-full bg-gray-400 hover:bg-gray-500 text-white font-medium py-3"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reply'}
                  </Button>
                </>
              ) : (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-yellow-800 text-sm font-medium">
                    You cannot reply to this message.
                  </p>
                </div>
              )
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MessageDialog;
