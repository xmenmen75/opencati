import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Wallet, CreditCard, Trophy, Coins } from 'lucide-react';
import type { User, WalletState } from '@/types/user';
import DefaultCartiUserImage from '@/../public/images/default-cati-user.webp';
import Image from 'next/image';

interface TopBarProps {
  walletState: WalletState;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  ownedCardsCount: number;
  totalPoolAmount?: string;
  userRewardAmount?: string;
  onchainBalance?: string; // BNB balance from wallet
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onSettings: () => void;
  onOpenCardsDialog: () => void;
  onOpenCatiManagement: () => void;
}

export function TopBar({ walletState, user, isAuthenticated, isLoading, ownedCardsCount, totalPoolAmount, userRewardAmount, onchainBalance, onConnectWallet, onDisconnectWallet, onSettings, onOpenCardsDialog, onOpenCatiManagement }: TopBarProps) {
  return (
    <div className="w-full text-white p-4">
      <div className="flex justify-between items-center mx-auto">
        {/* Left side - Cards button and stats */}
        <div className="flex gap-4 items-center">
          {/* Cards button - always visible */}
          <Button
            onClick={onOpenCardsDialog}
            disabled={!walletState.isConnected || !isAuthenticated}
            className={`backdrop-blur-sm transition-colors shadow-lg px-3 py-2 h-auto cursor-pointer ${
              (walletState.isConnected && isAuthenticated)
                ? 'bg-[#4A5567] text-black hover:bg-[#4A5567]/80' 
                : 'bg-[#4A5567]/50 text-black/50 cursor-not-allowed hover:bg-[#4A5567]/50'
            }`}
          >
            Cards: {(walletState.isConnected && isAuthenticated) ? ownedCardsCount : 0}
          </Button>

          {/* CATI balance button - always visible */}
          <Button 
            onClick={onOpenCatiManagement}
            disabled={!walletState.isConnected || !isAuthenticated}
            className={`backdrop-blur-sm shadow-lg px-3 py-2 h-auto ${
              (walletState.isConnected && isAuthenticated)
                ? 'bg-[#4A5567] text-black hover:bg-[#4A5567]/80 cursor-pointer' 
                : 'bg-[#4A5567]/50 text-black/50 cursor-not-allowed hover:bg-[#4A5567]/50'
            }`}
          >
            CATI: {(walletState.isConnected && isAuthenticated) ? (parseInt(user?.catiBalance || '0')).toLocaleString() : '---'}
          </Button>

          {/* Pool and reward info - always visible */}
          <div className={`items-center flex flex-row gap-4 text-sm ${
            (walletState.isConnected && isAuthenticated) ? 'text-amber-400' : 'text-amber-400/50'
          }`}>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>Pool Amt: {(walletState.isConnected && isAuthenticated) ? 
                (totalPoolAmount ? `${parseInt(totalPoolAmount).toLocaleString()} CATI` : 'Loading...') : 
                '---'
              }</span>
            </div>
            <div className='h-5 w-0.5 bg-white/40'></div>
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4" />
              <span>Reward: {(walletState.isConnected && isAuthenticated) ? 
                (userRewardAmount ? `${parseInt(userRewardAmount).toLocaleString()} CATI` : 'Loading...') : 
                '---'
              }</span>
            </div>
          </div>
        </div>

        {/* Right side - Profile and wallet connection */}
        <div className="flex items-center gap-4">
          {walletState.isConnected && isAuthenticated && user ? (
            <>
              {/* Circular profile picture */}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-white/20 flex items-center justify-center overflow-hidden">
                <Image
                  src={user.profilePictureUrl || DefaultCartiUserImage}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Player name */}
              <div className="text-[#98A1AE] font-medium">
                {user.userNickname || `${user.walletAddress?.slice(0, 6)}...${user.walletAddress?.slice(-4)}`}
              </div>

              {/* Disconnect button */}
              <Button 
                onClick={onDisconnectWallet}
                className="bg-[#4A5567] backdrop-blur-sm text-black hover:bg-[#4A5567]/80 transition-colors shadow-lg px-3 py-2 h-auto"
              >
                Disconnect
              </Button>

              {/* Settings button with new bg */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="bg-[#4A5567] cursor-pointer text-black hover:bg-[#4A5567]/80"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          ) : (
            /* Connect wallet button */
            <Button
              onClick={onConnectWallet}
              disabled={isLoading}
              className="bg-[#4A5567] backdrop-blur-sm border border-white/50 text-black hover:bg-[#4A5567]/80 shadow-lg"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
