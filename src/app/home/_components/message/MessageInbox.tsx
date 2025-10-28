'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Sparkles, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import MessageDialog from './MessageDialog';


interface Thread {
  id: string;
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
  latestMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<{
    threadId: string;
    sender: Thread['sender'];
    receiver: Thread['receiver'];
    isCurrentUserSender: boolean;
    isCurrentUserReceiver: boolean;
    displayName: string;
    displayWalletAddress: string;
  } | null>(null);
  const inboxRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async () => {
    if (!isAuthenticated) {
      setThreads([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('opencati_auth_token');
      if (!token) {
        setThreads([]);
        return;
      }

      const response = await fetch('/api/threads/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }

      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchThreads();
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
        throw new Error(result.error || 'Failed to delete all threads');
      }
      // Clear threads from UI
      setThreads([]);
      console.log('Deleted all threads:', result.totalDeleted);
    } catch (error) {
      console.error('Error deleting all threads:', error);
      // Optionally show error toast here
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!isAuthenticated) return;
    setDeletingIds(prev => new Set(prev).add(threadId));
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
        body: JSON.stringify({ threadId })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete thread');
      }
      // Remove thread from UI
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
      console.log('Thread deleted successfully');
    } catch (error) {
      console.error('Error deleting thread:', error);
      // Optionally show error toast here
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(threadId);
        return newSet;
      });
    }
  };

  const handleThreadClick = (thread: Thread) => {
    setSelectedMessage({
      threadId: thread.id,
      sender: thread.sender,
      receiver: thread.receiver,
      isCurrentUserSender: thread.isCurrentUserSender,
      isCurrentUserReceiver: thread.isCurrentUserReceiver,
      displayName: thread.displayName,
      displayWalletAddress: thread.displayWalletAddress,
    });
  };

  const handleCloseDialog = () => {
    setSelectedMessage(null);
  };

  // Remove handleMessageRead and setMessages logic, as threads API does not provide seenAt or message-level read state

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

      {/* Threads List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading threads...</div>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">No threads</div>
          </div>
        ) : (
          <div className="p-2">
            {threads.map((thread) => {
              // Always display the other party (not the current user)
              const otherParty = thread.isCurrentUserSender ? thread.receiver : thread.sender;
              const isUnread = false;
              return (
                <div
                  key={thread.id}
                  className={`flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-b-0 cursor-pointer`}
                  onClick={() => handleThreadClick(thread)}
                >
                  {/* Avatar with unread indicator */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                      {otherParty.profilePictureUrl ? (
                        <img src={otherParty.profilePictureUrl} alt={otherParty.nickname} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-500 rounded"></div>
                      )}
                    </div>
                  </div>

                  {/* Thread Content */}
                  <div className="flex-1 min-w-0">
                    {/* Other party name */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-blue-600 ${isUnread ? 'font-semibold' : 'font-medium'} text-sm truncate`}>
                          {otherParty.nickname}
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
                          handleDeleteThread(thread.id);
                        }}
                        disabled={deletingIds.has(thread.id)}
                        className={`p-0 h-auto transition-colors ${
                          deletingIds.has(thread.id) 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Latest message text */}
                    <p className={`text-gray-700 text-sm mb-2 line-clamp-2 ${
                      isUnread ? 'font-medium' : ''
                    }`}>
                      {thread.latestMessage ? thread.latestMessage.content : '(No messages yet)'}
                    </p>
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
          threadId={selectedMessage.threadId}
          onUnreadCountUpdate={onUnreadCountUpdate}
        />
      )}
    </div>
  );
}

export default MessageInbox;