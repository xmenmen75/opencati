# CATI Token Deposit & Withdrawal Implementation

## Overview

This document explains the implementation of CATI token deposits and withdrawals using **Option A: Frontend-initiated wallet integration with backend verification**. This provides the best user experience by allowing direct token transfers through MetaMask.

## Architecture

### File Structure

```
src/
├── lib/
│   ├── blockchain.ts          # Backend blockchain service (server-side)
│   └── cati-token.ts          # Frontend token utilities (client-side)
├── app/
│   ├── hooks/
│   │   └── useWallet.ts       # Enhanced wallet hook with token operations
│   ├── api/
│   │   └── transactions/
│   │       ├── deposit/route.ts   # Deposit verification API
│   │       └── withdraw/route.ts  # Withdrawal execution API
│   └── home/
│       └── _components/
│           └── CatiManagementDialog.tsx  # Main UI component
```

### Key Components

#### 1. **blockchain.ts** (Backend/Server)
- Uses `JsonRpcProvider` for server-side blockchain access
- Has platform wallet's private key (never exposed to frontend)
- Functions:
  - `verifyDepositTransaction()` - Verifies user deposits on-chain
  - `sendWithdrawal()` - Executes withdrawals from platform wallet
  - `checkPlatformBalance()` - Monitors platform wallet funds

#### 2. **cati-token.ts** (Frontend/Client)
- Uses `BrowserProvider` to connect to user's MetaMask
- Does NOT have private keys (users control their wallets)
- Functions:
  - `getCatiTokenBalance()` - Check user's CATI balance
  - `getBnbBalance()` - Check user's BNB balance
  - `transferCatiToPlatform()` - Initiate deposit from user wallet
  - `validateCatiAmount()` - Input validation

#### 3. **useWallet.ts** (React Hook)
- Manages wallet connection, authentication, and CATI token operations
- Auto-refreshes balances every 30 seconds
- Provides:
  - Wallet connection state
  - Authentication state
  - `catiBalance` - User's wallet CATI balance
  - `bnbBalance` - User's wallet BNB balance  
  - `depositCati()` - Function to initiate deposits
  - `refreshBalances()` - Manual balance refresh

## Deposit Flow

### User Journey

1. **User clicks "Deposit CATI"**
   - Component validates amount
   - Checks if user has sufficient balance

2. **MetaMask popup appears**
   - User reviews transaction details
   - User confirms or rejects

3. **Transaction submitted to blockchain**
   - Frontend waits for 1 block confirmation
   - Transaction hash is captured

4. **Backend verification**
   - Frontend sends txHash to `/api/transactions/deposit`
   - Backend verifies transaction on blockchain:
     - Checks transaction exists and succeeded
     - Validates sender matches user's wallet
     - Validates receiver is platform wallet
     - Validates amount matches request
     - Ensures txHash hasn't been used before (prevents double-spending)

5. **Balance updated**
   - Backend credits user's off-chain balance
   - Creates transaction records
   - Frontend refreshes balances

### Technical Implementation

```typescript
// Frontend (CatiManagementDialog.tsx)
const handleDeposit = async () => {
  // 1. Validate
  const validation = validateCatiAmount(depositAmount);
  if (!validation.isValid) return;
  
  // 2. Initiate transfer via MetaMask
  const transferResult = await depositCati(depositAmount);
  if (!transferResult.success) return;
  
  // 3. Verify on backend
  const result = await createDeposit.mutateAsync({
    amount: depositAmount,
    fromAddress: user.walletAddress,
    txHash: transferResult.txHash,
  });
  
  // 4. Success!
  refreshBalances();
};
```

```typescript
// Backend (deposit/route.ts)
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  // 2. Validate inputs
  // 3. Verify transaction on blockchain
  const verificationResult = await blockchainService.verifyDepositTransaction(
    txHash,
    fromAddress,
    amount
  );
  
  // 4. Update database in transaction
  await prisma.$transaction(async (tx) => {
    // Add to user balance
    // Create deposit record
    // Create transaction record
  });
}
```

## Withdrawal Flow

### User Journey

1. **User clicks "Withdraw CATI"**
   - Backend validates balance
   - Deducts from off-chain balance immediately

2. **Platform wallet sends tokens**
   - Backend uses platform wallet to send tokens
   - Transaction submitted to blockchain
   - Waits for confirmation

3. **Success or rollback**
   - If successful: Transaction marked as completed
   - If failed: User balance refunded automatically

### Technical Implementation

