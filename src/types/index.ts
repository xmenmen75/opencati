import type { User, Card, Season, UserCard, SeasonReward, CatiTransaction, Withdrawal, Deposit, UsdDeposit, UsdTransaction } from '@prisma/client'

// Enhanced types with relations
export type UserWithRelations = User & {
  userCards: UserCard[]
  seasonRewards: SeasonReward[]
  catiTransactions: CatiTransaction[]
  usdTransactions: UsdTransaction[]
  withdrawals: Withdrawal[]
  deposits: Deposit[]
  usdDeposits: UsdDeposit[]
}

export type CardWithUserCards = Card & {
  userCards: UserCard[]
}

export type SeasonWithRelations = Season & {
  userCards: UserCard[]
  seasonRewards: SeasonReward[]
}

export type UserCardWithRelations = UserCard & {
  user: User
  card: Card
  season: Season
}

// Transaction types
export type TransactionType = 'SPEND_DRAW' | 'SEASON_REWARD' | 'WITHDRAW' | 'DEPOSIT'
export type TransactionSource = 'OFFCHAIN' | 'ONCHAIN'

// USD Transaction types
export type UsdTransactionType = 'DEPOSIT' | 'SPEND_DRAW'

// Status types
export type SeasonStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'DISTRIBUTED'
export type WithdrawalStatus = 'PENDING' | 'COMPLETED' | 'FAILED'
export type DepositStatus = 'PENDING' | 'COMPLETED' | 'FAILED'
export type UsdDepositStatus = 'PENDING' | 'COMPLETED' | 'FAILED'
export type RewardStatus = 'PENDING' | 'DISTRIBUTED'

// Card ranks
export type CardRank = 'A' | 'AA' | 'S' | 'SS'

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Wallet integration types
export interface WalletInfo {
  address: string
  balance?: string
  chainId?: number
}

// Season statistics
export interface SeasonStats {
  totalParticipants: number
  totalBidPool: bigint
  totalAdditionalPool: bigint
  totalRewardsDistributed: bigint
  averageReward: number
}

// User dashboard data
export interface UserDashboard {
  user: UserWithRelations
  totalCardsOwned: number
  totalRewardsEarned: bigint
  activeSeasons: Season[]
  recentTransactions: CatiTransaction[]
}
