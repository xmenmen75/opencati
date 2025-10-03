import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History, TrendingUp, TrendingDown, Package, Trophy, ArrowLeft } from 'lucide-react';
import { useTransactions } from '@/hooks/queries';
import { Loading } from '@/components/ui/Loading';
import type { TransactionResponse } from '@/services/api';

interface CatiHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CatiHistoryDialog({ isOpen, onClose }: CatiHistoryDialogProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  
  const { data, isLoading, error, refetch } = useTransactions(pageSize, currentPage * pageSize);
  const transactionData = data as TransactionResponse | undefined;

  const getTransactionIcon = (type: string, amount: string) => {
    const amountNum = parseFloat(amount);
    switch (type) {
      case 'SPEND_DRAW':
        return <Package className="h-4 w-4 text-red-500" />;
      case 'SEASON_REWARD':
        return <Trophy className="h-4 w-4 text-green-500" />;
      case 'DEPOSIT':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'WITHDRAW':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return amountNum >= 0 ? 
          <TrendingUp className="h-4 w-4 text-green-500" /> : 
          <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'SPEND_DRAW': return 'Pack Opening';
      case 'SEASON_REWARD': return 'Season Reward';
      case 'DEPOSIT': return 'Deposit';
      case 'WITHDRAW': return 'Withdrawal';
      default: return type;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    if (transactionData?.pagination.hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <History className="h-5 w-5 text-amber-500" />
            CATI Transaction History
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loading size="lg" text="Loading transaction history..." />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-red-500 text-center">
              <p className="font-medium">Failed to load transaction history</p>
              <p className="text-sm text-gray-500 mt-1">Please try again</p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Summary Section */}
            {transactionData?.summary && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {transactionData.summary.totalPackOpenings}
                    </div>
                    <div className="text-xs text-gray-500">Pack Opens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {transactionData.summary.amountSpent.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">CATI Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {transactionData.summary.amountEarned.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">CATI Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {transactionData.summary.winRate}%
                    </div>
                    <div className="text-xs text-gray-500">Win Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {transactionData?.transactions && transactionData.transactions.length > 0 ? (
              <>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Spent
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Earned
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Comment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactionData.transactions.map((transaction) => {
                          const amount = parseFloat(transaction.amount);
                          const spentAmount = amount < 0 ? Math.abs(amount) : 0;
                          const earnedAmount = amount > 0 ? amount : 0;
                          
                          // For pack openings with cards, add the card reward to earned amount
                          const cardReward = transaction.cardDetails ? parseFloat(transaction.cardDetails.catiReward) : 0;
                          const totalEarned = earnedAmount + cardReward;
                          
                          return (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatDateTime(transaction.createdAt)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(transaction.type, transaction.amount)}
                                  <span className="text-sm font-medium text-gray-900">
                                    {getTransactionLabel(transaction.type)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-red-600">
                                {spentAmount > 0 ? `${spentAmount.toLocaleString()} CATI` : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-green-600">
                                {totalEarned > 0 ? `${totalEarned.toLocaleString()} CATI` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                <div className="flex flex-col">
                                  <span className="truncate">{transaction.description}</span>
                                  {transaction.type === 'SPEND_DRAW' && transaction.cardDetails && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                      <div 
                                        className="w-2 h-2 rounded-full" 
                                        style={{ 
                                          backgroundColor: transaction.cardDetails.rarityColor || '#gray'
                                        }}
                                      />
                                      Won {transaction.cardDetails.cardRank} {transaction.cardDetails.cardName}
                                    </span>
                                  )}
                                  {transaction.type === 'SPEND_DRAW' && !transaction.cardDetails && (
                                    <span className="text-xs text-gray-400 mt-1">
                                      No card won
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-500">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, transactionData.pagination.total)} of {transactionData.pagination.total} transactions
                  </div>
                  {transactionData.pagination.total > pageSize && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!transactionData.pagination.hasMore}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No transaction history yet</p>
                <p className="text-sm mt-1">Start opening packs to see your transaction history!</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
