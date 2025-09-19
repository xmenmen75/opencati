# SIWE Authentication Setup

This project now includes Sign-In With Ethereum (SIWE) authentication. Follow these steps to set up the development environment:

## Environment Setup

1. Copy the environment variables:
```bash
cp .env.example .env
```

2. Update your `.env` file with:
   - Your actual database URL
   - A secure JWT secret (at least 32 characters)
   - Your domain (localhost:3000 for development)

## Database Setup

The authentication system requires additional database tables. Run:

```bash
npm run db:push
```

This will create the following new tables:
- `auth_nonces` - Stores one-time nonces for SIWE authentication
- `auth_sessions` - Manages user sessions and JWT tokens

## How SIWE Authentication Works

1. **Connect Wallet**: User connects their MetaMask wallet
2. **Request Nonce**: Client requests a unique nonce from the server
3. **Sign Message**: User signs a SIWE message containing the nonce
4. **Verify Signature**: Server verifies the signature and creates a session
5. **Authenticated Access**: User can now access protected features

## Security Features

- ✅ Cryptographically secure nonces
- ✅ One-time use nonces with expiration
- ✅ JWT-based sessions with revocation support
- ✅ Domain verification to prevent phishing
- ✅ Short-lived tokens (2 hours)
- ✅ Automatic session cleanup

## API Endpoints

- `GET /api/auth/nonce?address={wallet}` - Get authentication nonce
- `POST /api/auth/verify` - Verify SIWE signature and create session
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Logout and revoke session

## User Experience

Users will now see an additional step after connecting their wallet:
1. Connect wallet to BSC Testnet
2. Sign authentication message in MetaMask
3. Access the game with verified wallet ownership

New users automatically receive 10,000 CATI tokens upon first authentication.
