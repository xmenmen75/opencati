import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Coins, History } from 'lucide-react';
import { CatiHistoryDialog } from './CatiHistoryDialog';
import { useCreateWithdrawal, useCreateDeposit } from '@/hooks/queries';
import { useWallet } from '@/app/hooks/useWallet';
import { validateCatiAmount, PLATFORM_WALLET_ADDRESS } from '@/lib/cati-token';
import { toast } from 'sonner';
import type { User } from '@/types/user';

interface CatiManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  offchainBalance?: string; // CATI balance from database
  user?: User | null; // User data for wallet address
}

export function CatiManagementDialog({ 
  isOpen, 
  onClose, 
  offchainBalance = "0",
  user
}: CatiManagementDialogProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  // API hooks
  const createWithdrawal = useCreateWithdrawal();
  const createDeposit = useCreateDeposit();
  
  // Use enhanced useWallet hook for token operations
  const {
    catiBalance: onchainCatiBalance,
    bnbBalance: onchainBnbBalance,
    isLoadingBalances,
    balancesError,
    isTransferring,
    depositCati,
    refreshBalances,
    switchToCorrectNetwork,
    expectedNetwork,
  } = useWallet();

  const handleDeposit = async () => {
    // Validate amount
    const validation = validateCatiAmount(depositAmount);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid amount');
      return;
    }
    
    if (!user?.walletAddress) {
      toast.error('User wallet address not found');
      return;
    }

    // Check if user has enough CATI balance
    const depositNum = parseFloat(depositAmount);
    const onchainNum = parseFloat(onchainCatiBalance);
    
    if (depositNum > onchainNum) {
      toast.error(`Insufficient CATI balance. You have ${parseFloat(onchainCatiBalance).toFixed(2)} CATI in your wallet`);
      return;
    }
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Please confirm the transaction in MetaMask...');
      
      // Initiate transfer from user's wallet to platform wallet
      const transferResult = await depositCati(depositAmount);
      
      toast.dismiss(loadingToast);
      
      if (!transferResult.success) {
        toast.error(transferResult.error || 'Failed to transfer CATI tokens');
        return;
      }
      
      // Show verification toast
      const verifyingToast = toast.loading('Verifying deposit on blockchain...');
      
      // Verify deposit on backend
      const result = await createDeposit.mutateAsync({
        amount: depositAmount,
        fromAddress: user.walletAddress,
        txHash: transferResult.txHash!,
      });
      
      toast.dismiss(verifyingToast);
      toast.success(result.message || 'Deposit successful!');
      
      // Reset form and refresh balances
      setDepositAmount('');
      refreshBalances();
      
    } catch (error: any) {
      console.error('Deposit failed:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to complete deposit';
      toast.error(errorMessage);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    const withdrawAmountNum = parseFloat(withdrawAmount);
    const offchainBalanceNum = parseInt(offchainBalance);
    
    if (withdrawAmountNum > offchainBalanceNum) {
      toast.error('Insufficient CATI balance for withdrawal');
      return;
    }

    if (!user?.walletAddress) {
      toast.error('User wallet address not found');
      return;
    }
    
    try {
      const result = await createWithdrawal.mutateAsync({
        amount: withdrawAmount,
        toAddress: user.walletAddress,
      });
      
      toast.success(result.message);
      setWithdrawAmount('');
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create withdrawal';
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              CATI Management
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryDialogOpen(true)}
              className="text-gray-600 hover:text-gray-900 p-2 h-auto"
            >
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </DialogTitle>
          <DialogDescription>
            Manage your CATI tokens between your wallet and the game platform
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Wrong Network Warning */}
          {balancesError && balancesError.includes('chain') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">
                    Wrong Network Detected
                  </h4>
                  <p className="text-xs text-red-700 mb-3">
                    You're connected to the wrong network. Please switch to <strong>{expectedNetwork.name}</strong> to see your CATI balance and make deposits.
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        await switchToCorrectNetwork();
                        toast.success(`Switched to ${expectedNetwork.name}!`);
                        setTimeout(() => refreshBalances(), 1000);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to switch network');
                      }
                    }}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Switch to {expectedNetwork.name}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Balance Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-600 flex items-center gap-1 mb-1">
                <Wallet className="h-3 w-3" />
                Wallet CATI
              </div>
              <div className="text-sm font-semibold text-blue-900">
                {isLoadingBalances ? (
                  <span className="text-xs">Loading...</span>
                ) : (
                  `${parseFloat(onchainCatiBalance).toFixed(2)} CATI`
                )}
              </div>
              <div className="text-xs text-blue-500 mt-1">
                {parseFloat(onchainBnbBalance).toFixed(4)} BNB
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-3">
              <div className="text-xs text-amber-600 flex items-center gap-1 mb-1">
                <Coins className="h-3 w-3" />
                Game Balance
              </div>
              <div className="text-sm font-semibold text-amber-900">
                {parseInt(offchainBalance).toLocaleString()} CATI
              </div>
              <div className="text-xs text-amber-600 mt-1">
                Available for bidding
              </div>
            </div>
          </div>

          {/* Deposit Section */}
          <div className="bg-gray-50 border space-y-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-900">Deposit CATI Tokens</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="deposit-amount" className="text-sm text-gray-700">
                  Amount to deposit
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="Enter CATI amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  disabled={isTransferring || createDeposit.isPending}
                />
                <div className="text-xs text-gray-500">
                  Available in wallet: {parseFloat(onchainCatiBalance).toFixed(2)} CATI
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-medium text-blue-900 mb-1">💡 How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 text-xs">
                  <li>Click "Deposit" and approve the transaction in MetaMask</li>
                  <li>Tokens will be transferred to platform wallet</li>
                  <li>Your game balance will be updated automatically</li>
                </ol>
                <p className="mt-2 text-xs text-blue-700 font-mono">
                  To: {PLATFORM_WALLET_ADDRESS.slice(0, 10)}...{PLATFORM_WALLET_ADDRESS.slice(-8)}
                </p>
              </div>
              
              <Button 
                onClick={handleDeposit}
                disabled={
                  !depositAmount || 
                  parseFloat(depositAmount) <= 0 || 
                  isTransferring || 
                  createDeposit.isPending ||
                  parseFloat(depositAmount) > parseFloat(onchainCatiBalance)
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {isTransferring || createDeposit.isPending ? 'Processing...' : 'Deposit CATI'}
              </Button>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="bg-gray-50 space-y-2 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-gray-900">Withdraw CATI</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="withdraw-amount" className="text-sm text-gray-700">
                  Amount to withdraw
                </Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter CATI amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="1"
                  step="1"
                  max={offchainBalance}
                />
                <div className="text-xs text-gray-500">
                  Available: {parseInt(offchainBalance).toLocaleString()} CATI • Sends tokens to: {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
                </div>
              </div>
              <Button 
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || createWithdrawal.isPending || parseFloat(withdrawAmount) > parseInt(offchainBalance)}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                {createWithdrawal.isPending ? 'Processing...' : 'Withdraw CATI'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* CATI History Dialog */}
      <CatiHistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
      />
    </Dialog>
  );
}
