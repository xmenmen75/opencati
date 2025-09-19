import type { Card } from '@/types/card';
import { cn } from '@/lib/utils';
import { CardService } from '@/app/services/cardService';

interface CardDisplayProps {
  card: Card;
  className?: string;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({ 
  card, 
  className 
}) => {
  const probability = CardService.getCardProbability(card.rank);
  
  return (
    <div
      className={cn(
        "relative w-48 h-64 rounded-xl overflow-hidden",
        "border-2 border-white/20 backdrop-blur-sm",
        "animate-pulse duration-500",
        probability?.color,
        probability?.glowColor,
        "shadow-2xl transform transition-all duration-300 hover:scale-105",
        className
      )}
    >
      {/* Card Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10" />
      
      {/* Rank Badge */}
      <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-md font-bold text-sm">
        {card.rank}
      </div>
      
      {/* Card Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-center">
        {/* Card Rank Display */}
        <div className="w-24 h-24 bg-white/20 rounded-full mb-4 flex items-center justify-center border-2 border-white/30">
          <span className="text-4xl font-bold text-white">{card.rank}</span>
        </div>
        
        {/* Probability */}
        <p className="text-white/80 text-sm">
          {probability ? `${(probability.probability * 100).toFixed(3)}% chance` : 'Unknown rarity'}
        </p>
      </div>
      
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-slide-shine" />
    </div>
  );
};