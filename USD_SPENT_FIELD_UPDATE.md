# UserCard USD Spent Field - Implementation

## Overview
Added `usdSpent` field to `UserCard` model to track USD spending per card, while keeping `catiSpent` for historical data.

**Date:** October 25, 2025  
**Migration:** `20251025031129_add_usd_spent_to_user_card`

---

## Changes Made

### 1. Database Schema Update
**File:** `prisma/schema.prisma`

**Added Field:**
```prisma
model UserCard {
  // ... existing fields
  catiSpent  BigInt   @default(0) @map("cati_spent") // Legacy field - 0 for USD-based openings
  usdSpent   BigInt   @default(0) @map("usd_spent")  // USD spent with 6 decimals (USDT standard)
  // ... rest of model
}
```

**Key Details:**
- `catiSpent` now has `@default(0)` - set to 0 for all new USD-based pack openings
- `usdSpent` tracks USD spending with 6 decimals (e.g., 2 USD = 2,000,000)
- Both fields kept for backward compatibility and historical data

---

### 2. Pack Opening API Update
**File:** `src/app/api/cards/open-pack/route.ts`

**Changes:**
1. Removed `calculateCatiSpent()` function (no longer needed)
2. Updated `UserCard` creation:
   ```typescript
   await tx.userCard.create({
     data: {
       // ...
       catiSpent: BigInt(0),    // ← Set to 0 for USD openings
       usdSpent: PACK_COST,     // ← Track USD spent (2 USD)
       catiReward: BigInt(0),
     },
   });
   ```
3. Updated response to include both fields:
   ```typescript
   {
     catiSpent: result.userCard!.catiSpent.toString(),
     usdSpent: result.userCard!.usdSpent.toString(),  // ← New field
     // ...
   }
   ```

---

## Database Migration

### Migration Applied
```bash
npx prisma migrate dev --name add_usd_spent_to_user_card
```

**Migration SQL:**
```sql
-- Add usd_spent column with default 0
ALTER TABLE `user_cards` 
  ADD COLUMN `usd_spent` BIGINT NOT NULL DEFAULT 0 AFTER `cati_spent`;

-- Modify cati_spent to have default 0
ALTER TABLE `user_cards` 
  MODIFY COLUMN `cati_spent` BIGINT NOT NULL DEFAULT 0;
```

**Impact:**
- All existing `UserCard` records: `usdSpent` = 0 (legacy CATI openings)
- All new `UserCard` records: `catiSpent` = 0, `usdSpent` = 2000000 (2 USD)

---

## Data Interpretation

### For Legacy Cards (Before USD)
```typescript
{
  catiSpent: "500",      // Spent 500 CATI
  usdSpent: "0",         // No USD spent (before USD system)
  catiReward: "50"       // Earned CATI reward
}
```

### For Current Cards (After USD)
```typescript
{
  catiSpent: "0",        // No CATI spent (using USD now)
  usdSpent: "2000000",   // Spent 2 USD (with 6 decimals)
  catiReward: "0"        // Rewards disabled during migration
}
```

---

## Why Both Fields?

### Historical Data Preservation
- Keep `catiSpent` for cards opened before USD migration
- Shows accurate spending history per user
- Analytics can differentiate CATI vs USD eras

### Flexibility for Future
- Could support dual-currency pack openings
- Easy to calculate total spending in either currency
- Clear separation for accounting/reporting

### Database Integrity
- No data loss from migration
- Existing queries still work (catiSpent exists)
- New queries can use usdSpent

---

## Usage Examples

### Display Card Cost to User
```typescript
const displayCost = (userCard: UserCard) => {
  if (userCard.usdSpent > 0) {
    return `${(userCard.usdSpent / 1_000_000).toFixed(2)} USD`;
  } else if (userCard.catiSpent > 0) {
    return `${userCard.catiSpent} CATI`;
  }
  return 'Free';
};
```

