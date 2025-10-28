'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CatiAmountSelector from '@/components/CatiAmountSelector';
import { X, Plus, Heart, Sparkles, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { sliceAddress } from '@/utils/slice-address';
import { useAuth } from '@/hooks/useAuth';


interface ThreadData {
  id: string;
  reaction?: string | null;
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
  messages: Array<{
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
  }>;
  isCurrentUserSender: boolean;
  isCurrentUserReceiver: boolean;
  displayName: string;
  displayWalletAddress: string;
}


interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
  onUnreadCountUpdate?: () => void;
}

function MessageDialog({ isOpen, onClose, threadId, onUnreadCountUpdate }: MessageDialogProps) {
  const [threadData, setThreadData] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [catiAmount, setCatiAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const presetAmounts = [10, 100, 1000];
  const { user } = useAuth();
  const getReactionIcon = (reaction: string) => {
    switch (reaction?.toLowerCase()) {
      case 'heart':
        return <Heart className="h-4 w-4 text-red-500" fill="currentColor" />;
      case 'confetti':
        return <Sparkles className="h-4 w-4 text-yellow-500" fill="currentColor" />;
      case 'thumbsup':
        return <ThumbsUp className="h-4 w-4 text-blue-500" fill="currentColor" />;
      default:
        return null;
    }
  };
  const fetchThread = async () => {
    if (!threadId) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem('opencati_auth_token');
      if (!token) {
        setSubmitError('Authentication token not found. Please sign in again.');
        return;
      }
      const response = await fetch(`/api/threads/get?threadId=${threadId}`, {
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
          setSubmitError(result.error || 'Failed to fetch thread');
        }
        return;
      }
      setThreadData(result.thread);
    } catch (error) {
      console.error('Error fetching thread:', error);
      setSubmitError('Failed to fetch thread');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && threadId) {
      fetchThread();
    }
  }, [isOpen, threadId]);

  useEffect(() => {
    if (!isOpen) {
      setThreadData(null);
      setSubmitError(null);
    }
  }, [isOpen]);

  // Send message handler
  const handleSend = async () => {
    if (!replyMessage.trim() && !catiAmount) {
      setSubmitError('Please enter a message or CATI amount');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem('opencati_auth_token');
      if (!token) {
        setSubmitError('Authentication token not found. Please sign in again.');
        setIsSubmitting(false);
        return;
      }
      const res = await fetch('/api/threads/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId,
          content: replyMessage,
          catiAmount: catiAmount ? parseInt(catiAmount) : undefined
        })
      });
      const result = await res.json();
      if (!res.ok) {
        setSubmitError(result.error || 'Failed to send message');
        setIsSubmitting(false);
        return;
      }
      toast.success('Message sent!');
      setReplyMessage('');
      setCatiAmount('');
      // Optionally refresh thread
      fetchThread();
    } catch (error) {
      setSubmitError('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-lg bg-white p-6">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {loading ? 'Loading...' : threadData ? (
              <>
                <span>
                  {threadData.sender.id === user?.id
                    ? `To ${threadData.receiver.nickname}(${sliceAddress(threadData.receiver.walletAddress)})`
                    : `From ${threadData.sender.nickname}(${sliceAddress(threadData.sender.walletAddress)})`}
                </span>
                {threadData.reaction && getReactionIcon(threadData.reaction)}
              </>
            ) : 'Conversation'}
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
            <div className="text-gray-500">Loading conversation...</div>
          </div>
        ) : !threadData ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Failed to load conversation</div>
          </div>
        ) : (
          <>
          <div>
                <>
                  {/* Simplified reply textarea */}
                  <div className="mb-4">
                    <label>
                      Reply to 
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Enter your reply message..."
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none
                      focus:ring-2 focus:ring-blue-500 mt-2"
                      maxLength={255}
                    />
                  </div>

                  {/* CATI amount selector */}
                  <CatiAmountSelector
                    value={catiAmount}
                    onChange={setCatiAmount}
                    presetAmounts={presetAmounts}
                  />

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
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </Button>

                  {/* a divider here */}
                  <div className="my-4 border-t border-gray-200" />

                  {/* currentUser on right, the other party on left, with message bubble */}
                  <div className="mb-4">
                    {threadData.messages.length === 0 ? (
                      <div className="text-gray-500 text-sm">No messages yet.</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {threadData.messages.map((msg) => {
                          // Ensure both are strings for comparison
                          const isCurrentUser = String(msg.sender.id) === String(user?.id);
                          return (
                            <div
                              key={msg.id}
                              className={`flex items-start ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              {/* Profile circle */}
                              {!isCurrentUser && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 mt-0.5" />
                              )}
                              <div
                                className={`max-w-xs px-4 py-2 rounded-lg shadow-sm text-sm ${
                                  isCurrentUser
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}
                                style={{
                                  backgroundColor: '#f3f4f6',
                                  color: '#1f2937'
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-normal">
                                    {msg.content} -- {(() => {
                                      const d = new Date(msg.createdAt);
                                      const month = String(d.getMonth() + 1).padStart(2, '0');
                                      const day = String(d.getDate()).padStart(2, '0');
                                      const hour = String(d.getHours()).padStart(2, '0');
                                      const min = String(d.getMinutes()).padStart(2, '0');
                                      return `${month}/${day} ${hour}:${min}`;
                                    })()}
                                  </span>
                                </div>
                              </div>
                              {/* Profile circle for current user */}
                              {isCurrentUser && (
                                <div className="w-8 h-8 rounded-full bg-blue-300 ml-2 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MessageDialog;
