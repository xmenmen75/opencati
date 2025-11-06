# USD Currency - Testing Guide

## 🎯 Quick Testing Checklist

### Prerequisites
- ✅ Database migration completed (`npx prisma migrate dev`)
- ✅ Development server running (`npm run dev`)
- ✅ MetaMask installed with BSC Mainnet configured
- ✅ Some USDT tokens in your wallet for testing

---

## 1️⃣ USD Balance Display Test

### Expected Behavior:
- USD button appears in TopBar (LEFT of CATI button)
- Shows "USD: 0.00" format with 2 decimal places
- Button has green background (#10b981)
- Clicking opens USD Management Dialog

### Steps:
1. Navigate to home page
2. Connect wallet
3. Verify USD button appears in TopBar
4. Check mobile menu also shows USD balance

### Desktop Layout:
```
[Cards: X] [USD: X.XX] [CATI: XXX] [Pool] [Reward]
```

### Mobile Menu:
- USD button should appear above CATI button

---

## 2️⃣ USD Deposit Test

### Expected Behavior:
- Dialog shows wallet USDT balance and game USD balance
- Can enter amount and deposit
- MetaMask prompts for USDT approval
- Balance updates after successful deposit
- Transaction appears in history

### Steps:
1. Click "USD: 0.00" button in TopBar
2. USD Management Dialog opens
3. Enter deposit amount (e.g., "5.00")
4. Click "Deposit USD"
5. Approve USDT spending in MetaMask
6. Wait for transaction confirmation
7. Verify:
   - Success toast appears
   - Game balance updates
   - Wallet USDT balance decreases
   - Transaction shows in history

### Important Notes:
- **Network:** Must be on BSC Mainnet (chainId: 56)
- **Decimals:** USDT uses 6 decimals
- **Platform Address:** Funds go to configured platform wallet
- **No Withdrawals:** USD is deposit-only (button should not exist)

---

## 3️⃣ USD Transaction History Test

### Expected Behavior:
- Shows all USD deposits and pack openings
- Displays card details for successful openings
- Summary stats (total deposited, spent, win rate)
- Pagination if many transactions

### Steps:
1. Open USD Management Dialog
2. Click "View History" button
3. Verify transaction list shows:
   - Deposit transactions with green arrow
   - Pack opening transactions with card icon
   - Correct amounts and timestamps
4. Click on a winning pack opening
5. Verify card details display correctly

### What to Check:
- ✅ Deposits show positive amounts (+X.XX USD)
- ✅ Pack openings show negative amounts (-2.00 USD)
- ✅ Card wins show card name, rarity, image
- ✅ Summary stats are accurate
- ✅ Dates format correctly
- ✅ Icons match transaction type

---

## 4️⃣ Pack Opening with USD Test

### Expected Behavior:
- Pack costs 2 USD (not 500 CATI)
- USD balance decreases by 2.00
- **Bid pool does NOT increase**
- Transaction recorded in USD history

### Steps:
1. Ensure you have at least 2 USD balance
2. Click "Flip Card" button
3. Pack animation plays
4. After opening:
   - Check USD balance decreased by 2.00
   - Check CATI balance unchanged
   - Open USD history to verify transaction
5. **Important:** Verify bid pool did NOT increase
   - Check season table directly in database if needed

### Database Verification:
```sql
-- Check USD transaction was created
SELECT * FROM UsdTransaction 
WHERE type = 'SPEND_DRAW' 
ORDER BY createdAt DESC 
LIMIT 1;

-- Verify bid pool not incremented
SELECT bidPoolAmount FROM Season 
WHERE id = [current_season_id];
```

---

## 5️⃣ Multi-Currency Test

### Expected Behavior:
- USD and CATI balances operate independently
- Both currencies visible in UI
- No interference between currencies

### Steps:
1. Have both USD and CATI balances
2. Deposit USD → verify only USD changes
3. Deposit CATI → verify only CATI changes
4. Open pack with USD → verify USD decreases
5. Withdraw CATI → verify only CATI changes
6. Verify USD has NO withdraw button

### Expected Results:
| Action | USD Balance | CATI Balance | Bid Pool |
|--------|-------------|--------------|----------|
| Deposit 5 USD | +5.00 | No change | No change |
| Deposit 500 CATI | No change | +500 | No change |
| Open pack | -2.00 | No change | **No change** ⚠️ |
| Withdraw 100 CATI | No change | -100 | No change |

---

## 6️⃣ Network Switching Test

### Expected Behavior:
- Shows warning if on wrong network
- Prompts to switch to BSC Mainnet
- Disables deposit button until correct network

### Steps:
1. Connect to wrong network (e.g., Ethereum Mainnet)
2. Open USD Management Dialog
3. Verify:
   - Warning message appears
   - "Switch to BSC Mainnet" button shows
   - Deposit form disabled
4. Click "Switch to BSC Mainnet"
5. Verify MetaMask prompts network change
6. After switching:
   - Warning disappears
   - Deposit form enabled
   - Balances load correctly

---

## 7️⃣ Error Handling Test

### Test Cases:

#### A. Insufficient USD Balance
1. Have less than 2 USD
2. Try to open pack
3. Verify error: "Insufficient USD balance"

#### B. Insufficient USDT (wallet)
1. Try to deposit more USDT than you have
2. Verify MetaMask shows error
3. Verify helpful error message in UI

#### C. Invalid Amount
1. Try to deposit negative amount
2. Try to deposit 0
3. Try to deposit with invalid characters
4. Verify validation errors

#### D. Network Rejection
1. Start deposit
2. Reject MetaMask transaction
3. Verify:
   - No balance change
   - Error message shown
   - Can retry

---

## 8️⃣ UI/UX Test

### Desktop View:
- ✅ USD button visible before CATI
- ✅ Green color distinguishes from CATI (grey)
- ✅ Balance formats with 2 decimals
- ✅ Tooltips/hover states work
- ✅ Dialogs center properly

### Mobile View:
- ✅ USD button in hamburger menu
- ✅ Above CATI button in list
- ✅ Proper spacing and alignment
- ✅ Dialogs responsive and scrollable
- ✅ Touch targets adequate size

### Dialog UX:
- ✅ Clear labels and instructions
- ✅ "No withdrawals" notice visible
- ✅ Platform address shown (copy button)
- ✅ Loading states during transactions
- ✅ Success/error messages clear
- ✅ History pagination works

---

## 9️⃣ Performance Test

### What to Monitor:
1. **Balance Loading:**
   - Check Network tab for API calls
   - Should fetch both USDT and USD balances in parallel
   - Should complete in < 2 seconds

2. **Transaction Submission:**
   - Monitor MetaMask response time
   - Check backend API processing time
   - Verify blockchain confirmation time

3. **History Loading:**
   - Check query performance with many transactions
   - Verify pagination works smoothly
   - Test with 100+ transactions

---

## 🔟 Database Integrity Test

### SQL Checks:

```sql
-- 1. Check all users have usdBalance field
SELECT COUNT(*) FROM User WHERE usdBalance IS NULL;
-- Expected: 0

-- 2. Check USD transactions balance
SELECT 
  userId,
  SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as deposits,
  SUM(CASE WHEN type = 'SPEND_DRAW' THEN amount ELSE 0 END) as spends,
  (SELECT usdBalance FROM User WHERE id = UsdTransaction.userId) as current_balance
FROM UsdTransaction
GROUP BY userId;

-- 3. Verify no bid pool increments from USD
SELECT 
  s.id,
  s.bidPoolAmount,
  COUNT(ut.id) as usd_pack_openings
FROM Season s
LEFT JOIN UsdTransaction ut ON ut.type = 'SPEND_DRAW'
WHERE s.createdAt > '2025-10-23'
GROUP BY s.id;
-- bidPoolAmount should not increase with usd_pack_openings

-- 4. Check deposit transaction hashes are unique
SELECT txHash, COUNT(*) 
FROM UsdDeposit 
GROUP BY txHash 
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)
```

---

## 🎯 Acceptance Criteria

### Must Pass:
- [x] USD balance displays correctly in TopBar
- [x] USD deposit flow works end-to-end
- [x] Pack opening uses USD (2.00 per pack)
- [x] Bid pool NOT incremented for USD packs
- [x] USD transaction history accurate
- [x] No USD withdrawal option exists
- [x] USDT contract integration works
- [x] Network switching works
- [x] Error handling graceful
- [x] Mobile UI responsive

### Nice to Have:
- [ ] Loading states smooth
- [ ] Animations polish
- [ ] Toast notifications helpful
- [ ] Balance auto-refresh
- [ ] Transaction status tracking

---

## 🐛 Known Issues / Edge Cases

### 1. Decimal Precision
- **Issue:** USDT uses 6 decimals, UI shows 2
- **Impact:** Very small amounts may not display
- **Workaround:** Enforce minimum deposit of 0.01 USD

### 2. Gas Price Volatility
- **Issue:** BNB gas fees can spike
- **Impact:** Deposit may fail if insufficient BNB
- **Workaround:** Show clear error message

### 3. Transaction Pending
- **Issue:** Blockchain confirmation can take time
- **Impact:** Balance may not update immediately
- **Workaround:** Show "pending" state, allow refresh

### 4. Concurrent Deposits
- **Issue:** Multiple deposits in quick succession
- **Impact:** Race condition possible
- **Workaround:** Disable deposit button during processing

---

## 📊 Success Metrics

After testing, track:
- ✅ All deposit transactions verify correctly
- ✅ No duplicate transaction hash processing
- ✅ Bid pool remains unchanged for USD packs
- ✅ USD and CATI balances independent
- ✅ No TypeScript/runtime errors
- ✅ UI responsive on all screen sizes
- ✅ Network switching smooth
- ✅ Error messages helpful

---

## 🚀 Ready for Production?

### Pre-Launch Checklist:
- [ ] All tests above pass
- [ ] Database migration applied to production
- [ ] Environment variables set correctly
- [ ] Platform wallet has enough BNB for gas
- [ ] Monitoring/alerting configured
- [ ] Rollback plan documented
- [ ] User documentation updated
- [ ] Support team briefed on new feature

---

**Testing Guide Version:** 1.0  
**Last Updated:** October 23, 2025  
**Status:** Ready for Testing
