# USD Currency - Quick Reference

## 🚀 Quick Start

### Running the App
```bash
# Development
npm run dev

# The USD system is automatically available once you connect your wallet
```

### User Flow
1. Connect MetaMask wallet (BSC Mainnet)
2. Click **"USD: 0.00"** button in top bar (green button, left of CATI)
3. Deposit USDT from your wallet
4. Open card packs for 2 USD each

---

## 📍 Key Code Locations

### Currency Configuration
**File:** `src/lib/currency.ts`
```typescript
// Change pack opening currency/price here:
export const PACK_OPENING_COST = {
  currency: CurrencyType.USD,  // ← Change this to switch currency
  amount: 2,                   // ← Change this to adjust price
};
```

### USDT Contract Address
**BSC Mainnet:** `0x55d398326f99059fF775485246999027B3197955`

### Platform Wallet
**Configured in:** `src/lib/blockchain.ts`
```typescript
export const PLATFORM_WALLET_CONFIG = {
  address: process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || '...',
};
```

---

## 🔑 Important Constants

| Constant | Value | Location |
|----------|-------|----------|
| Pack Cost | 2 USD | `src/lib/currency.ts` |
| USDT Decimals | 6 | `src/lib/usdt-token.ts` |
| CATI Decimals | 18 | `src/lib/cati-token.ts` |
| USD Display Decimals | 2 | `src/lib/currency.ts` |
| Network | BSC Mainnet (56) | `src/lib/blockchain.ts` |

---

## 🗄️ Database Schema

```sql
-- User has USD balance (6 decimals)
User {
  usdBalance: BigInt  -- in blockchain units (divide by 1,000,000 for display)
}

-- USD deposits tracked separately
UsdDeposit {
  userId, amount, status, txHash, requestedAt, completedAt
}

-- USD transaction history
UsdTransaction {
  userId, type, amount, description, referenceId, createdAt
}

-- Types: 'DEPOSIT' | 'SPEND_DRAW'
-- Status: 'PENDING' | 'COMPLETED' | 'FAILED'
```

---

## 🎨 UI Components

