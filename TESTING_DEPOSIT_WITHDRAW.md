# Testing Guide for CATI Deposit & Withdrawal

## Prerequisites

1. **MetaMask installed** in your browser
2. **BSC Testnet configured** in MetaMask
3. **Test BNB** in your wallet (for gas fees)
4. **Test CATI tokens** in your wallet
5. **Wallet connected** to the application

## Getting Test Tokens

### 1. Get Test BNB
- Visit BSC Testnet Faucet: https://testnet.bnbchain.org/faucet-smart
- Enter your wallet address
- Claim test BNB

### 2. Get Test CATI Tokens
- Deploy your test CATI token contract OR
- Use existing testnet CATI token
- Update `.env.local` with contract address

## Environment Setup

Create `.env.local` file:

```env
NEXT_PUBLIC_CATI_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=0x9876543210987654321098765432109876543210
```

Create `.env` file:

```env
PLATFORM_WALLET_ADDRESS=0x9876543210987654321098765432109876543210
PLATFORM_WALLET_PRIVATE_KEY=your_private_key_here
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

## Test Scenarios

### Test 1: Successful Deposit

**Steps:**
1. Open CATI Management Dialog
2. Verify wallet CATI balance shows correctly
3. Enter amount (e.g., "10")
4. Click "Deposit CATI"
5. Confirm transaction in MetaMask
6. Wait for confirmation toast

**Expected Result:**
- ✅ MetaMask popup appears with correct details
- ✅ Loading toast shows "Processing..."
- ✅ Success toast shows "Deposit successful!"
- ✅ Wallet balance decreases
- ✅ Game balance increases
- ✅ Transaction appears in history

### Test 2: Insufficient CATI Balance

**Steps:**
1. Check your wallet CATI balance
2. Try to deposit more than you have
3. Click "Deposit CATI"

**Expected Result:**
- ✅ Error toast: "Insufficient CATI balance"
- ✅ No MetaMask popup
- ✅ Balances unchanged

### Test 3: Cancelled Transaction

**Steps:**
1. Enter valid amount
2. Click "Deposit CATI"
3. Click "Reject" in MetaMask popup

**Expected Result:**
- ✅ Error toast: "Transaction cancelled by user"
- ✅ Balances unchanged
- ✅ Form still shows entered amount

### Test 4: Insufficient Gas (BNB)

**Steps:**
1. Ensure wallet has < 0.001 BNB
2. Try to deposit CATI

**Expected Result:**
- ✅ MetaMask shows "Insufficient funds for gas"
- ✅ Transaction fails before submission
- ✅ Error message displayed

### Test 5: Successful Withdrawal

**Steps:**
1. Ensure you have game balance
2. Enter withdrawal amount (e.g., "5")
3. Click "Withdraw CATI"
4. Wait for confirmation

**Expected Result:**
- ✅ Loading toast shows "Processing..."
- ✅ Success toast with transaction hash
- ✅ Game balance decreases
- ✅ Wallet balance increases (check on BSCScan)
- ✅ Transaction appears in history

### Test 6: Insufficient Game Balance

**Steps:**
1. Try to withdraw more than game balance
2. Click "Withdraw CATI"

**Expected Result:**
- ✅ Button is disabled OR
- ✅ Error toast: "Insufficient CATI balance"
- ✅ Balances unchanged

### Test 7: Duplicate Deposit Prevention

**Steps:**
1. Complete a successful deposit
2. Copy the transaction hash from BSCScan
3. Try to manually submit the same txHash to API

**Expected Result:**
- ✅ API returns error: "Transaction already processed"
- ✅ Balance not credited twice

### Test 8: Wrong Network

**Steps:**
1. Switch MetaMask to Ethereum Mainnet
2. Try to deposit

**Expected Result:**
- ✅ Error about wrong network OR
- ✅ Transaction fails gracefully

### Test 9: Balance Auto-Refresh

**Steps:**
1. Complete a deposit or withdrawal
2. Wait 30 seconds
3. Observe balance updates

**Expected Result:**
- ✅ Balances refresh automatically
- ✅ No need to reload page

### Test 10: Wallet Disconnection

**Steps:**
1. Open CATI Management Dialog
2. Disconnect wallet in MetaMask
3. Try to deposit

**Expected Result:**
- ✅ Error message about wallet not connected
- ✅ Graceful handling, no crash

## Manual Testing Commands

### Check Balances

```bash
# In browser console after connecting wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();
console.log('Wallet Address:', address);

const contract = new ethers.Contract(
  'YOUR_CATI_TOKEN_ADDRESS',
  ['function balanceOf(address) view returns (uint256)'],
  provider
);
const balance = await contract.balanceOf(address);
console.log('CATI Balance:', ethers.formatUnits(balance, 18));
```

### Verify Transaction on BSCScan

1. Copy transaction hash from success message
2. Visit: https://testnet.bscscan.com/tx/[YOUR_TX_HASH]
3. Verify:
   - Status: Success
   - From: Your wallet address
   - To: Platform wallet address (for deposits)
   - Token Transfer: CATI amount matches

## Debugging Tips

### Issue: "No Ethereum provider found"

**Check:**
- MetaMask is installed
- MetaMask is unlocked
- Page has been refreshed after installing MetaMask

### Issue: "Transaction not found"

**Check:**
- Wait a few seconds, transaction might be pending
- Check network (BSC Testnet vs Mainnet)
- Verify transaction hash is correct

### Issue: Balances not updating

**Check:**
- React Query devtools for cache state
- Network tab for API calls
- Console for errors
- Database records

### Issue: "Failed to verify deposit"

**Check:**
- Transaction actually went to platform wallet
- Amount matches exactly
- Transaction succeeded on blockchain
- User's wallet address matches account

## Integration Testing

### Test API Endpoints Directly

```bash
# Get auth token first
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"message":"...","signature":"..."}'

# Test deposit verification
curl -X POST http://localhost:3000/api/transactions/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10",
    "fromAddress": "0xYourAddress",
    "txHash": "0xYourTransactionHash"
  }'

# Test withdrawal
curl -X POST http://localhost:3000/api/transactions/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "5",
    "toAddress": "0xYourAddress"
  }'
```

## Performance Testing

### Load Test Deposits
- Multiple users depositing simultaneously
- Check database transaction handling
- Verify no race conditions

### Load Test Withdrawals
- Check platform wallet gas management
- Verify queue handling if many withdrawals
- Check for deadlocks

## Monitoring

### Things to Monitor

1. **Platform Wallet Balance**
   - Should have enough CATI for withdrawals
   - Should have enough BNB for gas

2. **Failed Transactions**
   - Track failure rate
   - Investigate patterns

3. **Average Confirmation Time**
   - Deposits: Time from MetaMask to credited
   - Withdrawals: Time from request to completed

4. **Gas Costs**
   - Track average gas used
   - Optimize if too high

## Success Criteria

- ✅ All test scenarios pass
- ✅ No console errors
- ✅ Balances always accurate
- ✅ Transactions never lost
- ✅ Failed transactions rollback correctly
- ✅ UI responsive and clear
- ✅ Error messages helpful

## Next Steps After Testing

1. Fix any identified bugs
2. Optimize gas usage if needed
3. Improve error messages
4. Add monitoring/alerts
5. Document any edge cases found
6. Update user documentation
7. Deploy to testnet for broader testing
8. Prepare for mainnet deployment
