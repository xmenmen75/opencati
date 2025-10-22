import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Sparkles, Star, Zap, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackOpeningAnimationProps {
  isOpening: boolean;
  gachaResult?: any;
  showResult: boolean;
  className?: string;
}

export const PackOpeningAnimation: React.FC<PackOpeningAnimationProps> = ({
  isOpening,
  gachaResult,
  showResult,
  className
}) => {
  // Show party popper animation for SS rank cards
  const shouldShowSSCelebration = showResult && gachaResult && gachaResult !== "unfortunate" && gachaResult.rank === "SS";
  
  // Show sparkle effects for S rank cards
  const shouldShowSCelebration = showResult && gachaResult && gachaResult !== "unfortunate" && gachaResult.rank === "S";
  
  // Show star effects for AA rank cards
  const shouldShowAACelebration = showResult && gachaResult && gachaResult !== "unfortunate" && gachaResult.rank === "AA";
  
  // Show lightning effects for A rank (common) cards
  const shouldShowACelebration = showResult && gachaResult && gachaResult !== "unfortunate" && gachaResult.rank === "A";
  
  // SS Rank special effects
  const showLightning = shouldShowSSCelebration;
  const showLightBeam = shouldShowSSCelebration;
  const showFireworks = shouldShowSSCelebration;
  
  // S Rank special effects
  const showSpiral = shouldShowSCelebration;
  const showAurora = shouldShowSCelebration;
  
  // AA Rank special effects
  const showFlame = shouldShowAACelebration;
  const showSparkles = shouldShowAACelebration;
  
  // State to control light beam duration
  const [showLightBeamVisible, setShowLightBeamVisible] = useState(false);
  
  // Control light beam visibility with timeout
  useEffect(() => {
    if (showLightBeam) {
      setShowLightBeamVisible(true);
      const timer = setTimeout(() => {
        setShowLightBeamVisible(false);
      }, 3000); // 3 seconds
      
      return () => clearTimeout(timer);
    } else {
      setShowLightBeamVisible(false);
    }
  }, [showLightBeam]);
  
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {/* Opening Lightning Effects - Show immediately when pack opening starts */}
        {isOpening && !showResult && (
          <>
            {/* Top Lightning */}
            <motion.div
              key="opening-lightning-top"
              initial={{ opacity: 0, y: 50, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: [50, -100, -150, -200],
                scale: [0, 1.5, 2, 2.5],
                rotate: [0, -15, -30, -45]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-15 pointer-events-none"
            >
              <Zap className="w-16 h-16 text-yellow-300 fill-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]" />
            </motion.div>

            {/* Right Lightning */}
            <motion.div
              key="opening-lightning-right"
              initial={{ opacity: 0, x: -50, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                x: [-50, 100, 150, 200],
                scale: [0, 1.5, 2, 2.5],
                rotate: [0, 30, 60, 90]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: 0, delay: 0.2 }}
              className="absolute top-1/2 right-0 -translate-y-1/2 z-15 pointer-events-none"
            >
              <Zap className="w-16 h-16 text-blue-300 fill-blue-300 drop-shadow-[0_0_15px_rgba(147,197,253,0.8)]" />
            </motion.div>

            {/* Bottom Lightning */}
            <motion.div
              key="opening-lightning-bottom"
              initial={{ opacity: 0, y: -50, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: [-50, 100, 150, 200],
                scale: [0, 1.5, 2, 2.5],
                rotate: [0, 15, 30, 45]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: 0, delay: 0.4 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 z-15 pointer-events-none"
            >
              <Zap className="w-16 h-16 text-purple-300 fill-purple-300 drop-shadow-[0_0_15px_rgba(216,180,254,0.8)]" />
            </motion.div>

            {/* Left Lightning */}
            <motion.div
              key="opening-lightning-left"
              initial={{ opacity: 0, x: 50, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                x: [50, -100, -150, -200],
                scale: [0, 1.5, 2, 2.5],
                rotate: [0, -30, -60, -90]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: 0, delay: 0.3 }}
              className="absolute top-1/2 left-0 -translate-y-1/2 z-15 pointer-events-none"
            >
              <Zap className="w-16 h-16 text-pink-300 fill-pink-300 drop-shadow-[0_0_15px_rgba(249,168,212,0.8)]" />
            </motion.div>

            {/* Top-Right Lightning */}
            <motion.div
              key="opening-lightning-top-right"
              initial={{ opacity: 0, x: -30, y: 30, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                x: [-30, 80, 120, 160],
                y: [30, -80, -120, -160],
                scale: [0, 1.3, 1.8, 2.2],
                rotate: [0, 45, 90, 135]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: 0, delay: 0.1 }}
              className="absolute top-0 right-0 z-15 pointer-events-none"
            >
              <Zap className="w-12 h-12 text-orange-300 fill-orange-300 drop-shadow-[0_0_15px_rgba(253,186,116,0.8)]" />
            </motion.div>

            {/* Top-Left Lightning */}
            <motion.div
              key="opening-lightning-top-left"
              initial={{ opacity: 0, x: 30, y: 30, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                x: [30, -80, -120, -160],
                y: [30, -80, -120, -160],
                scale: [0, 1.3, 1.8, 2.2],
                rotate: [0, -45, -90, -135]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: 0, delay: 0.15 }}
              className="absolute top-0 left-0 z-15 pointer-events-none"
            >
              <Zap className="w-12 h-12 text-green-300 fill-green-300 drop-shadow-[0_0_15px_rgba(134,239,172,0.8)]" />
            </motion.div>

            {/* Bottom-Right Lightning */}
            <motion.div
              key="opening-lightning-bottom-right"
              initial={{ opacity: 0, x: -30, y: -30, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                x: [-30, 80, 120, 160],
                y: [-30, 80, 120, 160],
                scale: [0, 1.3, 1.8, 2.2],
                rotate: [0, -45, -90, -135]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: 0, delay: 0.25 }}
              className="absolute bottom-0 right-0 z-15 pointer-events-none"
            >
              <Zap className="w-12 h-12 text-cyan-300 fill-cyan-300 drop-shadow-[0_0_15px_rgba(165,243,252,0.8)]" />
            </motion.div>

            {/* Bottom-Left Lightning */}
            <motion.div
              key="opening-lightning-bottom-left"
              initial={{ opacity: 0, x: 30, y: -30, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                x: [30, -80, -120, -160],
                y: [-30, 80, 120, 160],
                scale: [0, 1.3, 1.8, 2.2],
                rotate: [0, 45, 90, 135]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: 0, delay: 0.35 }}
              className="absolute bottom-0 left-0 z-15 pointer-events-none"
            >
              <Zap className="w-12 h-12 text-red-300 fill-red-300 drop-shadow-[0_0_15px_rgba(252,165,165,0.8)]" />
            </motion.div>
          </>
        )}

        {/* SS Card Cracker Animation */}
        {shouldShowSSCelebration && (
          <>
            {/* Generate 20 crackers in random positions */}
            {Array.from({ length: 20 }).map((_, i) => {
              const randomX = Math.random() * 200 - 100;
              const randomY = Math.random() * 200 - 100;
              const randomRotate = Math.random() * 360;
              const randomDelay = Math.random() * 0.3;
              const randomDuration = 1 + Math.random() * 0.5;
              const colors = ['text-yellow-400', 'text-pink-500', 'text-purple-500', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-orange-500'];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              
              return (
                <motion.div
                  key={`ss-cracker-${i}`}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: 0,
                    y: 0,
                    rotate: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1.2, 0.5],
                    x: [0, randomX * 3, randomX * 5, randomX * 7],
                    y: [0, randomY * 2, randomY * 4, randomY * 6],
                    rotate: [0, randomRotate, randomRotate * 2, randomRotate * 3]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: randomDuration, 
                    ease: "easeOut",
                    delay: randomDelay
                  }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none`}
                >
                  <PartyPopper className={`w-8 h-8 ${randomColor} fill-current drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`} />
                </motion.div>
              );
            })}
            
            {/* Additional confetti particles */}
            {Array.from({ length: 30 }).map((_, i) => {
              const randomX = Math.random() * 300 - 150;
              const randomY = Math.random() * 300 - 150;
              const randomDelay = Math.random() * 0.5;
              const randomDuration = 1.5 + Math.random() * 0.5;
              const colors = ['bg-yellow-400', 'bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500'];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              const randomSize = 4 + Math.floor(Math.random() * 8);
              
              return (
                <motion.div
                  key={`ss-confetti-${i}`}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1, 1, 0],
                    x: [0, randomX, randomX * 1.5],
                    y: [0, randomY, randomY * 2],
                    rotate: [0, 360, 720]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: randomDuration, 
                    ease: "easeOut",
                    delay: randomDelay
                  }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none ${randomColor} rounded-full`}
                  style={{ width: randomSize, height: randomSize }}
                />
              );
            })}
          </>
        )}

        {/* Sparkle Animation for S Rank Cards */}
        {shouldShowSCelebration && (
          <>
            {Array.from({ length: 12 }).map((_, i) => {
              const randomX = (Math.random() - 0.5) * 300;
              const randomY = (Math.random() - 0.5) * 300;
              const randomDelay = Math.random() * 0.5;
              const randomDuration = 1.5 + Math.random() * 0.5;
              
              return (
                <motion.div
                  key={`s-sparkle-${i}`}
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.2, 1, 0.8],
                    x: [0, randomX, randomX * 1.2],
                    y: [0, randomY, randomY * 1.2],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: randomDuration,
                    ease: "easeOut",
                    delay: randomDelay
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                >
                  <Sparkles className="w-6 h-6 text-purple-400 fill-current drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                </motion.div>
              );
            })}
          </>
        )}

        {/* Spiral Effect (S Rank) */}
        {showSpiral && (
          <motion.div
            key="s-spiral-effect"
            initial={{ opacity: 0, rotate: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              rotate: [0, 720],
              scale: [0, 1.5, 2],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{
              width: '400px',
              height: '400px',
              background: 'conic-gradient(from 0deg, transparent, rgba(138, 43, 226, 0.6), transparent)',
              borderRadius: '50%',
              filter: 'blur(5px)',
            }}
          />
        )}

        {/* Aurora Effect (S Rank) */}
        {showAurora && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`aurora-${i}`}
                initial={{ opacity: 0, x: -200 }}
                animate={{ 
                  opacity: [0, 0.6, 0.4, 0.6, 0.4],
                  x: [-200, 200, -200, 200, -200],
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 4, 
                  ease: "easeInOut",
                  delay: i * 0.3,
                  repeat: 0
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                style={{
                  width: '100%',
                  height: '100vh',
                  background: `linear-gradient(90deg, transparent, rgba(${i === 0 ? '0, 255, 127' : i === 1 ? '0, 191, 255' : '138, 43, 226'}, 0.4), transparent)`,
                  filter: 'blur(30px)',
                  top: `${i * 30}%`,
                }}
              />
            ))}
          </>
        )}

        {/* Star Animation for AA Rank Cards */}
        {shouldShowAACelebration && (
          <>
            {Array.from({ length: 8 }).map((_, i) => {
              const randomX = (Math.random() - 0.5) * 250;
              const randomY = (Math.random() - 0.5) * 250;
              const randomDelay = Math.random() * 0.4;
              const randomDuration = 1.2 + Math.random() * 0.3;
              
              return (
                <motion.div
                  key={`aa-star-${i}`}
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0.8, 0],
                    scale: [0, 1, 1.1, 0.7],
                    x: [0, randomX],
                    y: [0, randomY],
                    rotate: [0, 270]
                  }}
                  transition={{ 
                    duration: randomDuration,
                    ease: "easeOut",
                    delay: randomDelay
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
                >
                  <Star className="w-8 h-8 text-yellow-400 fill-current drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                </motion.div>
              );
            })}
          </>
        )}

        {/* Flame Effect (AA Rank) */}
        {showFlame && Array.from({ length: 20 }).map((_, i) => {
          const randomX = (Math.random() - 0.5) * 200;
          const randomDelay = Math.random() * 0.5;
          const randomDuration = 1 + Math.random() * 0.5;
          
          return (
            <motion.div
              key={`aa-flame-${i}`}
              initial={{ opacity: 0, scale: 0, y: 200 }}
              animate={{ 
                opacity: [0, 1, 0.8, 0],
                scale: [0.5, 1.5, 1, 0.5],
                y: [200, 50, 0, -50],
                x: [randomX, randomX * 0.8, randomX * 0.5, randomX * 0.2],
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: randomDuration, 
                ease: "easeOut",
                delay: randomDelay
              }}
              className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 z-40 pointer-events-none"
            >
              <Flame className="w-10 h-10 text-orange-500 fill-orange-500 drop-shadow-[0_0_20px_rgba(255,165,0,1)]" />
            </motion.div>
          );
        })}

        {/* Sparkles Effect (AA Rank) */}
        {showSparkles && Array.from({ length: 40 }).map((_, i) => {
          const randomX = (Math.random() - 0.5) * 300;
          const randomY = (Math.random() - 0.5) * 300;
          const randomDelay = Math.random() * 1;
          const randomSize = 3 + Math.floor(Math.random() * 8);
          
          return (
            <motion.div
              key={`aa-sparkle-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0.8, 1, 0],
                scale: [0, 1, 1.2, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                ease: "easeInOut",
                delay: randomDelay,
                repeat: 1,
                repeatType: "reverse"
              }}
              className="absolute top-1/2 left-1/2 z-40 pointer-events-none"
              style={{
                transform: `translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY}px))`,
              }}
            >
              <div 
                className="bg-yellow-300 rounded-full"
                style={{
                  width: `${randomSize}px`,
                  height: `${randomSize}px`,
                  boxShadow: '0 0 15px #fff, 0 0 25px #ffff00, 0 0 35px #ffff00',
                }}
              />
            </motion.div>
          );
        })}

        {/* Lightning Effect (SS Rank) */}
        {showLightning && (
          <>
            {Array.from({ length: 5 }).map((_, i) => {
              const randomX = (Math.random() - 0.5) * 400;
              const randomDelay = Math.random() * 0.3;
              
              return (
                <motion.div
                  key={`ss-lightning-${i}`}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0.8, 1, 0],
                    scaleY: [0, 1, 0.9, 1, 0.8],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    ease: "easeOut",
                    delay: randomDelay
                  }}
                  className="absolute top-0 z-40 pointer-events-none"
                  style={{ 
                    left: `calc(50% + ${randomX}px)`,
                    width: '4px',
                    height: '100vh',
                    background: 'linear-gradient(to bottom, #fff, #87ceeb, transparent)',
                    boxShadow: '0 0 20px #87ceeb, 0 0 40px #4682b4',
                    transform: 'translateX(-50%)',
                  }}
                />
              );
            })}
          </>
        )}

        {/* Light Beam Effect (SS Rank) */}
        {showLightBeamVisible && (
          <motion.div
            key="ss-light-beam"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0.6, 0.8, 0.6],
              scaleY: [0, 1.2, 1, 1.1, 1],
            }}
            exit={{ opacity: 0, scaleY: 0, transition: { duration: 0.5, ease: "easeOut" } }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{
              width: '300px',
              height: '200vh',
              background: 'linear-gradient(to top, transparent, rgba(255, 215, 0, 0.6) 30%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 215, 0, 0.6) 70%, transparent)',
              boxShadow: '0 0 100px rgba(255, 215, 0, 0.8), inset 0 0 100px rgba(255, 255, 255, 0.5)',
              filter: 'blur(2px)',
            }}
          />
        )}

        {/* Fireworks Effect (SS Rank) */}
        {showFireworks && Array.from({ length: 15 }).map((_, i) => {
          const randomX = (Math.random() - 0.5) * 600;
          const randomY = (Math.random() - 0.5) * 400;
          const randomDelay = Math.random() * 2;
          const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <motion.div
              key={`ss-firework-${i}`}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ 
                opacity: [0, 1, 0.8, 0],
                scale: [0, 1, 1.5, 2],
                x: randomX,
                y: randomY,
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                ease: "easeOut",
                delay: randomDelay
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: randomColor,
                  boxShadow: `0 0 20px ${randomColor}, 0 0 40px ${randomColor}`,
                }}
              />
            </motion.div>
          );
        })}


      </AnimatePresence>
    </div>
  );
};