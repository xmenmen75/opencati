'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Sparkles, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import MessageDialog from './MessageDialog';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  seenAt?: string | null;
  sender: {
    nickname: string;
    walletAddress: string;
    profilePictureUrl?: string;
  };
  receiver: {
    nickname: string;
    walletAddress: string;
    profilePictureUrl?: string;
  };
  isCurrentUserSender: boolean;
  isCurrentUserReceiver: boolean;
  displayName: string;
  displayWalletAddress: string;
}

interface MessageInboxProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountUpdate?: () => void;
}

function MessageInbox({ isOpen, onClose, onUnreadCountUpdate }: MessageInboxProps) {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const inboxRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!isAuthenticated) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('opencati_auth_token');
      if (!token) {
        setMessages([]);
        return;
      }

      const response = await fetch('/api/messages/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchMessages();
    }
  }, [isOpen, isAuthenticated]);

  // Click away to close functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if MessageDialog is open
      if (selectedMessage) {
        return;
      }
      
      if (inboxRef.current && !inboxRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, selectedMessage]);

  const handleDeleteAll = async () => {
    if (!isAuthenticated) return;
    
    setDeletingAll(true);
    try {
      const token = localStorage.getItem('opencati_auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('/api/messages/remove', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteAll: true })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete all messages');
      }

      // Clear messages from UI
      setMessages([]);
      console.log('Deleted all messages:', result.totalDeleted);
      
    } catch (error) {
      console.error('Error deleting all messages:', error);
      // Optionally show error toast here
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!isAuthenticated) return;
    
    // Add to deleting set to show loading state
    setDeletingIds(prev => new Set(prev).add(messageId));
    
    try {
      const token = localStorage.getItem('opencati_auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('/api/messages/remove', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete message');
      }

      // Remove message from UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      console.log('Message deleted successfully');
      
    } catch (error) {
      console.error('Error deleting message:', error);
      // Optionally show error toast here
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleCloseDialog = () => {
    setSelectedMessage(null);
  };

  const handleMessageRead = (messageId: string) => {
    // Update local state to mark message as read
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, seenAt: new Date().toISOString() }
        : msg
    ));
  };

  const getReactionIcon = (reaction: string) => {
    switch (reaction) {
      case 'heart':
        return <Heart className="h-3 w-3 text-red-400" fill="currentColor" />;
      case 'confetti':
        return <Sparkles className="h-3 w-3 text-yellow-400" fill="currentColor" />;
      case 'thumbsup':
        return <ThumbsUp className="h-3 w-3 text-blue-400" fill="currentColor" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={inboxRef}
      className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteAll}
          disabled={deletingAll || loading}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {deletingAll ? 'Deleting...' : 'Del All'}
        </Button>
      </div>

      {/* Messages List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">No messages</div>
          </div>
        ) : (
          <div className="p-2">
            {messages.map((message) => {
              const isUnread = message.isCurrentUserReceiver && !message.seenAt;
              
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-b-0 cursor-pointer
                  `}
                  onClick={() => handleMessageClick(message)}
                >
                  {/* Avatar with unread indicator */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-gray-500 rounded"></div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    {/* Sender name */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`${message.isCurrentUserSender ? 'text-gray-600' : 'text-blue-600'} 
                        ${isUnread ? 'font-semibold' : 'font-medium'} text-sm truncate`}>
                          {message.isCurrentUserSender ? 'You' : message.displayName}
                        </h4>
                        {isUnread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(message.id);
                        }}
                        disabled={deletingIds.has(message.id)}
                        className={`p-0 h-auto transition-colors ${
                          deletingIds.has(message.id) 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Message text */}
                    <p className={`text-gray-700 text-sm mb-2 line-clamp-2 ${
                      isUnread ? 'font-medium' : ''
                    }`}>
                      {message.content}
                    </p>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Dialog */}
      {selectedMessage && (
        <MessageDialog
          isOpen={!!selectedMessage}
          onClose={handleCloseDialog}
          messageId={selectedMessage.id}
          onMessageRead={handleMessageRead}
          onUnreadCountUpdate={onUnreadCountUpdate}
        />
      )}
    </div>
  );
}

export default MessageInbox;