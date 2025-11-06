# USD Currency Implementation Plan

## Overview
This document outlines the implementation strategy for adding USD as a second currency to the OpenCATI platform while preserving all existing CATI functionality.

## Business Requirements
j
### Core Rules
1. **USD Deposits**: Users can deposit USD (USDT) from their wallet into the game
2. **No USD Withdrawals**: USD cannot be withdrawn (only CATI can be withdrawn)
3. **Card Opening with USD**: Pack opening costs **2 USD** per card (changed from 500 CATI)
4. **Bid Pool Disabled**: Bid pool calculation is temporarily disabled during migration
5. **Dual Currency UI**: Show both CATI and USD balances in top bar
6. **Separate Transaction History**: USD has its own transaction history (deposits + spending only)
7. **CATI Unchanged**: All existing CATI features remain functional (withdrawals, deposits, rewards, etc.)

### Technical Constraints
- **Easy Currency Switching**: Architecture must support easy switching between currencies in code
- **Minimal Impact**: Changes should not break existing CATI functionality
- **Future-Proof**: Design should support future multi-currency expansion

## Architecture Design

### 1. Currency Abstraction Layer

Create `src/lib/currency.ts` as a central abstraction:

```typescript
// Currency types
export enum CurrencyType {
  CATI = 'CATI',
  USD = 'USD',
}

// Currency configurations
export const CURRENCY_CONFIG = {
  CATI: {
    symbol: 'CATI',
    decimals: 18,
    displayDecimals: 0,
    canWithdraw: true,
    canDeposit: true,
  },
  USD: {
    symbol: 'USD',
    decimals: 6, // USDT typically uses 6 decimals
    displayDecimals: 2,
    canWithdraw: false,
    canDeposit: true,
  },
};

// Pack opening costs
export const PACK_OPENING_COST = {
  currency: CurrencyType.USD,
  amount: 2, // 2 USD per pack
};

// Helper functions for currency formatting, validation, etc.
```

### 2. Database Schema Changes

**New Fields in `User` model:**
```prisma
model User {
  // ... existing fields
  usdBalance  BigInt @default(0) @map("usd_balance")
  
  // ... existing relations
  usdDeposits  UsdDeposit[]
  usdTransactions UsdTransaction[]
}
```

**New `UsdDeposit` table:**
```prisma
model UsdDeposit {
  id          BigInt    @id @default(autoincrement())
  userId      BigInt    @map("user_id")
  amount      BigInt    // Amount in USD (with 6 decimals)
  status      String    @db.VarChar(20) // PENDING, COMPLETED, FAILED
  requestedAt DateTime  @default(now()) @map("requested_at")
  completedAt DateTime? @map("completed_at")
  txHash      String?   @map("tx_hash") @db.VarChar(255)
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("usd_deposits")
}
```

**New `UsdTransaction` table:**
```prisma
model UsdTransaction {
  id          BigInt   @id @default(autoincrement())
  userId      BigInt   @map("user_id")
  type        String   @db.VarChar(20) // DEPOSIT, SPEND_DRAW
  amount      BigInt   // Positive for deposits, negative for spending
  description String   @db.VarChar(255)
  referenceId BigInt?  @map("reference_id")
  createdAt   DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("usd_transactions")
}
```

**Migration Strategy:**
- Keep `bidPoolAmount` field in Season table but stop incrementing it
- Add comment in schema indicating it's temporarily disabled
- UserCard continues to track `catiSpent` for historical data, but new cards will have 0

### 3. Blockchain Integration

**Create `src/lib/usdt-token.ts`:**
- Mirror structure of `cati-token.ts`
- USDT contract address on BSC (6 decimals instead of 18)
- Deposit functions (no withdrawal)
- Balance checking functions

**Update `src/lib/blockchain.ts`:**
- Add USDT configuration
- Create `UsdtBlockchainService` class
- Implement deposit verification for USDT

**Environment Variables:**
```bash
NEXT_PUBLIC_USDT_TOKEN_ADDRESS=0x...  # USDT contract on BSC
```

### 4. API Endpoints

#### Modified Endpoints

**`/api/cards/open-pack/route.ts`:**
```typescript
const PACK_COST_USD = BigInt('2000000'); // 2 USD with 6 decimals

// Changes:
// 1. Deduct from user.usdBalance instead of user.catiBalance
// 2. Create UsdTransaction instead of CatiTransaction
// 3. DO NOT increment season.bidPoolAmount
// 4. DO NOT update UserCard.catiSpent (set to 0 or remove)
```