```typescript
// Backend (withdraw/route.ts)
export async function POST(request: NextRequest) {
  // 1. Deduct from user balance
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { catiBalance: { decrement: withdrawAmount } }
    });
    // Create withdrawal record
  });
  
  // 2. Send blockchain transaction
  const withdrawalResult = await blockchainService.sendWithdrawal(
    toAddress,
    amount
  );
  
  // 3. If failed, refund user
  if (!withdrawalResult.success) {
    await refundUser();
    return error;
  }
  
  // 4. Mark as completed
  await updateWithdrawalStatus('COMPLETED', withdrawalResult.txHash);
}
```

## Security Features

### Deposit Security
- ✅ **Transaction verification on blockchain** - Can't fake deposits
- ✅ **Duplicate transaction prevention** - txHash can only be used once
- ✅ **Amount validation** - Actual amount verified on-chain
- ✅ **Wallet ownership** - Only user's wallet can deposit to their account
- ✅ **Platform wallet validation** - Tokens must go to correct address

### Withdrawal Security
- ✅ **Balance checks** - Can't withdraw more than owned
- ✅ **Atomic transactions** - Balance deducted only if blockchain tx succeeds
- ✅ **Automatic rollback** - Failed withdrawals are refunded immediately
- ✅ **Platform wallet monitoring** - Checks sufficient liquidity before withdrawal

### Web3 Security Principles
- ✅ **Non-custodial** - Users control their wallet private keys
- ✅ **No private keys in frontend** - Platform wallet key stays on server
- ✅ **User-initiated transactions** - All deposits require user signature

## Environment Variables

### Required Configuration

```env
# Frontend (.env.local)
NEXT_PUBLIC_CATI_TOKEN_ADDRESS=0x...        # CATI token contract address
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=0x...   # Platform wallet address (public)

# Backend (.env)
PLATFORM_WALLET_ADDRESS=0x...               # Same as above
PLATFORM_WALLET_PRIVATE_KEY=0x...           # Platform wallet private key (SECRET!)
BSC_TESTNET_RPC_URL=https://...             # BSC testnet RPC endpoint
```

## Testing Checklist

### Deposit Tests
- [ ] User with sufficient CATI can deposit
- [ ] User with insufficient CATI sees error
- [ ] Cancelled MetaMask transaction handles gracefully
- [ ] Duplicate txHash is rejected
- [ ] Wrong wallet address is rejected
- [ ] Balance updates correctly after deposit

### Withdrawal Tests
- [ ] User with sufficient balance can withdraw
- [ ] User with insufficient balance sees error
- [ ] Failed blockchain tx refunds user
- [ ] Withdrawal shows in transaction history
- [ ] Balance updates correctly after withdrawal

### UI/UX Tests
- [ ] Loading states show during transactions
- [ ] Error messages are clear and helpful
- [ ] Balance refreshes automatically
- [ ] Transaction history updates
- [ ] MetaMask popup appears correctly

## Benefits of This Implementation

### User Experience
- ✅ **One-click deposits** - No manual transaction hash entry
- ✅ **Instant feedback** - Real-time transaction status
- ✅ **Clear instructions** - Users know exactly what's happening
- ✅ **Auto-refresh** - Balances update automatically

### Technical
- ✅ **Type-safe** - Full TypeScript support
- ✅ **React Query integration** - Automatic cache invalidation
- ✅ **Error handling** - Comprehensive error messages
- ✅ **Gas optimization** - 20% buffer on gas estimates

### Security
- ✅ **Blockchain verification** - All deposits verified on-chain
- ✅ **Atomic operations** - Database and blockchain stay in sync
- ✅ **Rollback support** - Failed operations don't lose funds
- ✅ **Audit trail** - Complete transaction history

## Common Issues & Solutions

### Issue: "MetaMask is locked"
**Solution**: User needs to unlock MetaMask and try again

### Issue: "Insufficient funds for gas"
**Solution**: User needs BNB in wallet for gas fees

### Issue: "Transaction failed on blockchain"
**Solution**: Check gas price, network congestion, or contract issues

### Issue: "Amount mismatch"
**Solution**: Ensure frontend and backend use same decimal precision (18 for CATI)

## Future Enhancements

- [ ] Add support for multiple networks (BSC Mainnet, other chains)
- [ ] Implement withdrawal fee structure
- [ ] Add withdrawal limits (daily/weekly)
- [ ] Support batch withdrawals for admin
- [ ] Add transaction history export
- [ ] Implement email notifications for large transactions
- [ ] Add 2FA for withdrawals above threshold

## Related Files

- `/src/lib/blockchain.ts` - Backend blockchain service
- `/src/lib/cati-token.ts` - Frontend token utilities  
- `/src/app/hooks/useWallet.ts` - Enhanced wallet and token hook
- `/src/app/api/transactions/deposit/route.ts` - Deposit API
- `/src/app/api/transactions/withdraw/route.ts` - Withdrawal API
- `/src/app/home/_components/CatiManagementDialog.tsx` - Main UI
