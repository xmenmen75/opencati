import type { CardProbability } from '@/types/card';
import { CardRank } from '@/types/card';
import { prisma } from '@/lib/prisma';

export class CardService {
  // static async getCardProbabilities(): Promise<CardProbability[]> {
  //   try {
  //     const cards = await prisma.card.findMany({
  //       select: {
  //         rank: true
  //       },
  //     });

  //     // Group by rank and calculate total probabilities
  //     const probabilitiesByRank = cards.reduce((acc, card) => {
  //       const rank = card.rank as CardRank;
  //       const probability = Number(card.poolSharePercentage) / 100; // Convert percentage to decimal
        
  //       if (!acc[rank]) {
  //         acc[rank] = {
  //           rank,
  //           probability: 0,
  //           color: this.getColorByRank(rank),
  //           glowColor: this.getGlowColorByRank(rank),
  //         };
  //       }
        
  //       acc[rank].probability += probability;
  //       return acc;
  //     }, {} as Record<CardRank, CardProbability>);

  //     return Object.values(probabilitiesByRank);
  //   } catch (error) {
  //     console.error('Error fetching card probabilities:', error);
  //     // Fallback to default probabilities
  //     return this.getDefaultProbabilities();
  //   }
  // }

  static getCardProbability(rank: CardRank): CardProbability | undefined {
    // This is now async, so you should use getCardProbabilities() instead
    // Keeping this for backward compatibility with fallback
    const defaultProbabilities = this.getDefaultProbabilities();
    return defaultProbabilities.find(p => p.rank === rank);
  }

  static getAllProbabilities(): CardProbability[] {
    // This is now async, so you should use getCardProbabilities() instead
    // Keeping this for backward compatibility with fallback
    return this.getDefaultProbabilities();
  }

  private static getDefaultProbabilities(): CardProbability[] {
    return [
      { rank: CardRank.A, probability: 0.60, color: 'bg-blue-500', glowColor: 'shadow-blue-500/50' },
      { rank: CardRank.AA, probability: 0.25, color: 'bg-purple-500', glowColor: 'shadow-purple-500/50' },
      { rank: CardRank.S, probability: 0.13, color: 'bg-yellow-500', glowColor: 'shadow-yellow-500/50' },
      { rank: CardRank.SS, probability: 0.02, color: 'bg-red-500', glowColor: 'shadow-red-500/50' },
    ];
  }

  private static getColorByRank(rank: CardRank): string {
    switch (rank) {
      case CardRank.A:
        return 'bg-blue-500';
      case CardRank.AA:
        return 'bg-purple-500';
      case CardRank.S:
        return 'bg-yellow-500';
      case CardRank.SS:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  private static getGlowColorByRank(rank: CardRank): string {
    switch (rank) {
      case CardRank.A:
        return 'shadow-blue-500/50';
      case CardRank.AA:
        return 'shadow-purple-500/50';
      case CardRank.S:
        return 'shadow-yellow-500/50';
      case CardRank.SS:
        return 'shadow-red-500/50';
      default:
        return 'shadow-gray-500/50';
    }
  }
}