**`/api/users/profile/route.ts`:**
- Add `usdBalance` to response

**`/api/auth/me/route.ts`:**
- Add `usdBalance` to response

#### New Endpoints

**`/api/transactions/deposit/usd/route.ts`:**
- Accept USD deposit (similar to CATI deposit)
- Verify USDT transaction on blockchain
- Update `usdBalance`
- Create `UsdDeposit` and `UsdTransaction` records

**`/api/transactions/usd/route.ts`:**
- GET endpoint for USD transaction history
- Returns deposits and card purchases only
- Similar structure to existing `/api/transactions/route.ts`

### 5. Frontend Components

#### New Components

**`src/app/home/_components/UsdManagementDialog.tsx`:**
- Deposit section only (no withdrawal)
- Show USD balance vs wallet USDT balance
- USD transaction history
- Link to USD history dialog

**`src/app/home/_components/UsdHistoryDialog.tsx`:**
- Show USD deposits
- Show card purchases with USD
- Summary stats (total deposited, total spent)

#### Modified Components

**`src/app/home/_components/TopBar.tsx`:**
```tsx
// Desktop layout:
[Cards] [USD: xxx] [CATI: xxx] [Pool] [Reward] ... [Profile]

// Mobile menu:
- USD: xxx
- CATI: xxx
- Cards: xxx
- Pool Amt: xxx
- Reward: xxx
```

**`src/app/home/page.tsx`:**
- Add state for USD management dialog
- Pass USD balance to TopBar
- Handle USD dialog open/close

#### UI Considerations
- USD button styled similarly to CATI button
- Clear visual distinction between currencies
- USD balance shows 2 decimal places (vs CATI with 0)
- USD icon/color different from CATI

### 6. Type Definitions

**`src/types/user.ts`:**
```typescript
export interface User {
  // ... existing fields
  usdBalance: string; // String for BigInt serialization
}
```

**`src/types/index.ts`:**
```typescript
export type UsdTransactionType = 'DEPOSIT' | 'SPEND_DRAW';
export type UsdDepositStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface UsdDeposit {
  id: string;
  userId: string;
  amount: string;
  status: UsdDepositStatus;
  requestedAt: string;
  completedAt?: string;
  txHash?: string;
}

export interface UsdTransaction {
  id: string;
  userId: string;
  type: UsdTransactionType;
  amount: string;
  description: string;
  referenceId?: string;
  createdAt: string;
}
```

### 7. React Query Hooks

**`src/hooks/queries.ts`:**
```typescript
// USD Deposit
export function useCreateUsdDeposit() {
  return useMutation({
    mutationFn: async (data: { amount: string; fromAddress: string; txHash: string }) => {
      return apiClient.post('/api/transactions/deposit/usd', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['usd-transactions'] });
    },
  });
}

// USD Transactions
export function useUsdTransactions(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['usd-transactions', limit, offset],
    queryFn: async () => {
      return apiClient.get(`/api/transactions/usd?limit=${limit}&offset=${offset}`);
    },
  });
}
```

### 8. Wallet Integration

**Update `src/app/hooks/useWallet.ts`:**
```typescript
// Add USDT balance fetching
const [usdtBalance, setUsdtBalance] = useState('0');

// Add depositUsdt function
const depositUsdt = async (amount: string) => {
  // Transfer USDT to platform wallet
  // Return tx hash
};
```

## Implementation Steps

### Phase 1: Database & Types (Foundation)
1. ✅ Update Prisma schema
2. ✅ Generate TypeScript types
3. ✅ Run migration
4. ✅ Update seed data

### Phase 2: Blockchain & Currency Layer
5. ✅ Create `lib/currency.ts`
6. ✅ Create `lib/usdt-token.ts`
7. ✅ Update `lib/blockchain.ts` with USDT support
8. ✅ Update environment variables

### Phase 3: Backend APIs
9. ✅ Create USD deposit endpoint
10. ✅ Create USD transaction history endpoint
11. ✅ Update user profile endpoints
12. ✅ Modify pack opening to use USD
13. ✅ Disable bid pool increments

### Phase 4: Frontend (UI & Hooks)
14. ✅ Update TypeScript types
15. ✅ Create React Query hooks
16. ✅ Create UsdManagementDialog
17. ✅ Create UsdHistoryDialog
18. ✅ Update TopBar component
19. ✅ Update useWallet hook
20. ✅ Update home page

