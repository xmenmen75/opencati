import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Wallet, CreditCard } from 'lucide-react';
import type { User, WalletState } from '@/types/user';

interface TopBarProps {
  walletState: WalletState;
  user: User | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onSettings: () => void;
  onOpenCardsDialog: () => void;
}

export function TopBar({ walletState, user, onConnectWallet, onDisconnectWallet, onSettings, onOpenCardsDialog }: TopBarProps) {
  return (
    <div className="w-full text-white p-4">
      <div className="flex justify-between items-center mx-auto">
        {/* Left side - Cards button and stats */}
        <div className="flex gap-4 items-center">
          {user && (
            <>
              {/* Cards button */}
              <Button
                onClick={onOpenCardsDialog}
                className="bg-white/90 backdrop-blur-sm text-black hover:bg-white transition-colors shadow-lg px-3 py-2 h-auto"
              >
                Cards: {user.ownedCards.length}
              </Button>

              <Button className="bg-white/90 backdrop-blur-sm text-black shadow-lg px-3 py-2 h-auto cursor-default hover:bg-white/90">
                CATI: {user.catiTokens.toLocaleString()}
              </Button>
              <div
                className=' items-center flex flex-row gap-4 text-sm text-white'>
                <span>Pool Amt: 850,930 CATI</span>
                <div className=' h-5 w-0.5 bg-white/40'></div>
                <span>Reward: 1,000,000 CATI</span>
              </div>
            </>
          )}
        </div>

        {/* Right side - Profile and wallet connection */}
        <div className="flex items-center gap-4">
          {walletState.isConnected && user ? (
            <>
              {/* Circular profile picture */}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {walletState.account?.slice(2, 4).toUpperCase()}
                </span>
              </div>

              {/* Player name */}
              <div className="text-white font-medium">
                {walletState.account?.slice(0, 6)}...{walletState.account?.slice(-4)}
              </div>

              {/* Disconnect button */}
              <Button 
                onClick={onDisconnectWallet}
                className="bg-white/90 backdrop-blur-sm text-black hover:bg-white transition-colors shadow-lg px-3 py-2 h-auto"
              >
                Disconnect
              </Button>

              {/* Settings button with white bg */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="bg-white text-black hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          ) : (
            /* Connect wallet button */
            <Button
              onClick={onConnectWallet}
              disabled={walletState.isLoading}
              className="bg-white/90 backdrop-blur-sm border border-white/50 text-black hover:bg-white shadow-lg"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {walletState.isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
