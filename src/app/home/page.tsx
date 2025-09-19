'use client';

import { useState } from 'react';
import { PackOpening } from '@/components/PackOpening';
import { TopBar } from '@/components/TopBar';
import { OwnedCardsDialog } from '@/components/OwnedCardsDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useWallet } from '../hooks/useWallet';
import { CardService } from '../services/cardService';

interface UserSettings {
  nickname: string;
  profilePictureUrl: string;
  language: string;
  timezone: string;
}
function Home() {
  const { walletState, user, isAuthenticated, connectWallet, disconnectWallet, isCorrectNetwork, authError, clearAuthError, authLoading } = useWallet();
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  const handleSettings = () => {
    setIsSettingsDialogOpen(true);
  };

  const handleSaveSettings = (settings: UserSettings) => {
    // TODO: Implement settings save functionality
    console.log('Saving settings:', settings);
    // Here you would typically make an API call to save the settings
    // For now, just log the settings
  };

  const handleOpenCardsDialog = () => {
    setIsCardsDialogOpen(true);
  };

  // Check if user can play (wallet connected, authenticated, correct network, and has CATI tokens)
  const canPlay = walletState.isConnected && isAuthenticated && isCorrectNetwork && user && parseInt(user.catiBalance) > 0;
  
  // Check if wallet connection/auth is in progress
  const isLoading = walletState.isConnecting || authLoading;

  // Get user's owned cards for display (show mock data when not connected)
  const ownedCards = user ? CardService.generateMockOwnedCards(user.ownedCards || []) : CardService.generateMockOwnedCards([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#362A85] to-[#7F174C]">
      {/* Top Bar */}
      <TopBar
        walletState={walletState}
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onSettings={handleSettings}
        onOpenCardsDialog={handleOpenCardsDialog}
      />

      {/* Main Content */}
      <div className="flex-1"> {/* Removed bottom padding since we no longer have a bottom panel */}
        {canPlay ? (
          <PackOpening />
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Connect Your Wallet to Play
              </h2>
              {/* <p className="text-white/80">
                You need to connect your wallet with t
              </p> */}
              {(walletState.error || authError) && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  {walletState.error || authError}
                  {authError && (
                    <button 
                      onClick={clearAuthError}
                      className="ml-2 text-red-200 hover:text-white underline"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              )}
              {/* {!isCorrectNetwork && walletState.isConnected && (
                <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/50 text-yellow-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  Please switch to BNB Smart Chain Testnet to continue.
                </div>
              )}
              {walletState.isConnected && !isAuthenticated && (
                <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/50 text-blue-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  Please sign the authentication message to verify your wallet ownership.
                </div>
              )} */}
              {isLoading && (
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
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default Home;
