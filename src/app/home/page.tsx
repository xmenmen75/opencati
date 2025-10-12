'use client';

import { useState, useEffect } from 'react';
import { PackOpening } from '@/app/home/_components/PackOpening';
import { TopBar } from '@/app/home/_components/TopBar';
import { OwnedCardsDialog } from '@/app/home/_components/OwnedCardsDialog';
import { SettingsDialog } from '@/app/home/_components/SettingsDialog';
import { CatiManagementDialog } from '@/app/home/_components/CatiManagementDialog';
import { LoadingPage } from '@/components/ui/Loading';
import { Button } from '@/components/ui/button';
import { useWallet } from '../hooks/useWallet';
import { useOwnedCards, useSeasonRewards, useActiveSeasons, useCurrentSeason } from '@/hooks/queries';

function Home() {
  const { walletState, user, isAuthenticated, connectWallet, disconnectWallet, isCorrectNetwork, authError, clearAuthError, authLoading, cancelAuthentication } = useWallet();
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isCatiManagementDialogOpen, setIsCatiManagementDialogOpen] = useState(false);
  const [isPackAnimating, setIsPackAnimating] = useState(false);
  
  // Use React Query to fetch owned cards - only when user is authenticated
  const shouldFetchData = isAuthenticated && !!user;
  const { data: ownedCardsData, isLoading: cardsLoading, error: cardsError } = useOwnedCards({
    enabled: shouldFetchData
  });
  
  // Use React Query to fetch season rewards data - only when user is authenticated  
  const { data: seasonRewards, isLoading: seasonRewardsLoading } = useSeasonRewards({
    enabled: shouldFetchData
  });
  
  // Use React Query to fetch current season (active or most recently ended)
  const { data: currentSeasonData } = useCurrentSeason();
  const { data: activeSeasons } = useActiveSeasons(); // Keep for backward compatibility
  
  // Keep stable data during pack animation
  const [stableOwnedCardsData, setStableOwnedCardsData] = useState<typeof ownedCardsData>(undefined);
  const [stableSeasonRewards, setStableSeasonRewards] = useState<typeof seasonRewards>(undefined);
  
  // Update stable data when not animating
  useEffect(() => {
    if (!isPackAnimating) {
      if (ownedCardsData) setStableOwnedCardsData(ownedCardsData);
      if (seasonRewards) setStableSeasonRewards(seasonRewards);
    }
  }, [ownedCardsData, seasonRewards, isPackAnimating]);
  
  const handleSettings = () => {
    setIsSettingsDialogOpen(true);
  };

  const handleOpenCardsDialog = () => {
    setIsCardsDialogOpen(true);
  };

  const handleOpenCatiManagement = () => {
    setIsCatiManagementDialogOpen(true);
  };

  // Check if user can access the game interface (wallet connected, authenticated, correct network)
  const canAccessGame = walletState.isConnected && isAuthenticated && isCorrectNetwork && !!user;
  
  // Check if user can open packs (needs active season and enough balance)
  const hasActiveSeason = currentSeasonData?.canOpenPacks ?? false;
  const hasEnoughBalance = user && parseInt(user.catiBalance) >= 500;
  const canOpenPacks = canAccessGame && hasActiveSeason && hasEnoughBalance;
  
  // Check if wallet connection/auth is in progress
  const isLoading = walletState.isConnecting || authLoading;

  // Get user's owned cards for display - use stable data during animation
  const ownedCards = (isPackAnimating ? stableOwnedCardsData : ownedCardsData) || [];
  
  // Get season rewards data - use stable data during animation  
  const currentSeasonRewards = isPackAnimating ? stableSeasonRewards : seasonRewards;
  
  // Get bid pool amount (for Pool Amt display) from season rewards data
  const totalPoolAmount = currentSeasonRewards?.poolInfo.bidPoolAmount;
  
  // Get additional total pool (for Reward display) from season rewards data
  const userRewardAmount = currentSeasonRewards?.poolInfo.additionalTotalPool;
  
  // Show loading page for initial authentication check
  if (authLoading && !walletState.isConnected) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#08080A] to-[#160218]">
      {/* Top Bar */}
      <TopBar
        walletState={walletState}
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        ownedCardsCount={ownedCards.length}
        totalPoolAmount={totalPoolAmount}
        userRewardAmount={userRewardAmount}
        onchainBalance="0.0" // TODO: Get actual onchain balance
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onSettings={handleSettings}
        onOpenCardsDialog={handleOpenCardsDialog}
        onOpenCatiManagement={handleOpenCatiManagement}
      />

      {/* Main Content */}
      <div className="flex-1">
        {canAccessGame ? (
          <PackOpening 
            canOpenPacks={canOpenPacks ?? false} 
            onAnimationStateChange={setIsPackAnimating}
            activeSeason={currentSeasonData?.currentSeason || activeSeasons?.[0]}
            hasActiveSeason={hasActiveSeason}
            hasEnoughBalance={hasEnoughBalance ?? false}
          />
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
              {/* Error States */}
              {(walletState.error || authError) && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-4 py-3 rounded-lg max-w-md mx-auto mb-4">
                  <div className="text-center">
                    <p className="mb-3">{walletState.error || (typeof authError === 'string' ? authError : 'Authentication failed')}</p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={() => {
                          clearAuthError();
                          // Clear wallet error by attempting reconnection
                          if (walletState.error) {
                            connectWallet();
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Try Again
                      </Button>
                      {authError && (
                        <Button 
                          onClick={clearAuthError}
                          variant="outline"
                          className="border-red-400 text-red-200 hover:bg-red-500/20"
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {cardsError && (
                <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/50 text-yellow-100 px-4 py-3 rounded-lg max-w-md mx-auto mb-4">
                  Failed to load cards data. Please try refreshing the page.
                </div>
              )}
              {/* Loading State */}
              {(isLoading || cardsLoading) && !(walletState.error || authError) && (
                <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-400/50 text-purple-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>
                        {walletState.isConnecting ? 'Connecting to MetaMask...' : 
                         authLoading ? 'Waiting for signature...' : 
                         cardsLoading ? 'Loading game data...' : 'Loading...'}
                      </span>
                    </div>
                    {authLoading && (
                      <div className="text-sm text-purple-200 space-y-3">
                        <div>
                          <p className="font-medium">Please check MetaMask</p>
                          <p>• If MetaMask is locked, unlock it first</p>
                          <p>• Sign the message to authenticate</p>
                        </div>
                        <Button 
                          onClick={cancelAuthentication}
                          variant="outline"
                          size="sm"
                          className="border-purple-400 text-purple-200 hover:bg-purple-500/20"
                        >
                          Cancel Authentication
                        </Button>
                      </div>
                    )}
                    {walletState.isConnecting && !authLoading && (
                      <div className="text-sm text-purple-200">
                        <p>Please check MetaMask and approve the connection request.</p>
                        <p>If MetaMask is locked, unlock it first.</p>
                      </div>
                    )}
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

      {/* CATI Management Dialog */}
      <CatiManagementDialog
        isOpen={isCatiManagementDialogOpen}
        onClose={() => setIsCatiManagementDialogOpen(false)}
        onchainBalance="0.0" // TODO: Get actual onchain balance
        offchainBalance={user?.catiBalance || "0"}
      />
    </div>
  );
}

export default Home;
