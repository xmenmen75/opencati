<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js 15 project with the following technology stack:

## Tech Stack
- **Next.js 15** with TypeScript and App Router
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Prisma** ORM with MySQL database
- **React 18** with server and client components

## Database Schema
This project uses a comprehensive database schema for a blockchain-based card trading/gaming platform:

### Core Models:
- **User**: Wallet-based user system with CATI token balance
- **Card**: Trading cards with rarity ranks (A, AA, S, SS) and pool share percentages
- **Season**: Time-bound events with bid pools and rewards
- **UserCard**: Junction table tracking card ownership and rewards per season
- **SeasonReward**: Calculated rewards distribution for users
- **CatiTransaction**: Complete transaction history for CATI tokens
- **Withdrawal/Deposit**: On-chain transaction management

## Project Structure
- Use `src/` directory structure with App Router
- Database access through `src/lib/prisma.ts`
- Shadcn/ui components in `src/components/ui/`
- Custom components in `src/components/`
- Type definitions should leverage Prisma generated types

## Coding Guidelines
- Use TypeScript with strict type checking
- Implement proper error handling for database operations
- Use React Server Components where possible for better performance
- Follow Next.js 15 best practices for data fetching and caching
- Implement proper loading and error states
- Use Tailwind CSS for consistent styling
- Leverage Shadcn/ui components for common UI patterns

## Database Operations
- Always use Prisma client for database operations
- Implement proper transaction handling for complex operations
- Use BigInt for large numbers (CATI balances, IDs)
- Handle wallet address validation properly
- Consider pagination for large data sets

## Blockchain Integration
- This app deals with CATI tokens and wallet integration
- Consider gas fees and transaction confirmation states
- Implement proper on-chain/off-chain transaction tracking
- Handle wallet connection and user authentication
