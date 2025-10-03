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
  seenAt?: string | null;
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
  onMessageRead?: (messageId: string) => void;
  onUnreadCountUpdate?: () => void;
}

function MessageDialog({ 
  isOpen, 
  onClose, 
  messageId,
  onMessageRead,
  onUnreadCountUpdate
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
      
      // Mark message as read if current user is receiver and message is unread
      if (result.message.isCurrentUserReceiver && !result.message.seenAt) {
        try {
          const readResponse = await fetch('/api/messages/read', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messageId }),
          });
          
          // If successful, notify parent components
          if (readResponse.ok) {
            if (onMessageRead) {
              onMessageRead(messageId);
            }
            // Update unread count in TopBar
            if (onUnreadCountUpdate) {
              onUnreadCountUpdate();
            }
          }
        } catch (error) {
          console.error('Error marking message as read:', error);
          // Don't show error to user for this background operation
        }
      }
      
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
            {loading ? 'Loading...' : messageData ? (
              messageData.isCurrentUserSender 
                ? `Message to ${messageData.receiver.nickname}` 
                : `Message from ${messageData.sender.nickname}`
            ) : 'Message'}
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
            {/* Show appropriate address based on user role */}
            <div className="text-sm text-gray-600 mb-4">
              {messageData.isCurrentUserSender 
                ? messageData.receiver.walletAddress 
                : messageData.sender.walletAddress}
            </div>

            {/* Original message content */}
            <div className="mb-4">
              <p className="text-gray-800 text-sm leading-relaxed">
                {messageData.content}
              </p>
            </div>

            {/* Always show divider and reply section */}
            <hr className="border-gray-200 my-4" />
            <div className="mb-4">
              {messageData.reply ? (
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Reply:</span> {messageData.reply.content}
                </p>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No reply yet
                </p>
              )}
            </div>
          </>
        )}

        {/* Reply section - only show if current user is receiver */}
        {messageData && !messageData.isCurrentUserSender && (
          <div className="border-t border-gray-200 pt-4">
            {!messageData.reply ? (
              messageData.canReply ? (
                <>
                  {/* Simplified reply textarea */}
                  <div className="mb-4">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Enter your reply message..."
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none
                      focus:ring-2 focus:ring-blue-500"
                      maxLength={255}
                    />
                  </div>

                  {/* Simplified CATI amount section */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={catiAmount}
                        onChange={(e) => setCatiAmount(e.target.value)}
                        placeholder="CATI amount (optional)"
                        className="flex-1"
                        min="1"
                      />
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                        CATI
                      </div>
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
                    disabled={isSubmitting || !replyMessage.trim()}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2"
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
