export interface Card {
  id: string;
  rank: CardRank;
  name: string;
  image?: string;
}

export interface OwnedCard {
  id: string;
  cardId: string;
  rank: CardRank;
  name: string;
  image?: string;
  poolSharePercentage: string;
  rarityColor: string;
  designer: string;
  catiSpent: string;
  catiReward: string;
  acquiredAt: string;
  season: {
    id: string;
    name: string;
    slogan: string;
  };
}

export const CardRank = {
  A: 'A',
  AA: 'AA',
  S: 'S',
  SS: 'SS'
} as const;

export type CardRank = typeof CardRank[keyof typeof CardRank];

export interface CardProbability {
  rank: CardRank;
  probability: number;
  color: string;
  glowColor: string;
}

export interface PackOpeningResult {
  card: Card;
}

export interface PackOpenResponse {
  success: boolean;
  card?: {
    id: string;
    rank: string;
    name: string;
    imageUrl: string;
    rarityColor: string;
    designer: string;
    poolSharePercentage: string;
    catiSpent: string;
    catiReward: string;
    acquiredAt: string;
    season: {
      id: string;
      name: string;
      slogan: string;
    };
  };
  failureReason?: string;
  message?: string;
  newBalance: string;
  season?: {
    id: string;
    name: string;
    slogan: string;
  };
}