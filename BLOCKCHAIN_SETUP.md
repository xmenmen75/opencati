# Blockchain Configuration for CATI Token Integration

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# CATI Token Contract Address on BSC Testnet
NEXT_PUBLIC_CATI_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890

# Platform Wallet Configuration (holds CATI for withdrawals)
PLATFORM_WALLET_ADDRESS=0x9876543210987654321098765432109876543210
PLATFORM_WALLET_PRIVATE_KEY=your-platform-wallet-private-key-here

# BSC Testnet RPC URL
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

## Setup Instructions

### 1. Deploy CATI Token Contract

You need a CATI token contract on BSC Testnet. You can:

- Deploy your own ERC-20 token contract
- Use an existing test token
- Create a simple ERC-20 contract with these basic functions:
  - `transfer(address to, uint256 amount)`
  - `balanceOf(address account)`
  - `approve(address spender, uint256 amount)`

### 2. Platform Wallet Setup

1. Create a dedicated wallet for the platform
2. Fund it with some BNB for gas fees
3. Transfer CATI tokens to this wallet for user withdrawals
4. Keep the private key secure (use environment variables)

### 3. User Flow

#### For Deposits:
1. User sends CATI tokens to the platform wallet
2. User copies the transaction hash
3. User provides tx hash in the deposit verification UI
4. System verifies the transaction on-chain
5. CATI balance is added to user's game account

#### For Withdrawals:
1. User requests withdrawal from game balance
2. System deducts CATI from user's account
3. System sends CATI tokens from platform wallet to user's wallet
4. Transaction is confirmed on-chain

### 4. Security Considerations

- Store private keys securely
- Monitor platform wallet balance
- Implement rate limiting for withdrawals
- Add transaction fee considerations
- Consider using a multisig wallet for larger amounts

### 5. Testing

1. Get some testnet BNB from BSC faucet
2. Deploy or get a test CATI token
3. Send test tokens between wallets
4. Verify the deposit/withdrawal flow

## Sample CATI Token Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CATIToken is ERC20 {
    constructor() ERC20("CATI Token", "CATI") {
        _mint(msg.sender, 1000000 * 10**decimals()); // 1M tokens
    }
}
```

## Important Notes

- This implementation assumes you have a CATI token contract
- The platform wallet must have sufficient CATI tokens for withdrawals
- All transactions are on BSC Testnet (change for mainnet)
- Gas fees are paid from the platform wallet
- Consider implementing transaction monitoring and alerts