### TopBar
- **Desktop:** USD button LEFT of CATI button
- **Mobile:** USD in hamburger menu, above CATI
- **Color:** Green (#10b981) to distinguish from CATI (grey)

### USD Management Dialog
- Shows wallet USDT vs game USD balance
- Deposit form only (no withdrawals)
- Link to transaction history
- Platform address with copy button

### USD History Dialog
- Lists deposits and pack openings
- Shows card details for wins
- Summary stats (deposited, spent, win rate)

---

## 🔄 API Endpoints

### Deposit USD
```
POST /api/transactions/deposit/usd
Body: { txHash: string, amount: string }
Returns: { success, message, deposit }
```

### Get USD Transactions
```
GET /api/transactions/usd?limit=50&offset=0
Returns: { 
  transactions: [...],
  summary: { totalDeposited, totalSpent, packOpenCount, successfulPacks }
}
```

### Open Pack (uses USD now)
```
POST /api/cards/open-pack
Body: { seasonId: bigint }
Deducts: 2 USD from user.usdBalance
```

---

## ⚡ React Query Hooks

```typescript
// Fetch USD transaction history
const { data, isLoading } = useUsdTransactions(limit, offset);

// Create USD deposit
const createDeposit = useCreateUsdDeposit();
createDeposit.mutate({ txHash, amount });

// Wallet hook includes USDT
const { usdtBalance, depositUsdt } = useWallet();
```

---

## 🔧 Common Tasks

### Change Pack Opening Price
**File:** `src/lib/currency.ts`
```typescript
export const PACK_OPENING_COST = {
  currency: CurrencyType.USD,
  amount: 5,  // ← Change to 5 USD
};
```

### Switch Back to CATI
**File:** `src/lib/currency.ts`
```typescript
export const PACK_OPENING_COST = {
  currency: CurrencyType.CATI,  // ← Switch back to CATI
  amount: 500,
};
```

### Add New Currency
1. Add to `CurrencyType` enum in `currency.ts`
2. Add config to `CURRENCY_CONFIG`
3. Create token integration file (e.g., `busd-token.ts`)
4. Add blockchain service class
5. Update pack opening API

---

## ⚠️ Important Notes

### Bid Pool Disabled for USD
```typescript
// This code is REMOVED from pack opening:
// ❌ await tx.season.update({
//   data: { bidPoolAmount: { increment: PACK_COST } }
// });

// Bid pool only increments for CATI packs
// Multi-currency bid pool coming in Phase 2
```

### No USD Withdrawals
- USD is **deposit-only** by design
- No `/api/transactions/withdraw/usd` endpoint exists
- No "Withdraw USD" button in UI
- Users must convert to CATI first (future feature)

### Decimal Precision
```typescript
// USDT (6 decimals):
1 USD = 1,000,000 blockchain units
2.50 USD = 2,500,000 blockchain units

// CATI (18 decimals):
1 CATI = 1,000,000,000,000,000,000 blockchain units
```

---

## 🐛 Debugging

### Check USD Balance in Database
```sql
SELECT 
  id,
  walletAddress,
  usdBalance,
  usdBalance / 1000000.0 as usd_readable
FROM User
WHERE walletAddress = '0x...';
```

### Check USD Transactions
```sql
SELECT 
  type,
  amount / 1000000.0 as usd_amount,
  description,
  createdAt
FROM UsdTransaction
WHERE userId = 123
ORDER BY createdAt DESC;
```

### Verify Bid Pool Not Incrementing
```sql
-- Check if bidPoolAmount changed during USD pack openings
SELECT 
  s.id,
  s.bidPoolAmount,
  COUNT(ut.id) as usd_pack_count
FROM Season s
LEFT JOIN UsdTransaction ut ON ut.type = 'SPEND_DRAW' 
  AND ut.createdAt BETWEEN s.startDate AND s.endDate
GROUP BY s.id;
```

---

## 🧪 Quick Test Commands

### Test USD Deposit (in browser console)
```javascript
// After connecting wallet
const depositUsdt = async () => {
  const result = await depositUsdt('5.00');
  console.log('Deposit result:', result);
};
```

### Check Current Currency Config
```javascript
import { PACK_OPENING_COST } from '@/lib/currency';
console.log('Current pack cost:', PACK_OPENING_COST);
```

---

## 📱 Mobile Testing

### Test on Real Device
1. Access dev server via local IP: `http://192.168.x.x:3000`
2. Connect MetaMask mobile app
3. Test USD deposit and pack opening
4. Verify UI responsive and touch targets adequate

### Responsive Breakpoints
- Desktop: `lg:` (1024px+) - USD button in TopBar
- Mobile/Tablet: `< lg` - USD in hamburger menu

---

## 🔐 Security Checklist

- [x] USD deposits verified on blockchain
- [x] No USD withdrawal endpoint
- [x] Atomic database transactions
- [x] Input validation on amounts
- [x] Transaction hash duplicate check
- [ ] Rate limiting (TODO)
- [ ] Admin monitoring dashboard (TODO)

---

## 📊 Success Metrics

Track these after deployment:
- USD deposit success rate (target: >95%)
- Average deposit amount
- USD vs CATI pack opening ratio
- Platform wallet USDT balance
- Transaction verification time
- Error rate by type

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| USD button not showing | Check wallet connected and authenticated |
| "Wrong network" error | Switch to BSC Mainnet (chainId: 56) |
| Deposit not credited | Check blockchain confirmation, verify txHash |
| "Insufficient USD" | User needs to deposit more USDT |
| Balance not updating | Force refresh or invalidate React Query cache |
| Bid pool increasing | Check pack opening API - should NOT increment for USD |

---

## 📚 Documentation

- **Architecture:** USD_CURRENCY_IMPLEMENTATION.md
- **Progress:** USD_IMPLEMENTATION_SUMMARY.md
- **Testing:** USD_TESTING_GUIDE.md
- **Summary:** USD_IMPLEMENTATION_COMPLETE.md
- **Quick Ref:** USD_QUICK_REFERENCE.md (this file)

---

**Version:** 1.0  
**Last Updated:** October 23, 2025  
**Status:** Production Ready
