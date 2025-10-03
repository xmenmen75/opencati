import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Wallet, CreditCard, Trophy, Coins, Menu, X, LogOut } from 'lucide-react';
import type { User, WalletState } from '@/types/user';
import DefaultCartiUserImage from '@/../public/images/default-cati-user.webp';
import IconReward from '@/../public/images/icon-reward.png';
import IconPoolAmt from '@/../public/images/icon-pool-amt.png';
import Image from 'next/image';
import { useState } from 'react';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const isConnectedAndAuthenticated = walletState.isConnected && isAuthenticated;

  const handleMenuToggle = () => {
    if (!isMenuOpen) {
      // Opening menu: first show the backdrop, then trigger the slide animation
      setIsMenuVisible(true);
      setTimeout(() => setIsMenuOpen(true), 10);
    } else {
      // Closing menu: first trigger the slide animation, then hide the backdrop
      setIsMenuOpen(false);
      setTimeout(() => setIsMenuVisible(false), 300);
    }
  };

  return (
    <div className="w-full text-white p-4 relative">
      <div className="flex justify-between items-center mx-auto">
        {/* Desktop left side - Cards button and stats (hidden on tablet/mobile) */}
        <div className="hidden lg:flex gap-4 items-center">
          {/* Cards button */}
          <Button
            onClick={onOpenCardsDialog}
            disabled={!isConnectedAndAuthenticated}
            className={`backdrop-blur-sm transition-colors shadow-lg px-3 py-2 h-auto cursor-pointer ${isConnectedAndAuthenticated
                ? 'bg-[#4A5567] text-black hover:bg-[#4A5567]/80'
                : 'bg-[#4A5567]/50 text-black/50 cursor-not-allowed hover:bg-[#4A5567]/50'
              }`}
          >
            Cards: {isConnectedAndAuthenticated ? ownedCardsCount : 0}
          </Button>

          {/* CATI balance button */}
          <Button
            onClick={onOpenCatiManagement}
            disabled={!isConnectedAndAuthenticated}
            className={`backdrop-blur-sm shadow-lg px-3 py-2 h-auto ${isConnectedAndAuthenticated
                ? 'bg-[#4A5567] text-black hover:bg-[#4A5567]/80 cursor-pointer'
                : 'bg-[#4A5567]/50 text-black/50 cursor-not-allowed hover:bg-[#4A5567]/50'
              }`}
          >
            CATI: {isConnectedAndAuthenticated ? (parseInt(user?.catiBalance || '0')).toLocaleString() : '---'}
          </Button>

          {/* Pool and reward info */}
          <div className={`items-center flex flex-row gap-4 text-sm ${isConnectedAndAuthenticated ? 'text-amber-400' : 'text-amber-400/50'
            }`}>
            <div className="flex items-center gap-1">
              {/* <Trophy className="h-4 w-4" /> */}
              <Image src={IconPoolAmt} alt="Pool Amount" className="h-4 w-4" />
              <span>Pool Amt: {(walletState.isConnected && isAuthenticated) ?
                (totalPoolAmount ? `${parseInt(totalPoolAmount).toLocaleString()} CATI` : 'Loading...') :
                '---'
              }</span>
            </div>
            <div className='h-5 w-0.5 bg-white/40'></div>
            <div className="flex items-center gap-1">
              {/* <Coins className="h-4 w-4" /> */}
              <Image src={IconReward} alt="Reward" className="h-4 w-4" />
              <span>Reward: {(walletState.isConnected && isAuthenticated) ?
                (userRewardAmount ? `${parseInt(userRewardAmount).toLocaleString()} CATI` : 'Loading...') :
                '---'
              }</span>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet hamburger menu (visible on tablet/mobile) */}
        <div className="lg:hidden">
          {isConnectedAndAuthenticated ? (
            <Button
              onClick={handleMenuToggle}
              variant="ghost"
              size="sm"
              className="bg-[#4A5567] text-black hover:bg-[#4A5567]/80"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          ) : null}
        </div>

        {/* Right side - Profile and wallet connection */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isConnectedAndAuthenticated && user ? (
            <>
              {/* Circular profile picture */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-white/20 flex items-center justify-center overflow-hidden">
                <Image
                  src={user.profilePictureUrl || DefaultCartiUserImage}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Player name */}
              <div className="text-[#98A1AE] font-medium text-sm sm:text-base">
                {user.userNickname || `${user.walletAddress?.slice(0, 6)}...${user.walletAddress?.slice(-4)}`}
              </div>

              {/* Desktop-only buttons */}
              <div className="hidden lg:flex items-center gap-4">
                {/* Disconnect button */}
                <Button
                  onClick={onDisconnectWallet}
                  className="bg-[#4A5567] backdrop-blur-sm text-black hover:bg-[#4A5567]/80 transition-colors shadow-lg px-3 py-2 h-auto"
                >
                  Disconnect
                </Button>

                {/* Settings button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSettings}
                  className="bg-[#4A5567] cursor-pointer text-black hover:bg-[#4A5567]/80"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            /* Connect wallet button */
            <Button
              onClick={onConnectWallet}
              disabled={isLoading}
              className="bg-[#4A5567] backdrop-blur-sm border border-white/50 text-black hover:bg-[#4A5567]/80 shadow-lg text-sm sm:text-base px-2 sm:px-4"
            >
              <Wallet className="h-4 w-4 mr-1 sm:mr-2" />
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile/Tablet slide-in menu from left */}
      {isMenuVisible && isConnectedAndAuthenticated && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop overlay */}
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={handleMenuToggle}
          />

          {/* Slide-in menu panel */}
          <div className={`absolute left-0 top-0 h-full w-80 bg-[#1a1a1a]/95 backdrop-blur-md border-r border-white/20 shadow-xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
            {/* Menu header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <Button
                onClick={handleMenuToggle}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Menu content */}
            <div className="p-4 space-y-4">
              {/* Cards button */}
              <Button
                onClick={() => {
                  onOpenCardsDialog();
                  handleMenuToggle();
                }}
                className="w-full justify-start bg-[#4A5567] text-black hover:bg-[#4A5567]/80 h-12"
              >
                <CreditCard className="h-5 w-5 mr-3" />
                Cards: {ownedCardsCount}
              </Button>

              {/* CATI Management button */}
              <Button
                onClick={() => {
                  onOpenCatiManagement();
                  handleMenuToggle();
                }}
                className="w-full justify-start bg-[#4A5567] text-black hover:bg-[#4A5567]/80 h-12"
              >
                <Coins className="h-5 w-5 mr-3" />
                CATI: {(parseInt(user?.catiBalance || '0')).toLocaleString()}
              </Button>

              {/* Pool Amount */}
              <div className="flex items-center text-amber-400 px-3 py-3 bg-white/5 rounded-lg">
                <Image src={IconPoolAmt} alt="Pool Amount" className="h-4 w-4" />
                <div  className="ml-3">
                  <div className="text-xs text-white/60">Pool Amt</div>
                  <div className="font-medium">
                    {totalPoolAmount ? `${parseInt(totalPoolAmount).toLocaleString()} CATI` : 'Loading...'}
                  </div>
                </div>
              </div>

              {/* Reward Amount */}
              <div className="flex items-center text-amber-400 px-3 py-3 bg-white/5 rounded-lg">
                <Image src={IconReward} alt="Reward" className="h-4 w-4" />
                <div   className="ml-3">
                  <div className="text-xs text-white/60">Reward</div>
                  <div className="font-medium">
                    {userRewardAmount ? `${parseInt(userRewardAmount).toLocaleString()} CATI` : 'Loading...'}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/20 my-4"></div>

              {/* Settings button */}
              <Button
                onClick={() => {
                  onSettings();
                  handleMenuToggle();
                }}
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10 h-12"
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Button>

              {/* Disconnect button */}
              <Button
                onClick={() => {
                  onDisconnectWallet();
                  handleMenuToggle();
                }}
                variant="ghost"
                className="w-full justify-start text-red-400 hover:bg-red-400/10 h-12"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
