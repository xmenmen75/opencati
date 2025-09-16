import type { Card, CardProbability, PackOpeningResult } from '@/types/card';
import { CardRank } from '@/types/card';

const CARD_PROBABILITIES: CardProbability[] = [
  { rank: CardRank.A, probability: 0.30000, color: 'bg-blue-500', glowColor: 'shadow-blue-500/50' },
  { rank: CardRank.AA, probability: 0.06000, color: 'bg-purple-500', glowColor: 'shadow-purple-500/50' },
  { rank: CardRank.S, probability: 0.02000, color: 'bg-yellow-500', glowColor: 'shadow-yellow-500/50' },
  { rank: CardRank.SS, probability: 0.00100, color: 'bg-red-500', glowColor: 'shadow-red-500/50' },
];

export class CardService {
  private static generateCardId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateMockCardName(rank: CardRank): string {
    const names = {
      [CardRank.A]: [
        'Fire Dragon', 'Water Spirit', 'Earth Golem', 'Wind Eagle', 'Storm Wolf', 
        'Crystal Mage', 'Iron Knight', 'Forest Guardian', 'Lightning Beast', 'Ice Warrior'
      ],
      [CardRank.AA]: [
        'Lightning Phoenix', 'Ice Queen', 'Shadow Wolf', 'Golden Knight', 'Flame Emperor',
        'Ocean Lord', 'Mountain King', 'Sky Rider', 'Dark Assassin', 'Light Paladin'
      ],
      [CardRank.S]: [
        'Ancient Titan', 'Mystic Oracle', 'Void Reaper', 'Crystal Guardian', 'Chaos Dragon',
        'Time Wizard', 'Soul Hunter', 'Divine Beast', 'Ethereal Spirit', 'Cosmic Warrior'
      ],
      [CardRank.SS]: [
        'Legendary Beast', 'Divine Avatar', 'Cosmic Entity', 'Ultimate Warrior', 'Eternal Dragon',
        'Primordial Force', 'Infinity Guardian', 'Omnipotent Sage', 'Reality Shaper', 'Universe Creator'
      ]
    };
    
    const rankNames = names[rank];
    return rankNames[Math.floor(Math.random() * rankNames.length)];
  }

  static generateRandomCard(): Card {
    // Total probability sum: 0.3 + 0.06 + 0.02 + 0.001 = 0.381
    const totalProbability = 0.381;
    const random = Math.random() * totalProbability;
    
    let rank: CardRank;
    
    // Map random number to card rank using cumulative ranges
    if (random <= 0.3) {
      rank = CardRank.A;
    } else if (random <= 0.36) { // 0.3 + 0.06
      rank = CardRank.AA;
    } else if (random <= 0.38) { // 0.36 + 0.02
      rank = CardRank.S;
    } else { // 0.38 to 0.381
      rank = CardRank.SS;
    }
    
    return {
      id: this.generateCardId(),
      rank,
      name: this.generateMockCardName(rank),
    };
  }

  static generateMockOwnedCards(cardIds: string[]): Card[] {
    return cardIds.map(id => {
      // Generate weighted random rank based on realistic probabilities
      const random = Math.random();
      let rank: CardRank;
      
      if (random <= 0.70) {
        rank = CardRank.A; // 70% chance
      } else if (random <= 0.90) {
        rank = CardRank.AA; // 20% chance
      } else if (random <= 0.98) {
        rank = CardRank.S; // 8% chance
      } else {
        rank = CardRank.SS; // 2% chance
      }
      
      return {
        id,
        rank,
        name: this.generateMockCardName(rank),
      };
    });
  }

  static openPack(): PackOpeningResult {
    const card = this.generateRandomCard();
    return {
      card,
    };
  }

  static getCardProbability(rank: CardRank): CardProbability | undefined {
    return CARD_PROBABILITIES.find(p => p.rank === rank);
  }

  static getAllProbabilities(): CardProbability[] {
    return CARD_PROBABILITIES;
  }
}