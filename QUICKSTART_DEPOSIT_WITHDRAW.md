# Quick Start: CATI Deposit & Withdrawal

## 🚀 What Changed?

Your CATI deposit and withdrawal system now uses **frontend-initiated wallet integration** for a better user experience!

### Before (Manual)
❌ User manually sends tokens  
❌ User copies transaction hash  
❌ User pastes hash for verification  

### After (Automated)
✅ User clicks "Deposit"  
✅ MetaMask handles everything  
✅ Auto-verified on backend  

## 📦 New Files Added

```
src/
├── lib/
│   └── cati-token.ts              # NEW: Frontend token utilities
└── app/hooks/
    ├── useWallet.ts               # UPDATED: Enhanced with token operations
    └── _components/
        └── CatiManagementDialog.tsx   # UPDATED: New deposit flow
```

## ⚙️ Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_CATI_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=0x9876543210987654321098765432109876543210
```

Add to `.env` (if not already present):
```env
PLATFORM_WALLET_ADDRESS=0x9876543210987654321098765432109876543210
PLATFORM_WALLET_PRIVATE_KEY=your_private_key_here
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

## 🎯 How to Use

### For Users

1. **Connect Wallet** (MetaMask)
2. **Click "CATI Management"** button
3. **Deposit:**
   - Enter amount
   - Click "Deposit CATI"
   - Approve in MetaMask
   - Done! Balance updates automatically

4. **Withdraw:**
   - Enter amount
   - Click "Withdraw CATI"
   - Wait for confirmation
   - Tokens sent to your wallet!

### For Developers

```typescript
// Use the enhanced hook in any component
import { useWallet } from '@/app/hooks/useWallet';

function MyComponent() {
  const { 
    // Wallet state
    walletState,
    isAuthenticated,
    connectWallet,
    
    // Token balances
    catiBalance,      // User's wallet CATI balance
    bnbBalance,       // User's wallet BNB balance
    
    // Token operations
    depositCati,      // Function to deposit
    refreshBalances   // Manual refresh
  } = useWallet();

  // Deposit example
  const handleDeposit = async () => {
    const result = await depositCati('10.5');
    if (result.success) {
      console.log('TX Hash:', result.txHash);
    }
  };
}
```

## 🧪 Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open app and test:**
   - Connect MetaMask (BSC Testnet)
   - Make sure you have test BNB and CATI
   - Try depositing and withdrawing

## 📚 Documentation

- **Full Implementation Guide:** `DEPOSIT_WITHDRAW_IMPLEMENTATION.md`
- **Testing Guide:** `TESTING_DEPOSIT_WITHDRAW.md`
- **Architecture Details:** See Implementation Guide

## 🔒 Security Features

- ✅ Blockchain verification of all deposits
- ✅ Duplicate transaction prevention
- ✅ Automatic rollback on failures
- ✅ Platform wallet balance monitoring
- ✅ Users maintain custody of their keys

## 🐛 Troubleshooting

### "No Ethereum provider found"
- Install MetaMask
- Refresh page after installation

### "Insufficient CATI balance"
- Check wallet balance in MetaMask
- Get test CATI from faucet

### "Transaction failed"
- Check you have BNB for gas fees
- Verify correct network (BSC Testnet)
- Check transaction on BSCScan

### Balances not updating
- Wait 30 seconds for auto-refresh
- Check console for errors
- Verify API is running

## 📞 Need Help?

1. Check the documentation files
2. Look at console errors
3. Verify environment variables
4. Test API endpoints directly
5. Check BSCScan for transaction details

## 🎉 What's Next?

- [ ] Test on BSC Testnet
- [ ] Get feedback from users
- [ ] Monitor transaction success rate
- [ ] Optimize gas usage
- [ ] Prepare for mainnet deployment

---

**Note:** This implementation follows Web3 best practices where users control their private keys and initiate all transactions from their wallet.