### Phase 5: Testing & Documentation
21. ✅ Test USD deposit flow
22. ✅ Test pack opening with USD
23. ✅ Test CATI flows still work
24. ✅ Update documentation

## Bid Pool Handling

**Current State:**
- `season.bidPoolAmount` is incremented on every pack opening (500 CATI)
- Used in reward calculations

**New State:**
- Stop incrementing `season.bidPoolAmount` when packs are opened with USD
- Keep the field for historical data
- Reward calculation disabled until multi-currency support finalized

**Code Changes:**
```typescript
// In /api/cards/open-pack/route.ts
// REMOVE these lines:
await tx.season.update({
  where: { id: actualSeason.id },
  data: {
    bidPoolAmount: {
      increment: PACK_COST,
    },
  },
});
```

## Currency Switching Pattern

**Design Principle:** Make currency switching explicit and easy to change:

```typescript
// ❌ BAD - Hard-coded currency
const cost = BigInt('500');
user.catiBalance -= cost;

// ✅ GOOD - Currency-aware
import { PACK_OPENING_COST, deductBalance } from '@/lib/currency';

const cost = PACK_OPENING_COST.amount;
const currency = PACK_OPENING_COST.currency;
await deductBalance(userId, cost, currency);
```

**Benefits:**
- Easy to see which currency is used where
- Simple to switch currencies (change one constant)
- Type-safe with TypeScript enums
- Future-proof for multi-currency

## Migration Path

**Current System:**
- Pack opening: 500 CATI
- Bid pool: Calculated from CATI spending
- Rewards: Based on bid pool percentage

**Interim System (this implementation):**
- Pack opening: 2 USD
- Bid pool: Disabled (not calculated)
- Rewards: Disabled (no bid pool to distribute)

**Future System:**
- Pack opening: Configurable currency (USD or CATI)
- Bid pool: Separate pools per currency
- Rewards: Multi-currency distribution logic
- Bridge: USD ⟷ CATI conversion

## Testing Checklist

### USD Functionality
- [ ] USD deposit from wallet works
- [ ] USD balance updates correctly
- [ ] Pack opening deducts USD
- [ ] USD transaction history shows correctly
- [ ] USD withdrawal is disabled (no endpoint exists)
- [ ] USD balance displays with 2 decimals

### CATI Functionality (Regression)
- [ ] CATI deposit still works
- [ ] CATI withdrawal still works
- [ ] CATI balance updates correctly
- [ ] CATI transaction history unchanged
- [ ] Reward claims still work
- [ ] CATI balance displays with 0 decimals

### UI/UX
- [ ] Both balances visible in top bar (desktop)
- [ ] Both balances visible in mobile menu
- [ ] USD button positioned left of CATI button
- [ ] Dialogs open correctly
- [ ] Visual distinction between currencies clear

### Edge Cases
- [ ] Insufficient USD balance blocks pack opening
- [ ] USD deposit with wrong txHash fails
- [ ] USD management dialog shows correct balances
- [ ] Pack opening creates USD transaction record
- [ ] Historical CATI-based cards still have rewards

## Security Considerations

1. **Dual Balance Management**: Ensure atomic updates to prevent balance inconsistencies
2. **Transaction Verification**: USDT transactions must be verified on-chain
3. **No USD Withdrawal**: Ensure no code path allows USD withdrawal
4. **Rate Limiting**: Apply to both CATI and USD operations
5. **Blockchain Verification**: Use same rigorous checks as CATI deposits

## Performance Considerations

1. **Parallel Queries**: Fetch CATI and USD balances in parallel
2. **Caching**: Use React Query caching for both currencies
3. **Database Indexes**: Add indexes on userId for new tables
4. **Transaction History**: Paginate both CATI and USD histories

## Future Enhancements

1. **Multi-Currency Bid Pool**: Separate pools per currency
2. **USD ⟷ CATI Bridge**: Allow conversion between currencies
3. **Configurable Pack Costs**: Admin can set costs per currency
4. **Multi-Currency Rewards**: Distribute rewards in original currency
5. **Price Oracle**: Real-time USD/CATI conversion rates

## Success Criteria

✅ USD deposits work reliably
✅ Pack opening uses USD correctly
✅ CATI features remain fully functional
✅ UI clearly shows both balances
✅ Code is maintainable and currency-switching is easy
✅ Bid pool logic cleanly disabled
✅ No regression in existing features
✅ Documentation complete

---

**Last Updated:** October 23, 2025
**Status:** Planning Complete - Ready for Implementation
