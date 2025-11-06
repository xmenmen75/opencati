import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDownCircle, Wallet, Coins, History, AlertCircle } from 'lucide-react';
import { UsdHistoryDialog } from './UsdHistoryDialog';
import { useCreateUsdDeposit } from '@/hooks/queries';
import { validateCurrencyAmount, formatCurrency, CurrencyType } from '@/lib/currency';
import { PLATFORM_WALLET_CONFIG } from '@/lib/blockchain';
import { toast } from 'sonner';
import type { User } from '@/types/user';

interface UsdManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  usdBalance?: string; // USD balance from database (in blockchain units)
  onchainUsdtBalance?: string; // USDT balance from wallet
  user?: User | null;
  isLoadingBalances?: boolean;
  balancesError?: string;
  isTransferring?: boolean;
  depositUsdt?: (amount: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  refreshBalances?: () => void;
  switchToCorrectNetwork?: () => Promise<void>;
  expectedNetwork?: { name: string; chainId: number };
}

export function UsdManagementDialog({ 
  isOpen, 
  onClose, 
  usdBalance = "0",
  onchainUsdtBalance = "0",
  user,
  isLoadingBalances = false,
  balancesError,
  isTransferring = false,
  depositUsdt,
  refreshBalances,
  switchToCorrectNetwork,
  expectedNetwork = { name: 'BSC Mainnet', chainId: 56 },
}: UsdManagementDialogProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  const createDeposit = useCreateUsdDeposit();

  // Convert blockchain units to display format
  const gameBalance = parseFloat(usdBalance) / 1e6; // USD has 6 decimals

  const handleDeposit = async () => {
    // Validate amount
    const validation = validateCurrencyAmount(depositAmount, CurrencyType.USD);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid amount');
      return;
    }
    
    if (!user?.walletAddress) {
      toast.error('User wallet address not found');
      return;
    }

    if (!depositUsdt) {
      toast.error('Wallet not connected properly. Please refresh and try again.');
      return;
    }

    // Check if user has enough USDT balance
    const depositNum = parseFloat(depositAmount);
    const onchainNum = parseFloat(onchainUsdtBalance);
    
    if (depositNum > onchainNum) {
      toast.error(`Insufficient USDT balance. You have ${parseFloat(onchainUsdtBalance).toFixed(2)} USDT in your wallet`);
      return;
    }
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Please confirm the transaction in MetaMask...');
      
      // Initiate transfer from user's wallet to platform wallet
      const transferResult = await depositUsdt(depositAmount);
      
      toast.dismiss(loadingToast);
      
      if (!transferResult.success) {
        toast.error(transferResult.error || 'Failed to transfer USDT tokens');
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
      if (refreshBalances) {
        refreshBalances();
      }
      
    } catch (error: any) {
      console.error('Deposit failed:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to complete deposit';
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-500" />
              USD Management
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
            Deposit USD (USDT) to use for opening card packs
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Wrong Network Warning */}
          {balancesError && balancesError.includes('chain') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">
                    Wrong Network Detected
                  </h4>
                  <p className="text-xs text-red-700 mb-3">
                    You're connected to the wrong network. Please switch to <strong>{expectedNetwork.name}</strong> to see your USDT balance and make deposits.
                  </p>
                  {switchToCorrectNetwork && (
                    <Button
                      onClick={async () => {
                        try {
                          await switchToCorrectNetwork();
                          toast.success(`Switched to ${expectedNetwork.name}!`);
                          setTimeout(() => refreshBalances && refreshBalances(), 1000);
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to switch network');
                        }
                      }}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Switch to {expectedNetwork.name}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Important Notice - No Withdrawals */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <strong>Note:</strong> USD can only be deposited, not withdrawn. USD is used exclusively for opening card packs. All rewards are paid in CATI tokens.
              </div>
            </div>
          </div>

          {/* Balance Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-600 flex items-center gap-1 mb-1">
                <Wallet className="h-3 w-3" />
                Wallet USDT
              </div>
              <div className="text-sm font-semibold text-blue-900">
                {isLoadingBalances ? (
                  <span className="text-xs">Loading...</span>
                ) : (
                  formatCurrency(parseFloat(onchainUsdtBalance), CurrencyType.USD)
                )}
              </div>
              <div className="text-xs text-blue-500 mt-1">
                On BSC network
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
              <div className="text-xs text-green-600 flex items-center gap-1 mb-1">
                <Coins className="h-3 w-3" />
                Game Balance
              </div>
              <div className="text-sm font-semibold text-green-900">
                {formatCurrency(gameBalance, CurrencyType.USD)}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Available for packs
              </div>
            </div>
          </div>

          {/* Deposit Section */}
          <div className="bg-gray-50 border space-y-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-900">Deposit USD (USDT)</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="deposit-amount" className="text-sm text-gray-700">
                  Amount to deposit
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="Enter USDT amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  disabled={isTransferring || createDeposit.isPending}
                />
                <div className="text-xs text-gray-500">
                  Available in wallet: {parseFloat(onchainUsdtBalance).toFixed(2)} USDT
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-medium text-blue-900 mb-1">💡 How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 text-xs">
                  <li>Click "Deposit" and approve the transaction in MetaMask</li>
                  <li>USDT will be transferred to platform wallet</li>
                  <li>Your game balance will be updated automatically</li>
                  <li>Use USD to open card packs (2 USD per pack)</li>
                </ol>
                <p className="mt-2 text-xs text-blue-700 font-mono">
                  To: {PLATFORM_WALLET_CONFIG.address.slice(0, 10)}...{PLATFORM_WALLET_CONFIG.address.slice(-8)}
                </p>
              </div>
              
              <Button 
                onClick={handleDeposit}
                disabled={
                  !depositAmount || 
                  parseFloat(depositAmount) <= 0 || 
                  isTransferring || 
                  createDeposit.isPending ||
                  parseFloat(depositAmount) > parseFloat(onchainUsdtBalance)
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {isTransferring || createDeposit.isPending ? 'Processing...' : 'Deposit USDT'}
              </Button>
            </div>
          </div>

          {/* Pack Opening Cost Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Pack Opening Cost</span>
            </div>
            <p className="text-xs text-purple-700">
              Each card pack costs <strong>2.00 USD</strong>. Make sure you have enough balance before opening packs!
            </p>
          </div>
        </div>
      </DialogContent>

      {/* USD History Dialog */}
      <UsdHistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
      />
    </Dialog>
  );
}
