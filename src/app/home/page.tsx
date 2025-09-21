'use client';

import { useState } from 'react';
import { PackOpening } from '@/app/home/_components/PackOpening';
import { TopBar } from '@/app/home/_components/TopBar';
import { OwnedCardsDialog } from '@/app/home/_components/OwnedCardsDialog';
import { SettingsDialog } from '@/app/home/_components/SettingsDialog';
import { LoadingPage } from '@/components/ui/Loading';
import { useWallet } from '../hooks/useWallet';
import { useOwnedCards, useSeasonRewards } from '@/hooks/queries';

function Home() {
  const { walletState, user, isAuthenticated, connectWallet, disconnectWallet, isCorrectNetwork, authError, clearAuthError, authLoading } = useWallet();
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  // Use React Query to fetch owned cards - only when user is authenticated
  const shouldFetchData = isAuthenticated && !!user;
  const { data: ownedCardsData, isLoading: cardsLoading, error: cardsError } = useOwnedCards({
    enabled: shouldFetchData
  });
  
  // Use React Query to fetch season rewards data - only when user is authenticated  
  const { data: seasonRewards, isLoading: seasonRewardsLoading } = useSeasonRewards({
    enabled: shouldFetchData
  });
  
  const handleSettings = () => {
    setIsSettingsDialogOpen(true);
  };



  const handleOpenCardsDialog = () => {
    setIsCardsDialogOpen(true);
  };

  // Check if user can access the game interface (wallet connected, authenticated, correct network)
  const canAccessGame = walletState.isConnected && isAuthenticated && isCorrectNetwork && user;
  
  // Check if user can open packs (needs CATI balance > 0)
  const canOpenPacks = canAccessGame && user && parseInt(user.catiBalance) > 0;
  
  // Check if wallet connection/auth is in progress
  const isLoading = walletState.isConnecting || authLoading;

  // Get user's owned cards for display
  const ownedCards = ownedCardsData || [];
  
  // Get user's reward amount from season rewards data
  const userRewardAmount = user && user.id && seasonRewards ? 
    seasonRewards.seasonRewards.find(reward => reward.user.id === user.id!.toString())?.rewardAmount || '0' 
    : undefined;
  
  // Get total pool amount from season rewards data
  const totalPoolAmount = seasonRewards?.poolInfo.totalPool;
  
  // Show loading page for initial authentication check
  if (authLoading && !walletState.isConnected) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#362A85] to-[#7F174C]">
      {/* Top Bar */}
      <TopBar
        walletState={walletState}
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        ownedCardsCount={ownedCards.length}
        totalPoolAmount={totalPoolAmount}
        userRewardAmount={userRewardAmount}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onSettings={handleSettings}
        onOpenCardsDialog={handleOpenCardsDialog}
      />

      {/* Main Content */}
      <div className="flex-1">
        {canAccessGame ? (
          <PackOpening canOpenPacks={canOpenPacks || false} />
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Connect Your Wallet to Play
              </h2>
              {/* Error States */}
              {/* {(walletState.error || authError) && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  {authError && (
                    <button 
                      onClick={clearAuthError}
                      className="ml-2 text-red-200 hover:text-white underline"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              )} */}
              {/* {cardsError && (
                <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/50 text-yellow-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  Failed to load cards data. Please try again.
                </div>
              )} */}
              {/* Loading State */}
              {(isLoading || cardsLoading) && (
                <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-400/50 text-purple-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connecting and authenticating...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Owned Cards Dialog */}
      <OwnedCardsDialog
        cards={ownedCards}
        isOpen={isCardsDialogOpen}
        onOpenChange={setIsCardsDialogOpen}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        user={user}
        isOpen={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      />
    </div>
  );
}

export default Home;