### Calculate User Total Spending
```typescript
const getUserTotalSpending = async (userId: bigint) => {
  const cards = await prisma.userCard.findMany({
    where: { userId },
  });
  
  const totalCati = cards.reduce((sum, c) => sum + c.catiSpent, BigInt(0));
  const totalUsd = cards.reduce((sum, c) => sum + c.usdSpent, BigInt(0));
  
  return {
    catiSpent: totalCati.toString(),
    usdSpent: (Number(totalUsd) / 1_000_000).toFixed(2) + ' USD',
  };
};
```

### Filter Cards by Currency
```typescript
// Get only USD-opened cards
const usdCards = await prisma.userCard.findMany({
  where: {
    userId,
    usdSpent: { gt: 0 },
  },
});

// Get only CATI-opened cards
const catiCards = await prisma.userCard.findMany({
  where: {
    userId,
    catiSpent: { gt: 0 },
  },
});
```

---

## API Response Format

### Pack Opening Success Response
```json
{
  "success": true,
  "card": {
    "id": "123",
    "rank": "A",
    "name": "Fire Dragon",
    "catiSpent": "0",           // ← Always 0 for USD openings
    "usdSpent": "2000000",      // ← 2 USD in blockchain units
    "catiReward": "0",
    "acquiredAt": "2025-10-25T03:11:29Z",
    // ... other fields
  },
  "userCardId": "456",
  "newBalance": "8000000"       // 8 USD remaining
}
```

---

## Testing Checklist

- [x] Migration applied successfully
- [x] TypeScript compilation passes
- [x] New UserCards created with correct fields:
  - [ ] `catiSpent` = 0
  - [ ] `usdSpent` = 2000000 (2 USD)
- [ ] Pack opening deducts USD balance
- [ ] API response includes both `catiSpent` and `usdSpent`
- [ ] Existing UserCards unchanged (backward compatibility)
- [ ] Seed file runs successfully with new schema

---

## Database Query Examples

### Check Current Data
```sql
-- View recent pack openings
SELECT 
  id,
  userId,
  cardId,
  catiSpent,
  usdSpent / 1000000.0 as usd_spent_readable,
  acquiredAt
FROM user_cards
ORDER BY acquiredAt DESC
LIMIT 10;

-- Count cards by currency
SELECT 
  CASE 
    WHEN usdSpent > 0 THEN 'USD'
    WHEN catiSpent > 0 THEN 'CATI'
    ELSE 'FREE'
  END as currency_type,
  COUNT(*) as card_count
FROM user_cards
GROUP BY currency_type;

-- Total spending per user
SELECT 
  userId,
  SUM(catiSpent) as total_cati,
  SUM(usdSpent) / 1000000.0 as total_usd,
  COUNT(*) as total_cards
FROM user_cards
GROUP BY userId;
```

---

## Future Considerations

### Phase 2: Dual Currency Support
If we want to support both CATI and USD pack openings:
```typescript
const PACK_COSTS = {
  [CurrencyType.CATI]: BigInt(500),
  [CurrencyType.USD]: BigInt(2_000_000),
};

// User chooses currency
const currency = request.body.currency; // 'CATI' or 'USD'
const cost = PACK_COSTS[currency];

// Set appropriate field
const userCard = await tx.userCard.create({
  data: {
    catiSpent: currency === 'CATI' ? cost : BigInt(0),
    usdSpent: currency === 'USD' ? cost : BigInt(0),
    // ...
  },
});
```

### Analytics Dashboard
- Track USD adoption rate (% of cards opened with USD vs CATI)
- Compare average spending per user in each currency
- Monitor currency preferences over time

---

## Rollback Plan

If needed to rollback:
```bash
# Revert migration
npx prisma migrate resolve --rolled-back 20251025031129_add_usd_spent_to_user_card

# Or restore from backup
mysql -u root -p opencati_db < backup_before_usd_spent.sql
```

---

## Summary

✅ **Added:** `usdSpent` field to track USD spending per card  
✅ **Preserved:** `catiSpent` field for historical data (now defaults to 0)  
✅ **Updated:** Pack opening API to set appropriate field  
✅ **Migrated:** Database with backward-compatible defaults  
✅ **No Breaking Changes:** Existing code continues to work  

**Status:** Complete and Ready for Testing  
**Next Step:** Test pack opening with USD and verify both fields are set correctly
