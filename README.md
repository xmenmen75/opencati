# OpenCATI

## Tech Stack

- **Next.js 15** with TypeScript and App Router
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Prisma** ORM with MySQL database
- **React 18** with server and client components

## Database Schema

### Core Models:
- **User**: Wallet addresses, nicknames, CATI balances
- **Card**: Trading cards with metadata and rarity information
- **Season**: Event periods with pools and reward mechanisms
- **UserCard**: Card ownership tracking with rewards per season
- **SeasonReward**: Calculated reward distributions
- **CatiTransaction**: Complete transaction history
- **Withdrawal/Deposit**: Blockchain transaction management

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd opencati
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your database connection string:
```env
DATABASE_URL="mysql://username:password@localhost:3306/opencati_db"
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   └── ...             # Custom components
├── lib/                # Utilities and configurations
│   ├── prisma.ts       # Prisma client instance
│   └── utils.ts        # Utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── styles/             # Global styles
prisma/
├── schema.prisma       # Database schema
└── migrations/         # Database migrations
```
