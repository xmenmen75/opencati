# Environment Variables Setup

## Required Environment Variables

### Frontend Variables (`.env.local`)

Create a `.env.local` file in the root directory with these variables:

```env
# CATI Token Contract Address (BSC Mainnet)
NEXT_PUBLIC_CATI_TOKEN_ADDRESS=0xE66f3887177f59fC8FAe956b17104458aCD4b1DA

# Platform Wallet Address (public - where deposits go)
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=your_platform_wallet_address_here
```

### Backend Variables (`.env`)

Create a `.env` file in the root directory with these variables:

```env
# Database
DATABASE_URL=your_database_connection_string

# JWT Secret
JWT_SECRET=your_secret_key_here

# Platform Wallet (Backend)
PLATFORM_WALLET_ADDRESS=same_as_above
PLATFORM_WALLET_PRIVATE_KEY=your_private_key_here_KEEP_SECRET

# BSC RPC Endpoint
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
# For mainnet, use:
# BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/
```

## CATI Token Information

**Contract Address:** `0xE66f3887177f59fC8FAe956b17104458aCD4b1DA`

**Network:** Binance Smart Chain (BSC)

**Token Standard:** BEP-20 (ERC-20 compatible)

**Decimals:** 18

You can verify the contract on BSCScan:
- Mainnet: https://bscscan.com/token/0xE66f3887177f59fC8FAe956b17104458aCD4b1DA
- Add to MetaMask using this address

## Setup Steps

### 1. Create Environment Files

```bash
# Copy example files
cp .env.local.example .env.local
cp .env.example .env

# Edit with your values
nano .env.local
nano .env
```

### 2. Configure Platform Wallet

You need a wallet that will:
- Receive deposits from users
- Send withdrawals to users

**Important:** Keep the private key SECRET and SECURE!

```env
# This is public (users send tokens here)
NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS=0xYourWalletAddress

# This is SECRET (backend uses to send withdrawals)
PLATFORM_WALLET_PRIVATE_KEY=0xYourPrivateKey
```

### 3. Verify Contract Address

The contract address is now set correctly:
- ✅ `0xE66f3887177f59fC8FAe956b17104458aCD4b1DA` (CATI Token)

This is used for:
- Reading user's CATI balance
- Verifying deposit transactions
- Sending withdrawal transactions

## Testing the Setup

### 1. Check if contract is accessible

```bash
npm run dev
```

Open browser console and run:
```javascript
// Should not show "could not decode result data" error anymore
// Check if CATI balance loads correctly
```

### 2. Verify MetaMask Connection

1. Connect MetaMask
2. Switch to BSC Mainnet
3. Add CATI token to MetaMask:
   - Address: `0xE66f3887177f59fC8FAe956b17104458aCD4b1DA`
   - Symbol: CATI
   - Decimals: 18

### 3. Test Balance Fetching

Open CATI Management Dialog and verify:
- ✅ Wallet CATI balance shows correctly
- ✅ BNB balance shows correctly
- ✅ No console errors

## Common Issues

### Issue: "could not decode result data"

**Cause:** Incorrect or placeholder contract address

**Solution:** 
- Verify `NEXT_PUBLIC_CATI_TOKEN_ADDRESS` is set correctly
- Restart dev server after changing `.env.local`
- Clear browser cache

### Issue: "No Ethereum provider found"

**Cause:** MetaMask not installed or not connected

**Solution:**
- Install MetaMask extension
- Connect MetaMask to your site
- Refresh page

### Issue: Wrong network

**Cause:** MetaMask connected to wrong network

**Solution:**
- Switch to BSC Mainnet in MetaMask
- Network ID: 56
- RPC: https://bsc-dataseed.binance.org/
- Chain ID: 56

## Security Checklist

- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] Platform wallet private key is NEVER committed to git
- [ ] Platform wallet private key is stored securely
- [ ] Different wallets for testnet and mainnet
- [ ] Platform wallet has enough BNB for gas fees
- [ ] Platform wallet has enough CATI for withdrawals

## Network Configuration

### BSC Mainnet
- **Network Name:** Binance Smart Chain
- **RPC URL:** https://bsc-dataseed.binance.org/
- **Chain ID:** 56
- **Symbol:** BNB
- **Block Explorer:** https://bscscan.com

### BSC Testnet (for testing)
- **Network Name:** BSC Testnet
- **RPC URL:** https://data-seed-prebsc-1-s1.binance.org:8545/
- **Chain ID:** 97
- **Symbol:** BNB
- **Block Explorer:** https://testnet.bscscan.com
- **Faucet:** https://testnet.bnbchain.org/faucet-smart

## Next Steps

1. ✅ Contract address updated
2. ✅ Error handling improved
3. [ ] Set up your `.env.local` file
4. [ ] Create platform wallet
5. [ ] Fund platform wallet with BNB (for gas)
6. [ ] Fund platform wallet with CATI (for withdrawals)
7. [ ] Test deposit flow
8. [ ] Test withdrawal flow

## Support

If you encounter issues:
1. Check console for errors
2. Verify environment variables
3. Check BSCScan for transaction details
4. Ensure MetaMask is on correct network
