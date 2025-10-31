'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, Clock, Coins, GripHorizontal, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBroadcastSSE } from '@/hooks/useBroadcastSSE';
import { useAuth } from '@/hooks/useAuth';
import CongratsDialog from './CongratsDialog';
import { UserTeam } from '@prisma/client';

interface Broadcast {
  id: string;
  userCardId: string;
  content: string;
  tipCati: number;
  onlyCelebrate: boolean;
  createdAt: string;
  userCard: {
    user: {
      userNickname: string;
      profilePictureUrl?: string;
      walletAddress: string;
      userTeam: UserTeam
    };
    card: {
      name: string;
      rank: string;
      rarityColor: string;
    };
  };
}

interface BroadcastChannelProps {
  className?: string;
}

function BroadcastChannel({ className }: BroadcastChannelProps) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [height, setHeight] = useState(160); // Default height showing some messages
  const [loading, setLoading] = useState(true); // Start with loading true to prevent hydration mismatch
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const [hasMoreBroadcasts, setHasMoreBroadcasts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false); // Track client-side mounting
  const [loadingMore, setLoadingMore] = useState(false);
  const [congratsDialogOpen, setCongratsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    nickname: string;
    walletAddress: string;
    broadcastId: string;
    userTeam: UserTeam
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const MIN_HEIGHT = 100; 
  const MAX_HEIGHT = 400; 
  const BROADCASTS_LIMIT = 10;

  // SSE connection for real-time updates
  const { connectionStatus, newBroadcast, clearNewBroadcast, reconnect } = useBroadcastSSE();
  
  // Get current user for self-check
  const { user } = useAuth();

  // Track previous connection status to detect reconnections
  const [prevConnectionStatus, setPrevConnectionStatus] = useState<string>('disconnected');

  // Fetch broadcasts function
  const fetchBroadcasts = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await fetch(`/api/broadcasts?limit=${BROADCASTS_LIMIT}&page=${page}`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setBroadcasts(prev => [...data.broadcasts.reverse(), ...prev]); // Prepend older messages at the top (reverse API order)
        } else {
          setBroadcasts(data.broadcasts.reverse()); // Reverse to show newest at bottom
        }
        setHasMoreBroadcasts(data.pagination.hasNextPage);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch broadcasts, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Set client flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load broadcasts when component mounts (only on client)
  useEffect(() => {
    if (isClient) {
      fetchBroadcasts(1, false);
    }
  }, [isClient]);

  // Handle new broadcasts from SSE
  useEffect(() => {
    if (newBroadcast && isClient) {
      setBroadcasts(prev => [...prev, newBroadcast]);
      clearNewBroadcast();
      
      // Auto-scroll to new message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [newBroadcast, isClient, clearNewBroadcast]);

  // Refresh when SSE reconnects after being disconnected
  useEffect(() => {
    if (connectionStatus === 'connected' && prevConnectionStatus !== 'connected' && isClient && prevConnectionStatus !== 'disconnected') {
      fetchBroadcasts(1, false);
    }
    setPrevConnectionStatus(connectionStatus);
  }, [connectionStatus, prevConnectionStatus, isClient]);

  // Fallback: Listen for manual refresh events
  useEffect(() => {
    const handleManualRefresh = () => {
      fetchBroadcasts(1, false);
    };

    window.addEventListener('broadcast-refresh', handleManualRefresh);
    return () => {
      window.removeEventListener('broadcast-refresh', handleManualRefresh);
    };
  }, []);

  // Polling fallback: Check for updates every 30 seconds if SSE is not connected
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (connectionStatus !== 'connected' && isClient) {
        fetchBroadcasts(1, false);
      }
    }, 30000); 

    return () => clearInterval(pollInterval);
  }, [connectionStatus, isClient]);

  // Auto-scroll to bottom when new messages arrive (only for initial load)
  useEffect(() => {
    if (messagesEndRef.current && !loadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: currentPage === 1 ? 'smooth' : 'auto' });
    }
  }, [broadcasts, loadingMore, currentPage]);

  // Handle scroll to load more messages
  const handleScroll = async () => {
    if (!messagesContainerRef.current || loadingMore || !hasMoreBroadcasts) return;
    
    const { scrollTop } = messagesContainerRef.current;
    
    // Load more when scrolled near the top (within 50px)
    if (scrollTop <= 50) {
      const nextPage = currentPage + 1;
      const prevScrollHeight = messagesContainerRef.current.scrollHeight;
      await fetchBroadcasts(nextPage, true);
      
      // Maintain scroll position after loading older messages
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight + scrollTop;
        }
      }, 100);
    }
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(height);
    e.preventDefault();
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = dragStartY - e.clientY; // Inverted because we want dragging up to expand
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, dragStartHeight + deltaY));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStartY, dragStartHeight]);

  // Refresh broadcasts
  const refreshBroadcasts = () => {
    fetchBroadcasts(1, false);
  };

  // Handle opening congrats dialog for a specific user
  const handleUserClick = (nickname: string, walletAddress: string, broadcastId: string,
    userTeam: UserTeam
  ) => {
    // Don't allow users to send congrats to themselves
    if (user?.walletAddress === walletAddress) {
      return;
    }
    setSelectedUser({ nickname, walletAddress, broadcastId, userTeam });
    setCongratsDialogOpen(true);
  };

  // Handle closing congrats dialog
  const handleCongratsDialogClose = () => {
    setCongratsDialogOpen(false);
    setSelectedUser(null);
  };

  const formatTimeAgo = (dateString: string) => {
    // Prevent hydration mismatch by only calculating on client
    if (!isClient) return 'loading...';
    
    const now = new Date();
    const messageTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'SS': return 'text-red-400';
      case 'S': return 'text-orange-400';
      case 'AA': return 'text-blue-400';
      case 'A': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const isMinimal = height <= MIN_HEIGHT + 10;

  // Prevent hydration mismatch by showing consistent loading on first render
  if (!isClient) {
    return (
      <div className={`bg-gray-800 border-t border-gray-700 transition-all duration-150 ${className}`}>
        <div className="flex items-center justify-center py-1 border-b border-gray-700">
          <GripHorizontal className="h-4 w-4 text-gray-500" />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium text-sm">Broadcast Channel</span>
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
              0
            </span>
          </div>
          <div className="text-xs text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }
console.log(broadcasts[0])
  return (
    <div 
      ref={containerRef}
      className={`bg-gray-800 border-t border-gray-700 transition-all duration-150 ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Drag handle */}
      <div 
        className="flex items-center justify-center py-1 cursor-ns-resize hover:bg-gray-700 border-b border-gray-700"
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal className="h-4 w-4 text-gray-500" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <span className="text-white font-medium text-sm">Broadcast Channel</span>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
            {broadcasts.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">          
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 hover:bg-gray-700"
            onClick={refreshBroadcasts}
            disabled={loading}
          >
            <RotateCcw className={`h-3 w-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Messages container */}
      {!isMinimal && (
        <div className="flex-1 border-t border-gray-700 overflow-hidden">
          <div 
            ref={messagesContainerRef}
            className="overflow-y-auto bg-gray-900 p-2 space-y-2 scrollbar-hide"
            style={{ height: `${height - 80}px`, scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Subtract header and drag handle height (more accurate)
            onScroll={handleScroll}
          >

            
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-sm">Loading broadcasts...</div>
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-sm">No broadcasts yet</div>
              </div>
            ) : (
              <>
                {/* Loading more indicator at top */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-3">
                    <div className="text-gray-400 text-sm">Loading older messages...</div>
                  </div>
                )}
                
                {/* Scroll up hint for more messages */}
                {hasMoreBroadcasts && broadcasts.length > 0 && !loadingMore && (
                  <div className="flex items-center justify-center py-2">
                    <div className="text-gray-500 text-xs">↑ Scroll up to load more messages</div>
                  </div>
                )}
                
                {/* Show message when no more broadcasts */}
                {!hasMoreBroadcasts && broadcasts.length > 0 && (
                  <div className="flex items-center justify-center py-3">
                    <div className="text-gray-500 text-xs">No more messages to load</div>
                  </div>
                )}
                
                {/* Broadcast messages */}

                {/* All broadcasts in one box, no scrollbar */}
                <div
                  className="rounded-lg p-3 border bg-gray-800 border-gray-700 max-h-[250px] overflow-y-auto"
                  style={{
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE/Edge
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <style>{`
                    .rounded-lg::-webkit-scrollbar { display: none; }
                  `}</style>
                  {broadcasts.map((broadcast) => {
                    const self = broadcast.userCard.user.walletAddress === user?.walletAddress;
                    return (
                      <div key={broadcast.id} className="flex flex-row items-baseline 
                      gap-[5px] mb-4 last:mb-0">
                        <div className="flex mb-1">
                          <span
                            className={`text-sm font-medium underline
                              ${self ? 'text-blue-300' : 'text-blue-400'} ${!self ? 'cursor-pointer hover:underline hover:text-blue-300' : ''}`}
                            onClick={() => !self && handleUserClick(
                              broadcast.userCard.user.userNickname,
                              broadcast.userCard.user.walletAddress,
                              broadcast.id,
                              broadcast.userCard.user.userTeam
                            )}
                          >
                            {broadcast.userCard.user.walletAddress.trim().slice(0, 6) +
                              '***' + broadcast.userCard.user.walletAddress.trim().slice(-3)}
                            &nbsp;
                            {broadcast.userCard.user.userNickname}
                            {self && ' (You)'}
                          </span>
                        </div>
                        <span className="text-white">&gt;&gt;&gt;</span>
                        <span className="text-white text-sm">{broadcast.content}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Congrats Dialog */}
      {selectedUser && (
        <CongratsDialog
          isOpen={congratsDialogOpen}
          onClose={handleCongratsDialogClose}
          recipientNickname={selectedUser.nickname}
          recipientWalletAddress={selectedUser.walletAddress}
          recipientTeam={selectedUser.userTeam}
          broadcastId={selectedUser.broadcastId}
        />
      )}
    </div>
  );
}

export default BroadcastChannel;