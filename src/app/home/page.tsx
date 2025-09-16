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
  const { walletState, user, connectWallet, disconnectWallet, isCorrectNetwork } = useWallet();
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

  // Check if user can play (wallet connected, correct network, and has CATI tokens)
  const canPlay = walletState.isConnected && isCorrectNetwork && user && user.catiTokens > 0;

  // Get user's owned cards for display
  const ownedCards = user ? CardService.generateMockOwnedCards(user.ownedCards) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#362A85] to-[#7F174C]">
      {/* Top Bar */}
      <TopBar
        walletState={walletState}
        user={user}
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
              <p className="text-white/80">
                You need to connect your wallet and have CATI tokens to open card packs.
              </p>
              {walletState.error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  {walletState.error}
                </div>
              )}
              {!isCorrectNetwork && walletState.isConnected && (
                <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/50 text-yellow-100 px-4 py-3 rounded-lg max-w-md mx-auto">
                  Please switch to BNB Smart Chain Testnet to continue.
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
