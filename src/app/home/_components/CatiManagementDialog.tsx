import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Coins } from 'lucide-react';

interface CatiManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onchainBalance?: string; // BNB balance from wallet
  offchainBalance?: string; // CATI balance from database
}

export function CatiManagementDialog({ 
  isOpen, 
  onClose, 
  onchainBalance = "0.0",
  offchainBalance = "0"
}: CatiManagementDialogProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    setIsDepositLoading(true);
    try {
      // TODO: Implement deposit logic
      console.log('Depositing:', depositAmount, 'CATI');
      // Reset form after successful deposit
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    const withdrawAmountNum = parseFloat(withdrawAmount);
    const offchainBalanceNum = parseInt(offchainBalance);
    
    if (withdrawAmountNum > offchainBalanceNum) {
      alert('Insufficient CATI balance for withdrawal');
      return;
    }
    
    setIsWithdrawLoading(true);
    try {
      // TODO: Implement withdraw logic
      console.log('Withdrawing:', withdrawAmount, 'CATI');
      // Reset form after successful withdrawal
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            CATI Management
          </DialogTitle>
          <DialogDescription>
            Manage your CATI tokens between your wallet and the game platform
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Balance Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Wallet className="h-3 w-3" />
                Onchain Balance
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {parseFloat(onchainBalance).toFixed(4)} BNB
              </div>
            </div>
            
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Coins className="h-3 w-3" />
                Game Balance
              </div>
              <div className="text-sm font-semibold text-amber-600">
                {parseInt(offchainBalance).toLocaleString()} CATI
              </div>
            </div>
          </div>

          {/* Deposit Section */}
          <div className="bg-gray-50 border space-y-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-900">Deposit CATI</span>
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
                  // className="bg-white border-gray-300"
                  min="0"
                  step="1"
                />
              </div>
              <Button 
                onClick={handleDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isDepositLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {isDepositLoading ? 'Processing...' : 'Deposit CATI'}
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
                  // className="bg-white border-gray-300"
                  min="0"
                  step="1"
                  max={offchainBalance}
                />
                <div className="text-xs text-gray-500">
                  Available: {parseInt(offchainBalance).toLocaleString()} CATI
                </div>
              </div>
              <Button 
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isWithdrawLoading || parseFloat(withdrawAmount) > parseInt(offchainBalance)}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                {isWithdrawLoading ? 'Processing...' : 'Withdraw CATI'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
