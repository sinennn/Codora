import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface XPAnimationProps {
  xp: number;
  isVisible: boolean;
  onComplete?: () => void;
}

export function XPAnimation({ xp, isVisible, onComplete }: XPAnimationProps) {
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    if (isVisible && xp > 0) {
      // Animate counting up
      const duration = 1000;
      const steps = 20;
      const increment = xp / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= xp) {
          setDisplayXP(xp);
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 500);
        } else {
          setDisplayXP(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [isVisible, xp, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* XP Display */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute w-40 h-40 bg-orange-500/30 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* XP text */}
            <motion.div
              className="relative text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3, repeat: 3 }}
            >
              +{displayXP}
            </motion.div>

            <motion.p
              className="text-xl font-bold text-orange-400 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              XP Earned!
            </motion.p>

            {/* Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-orange-400 rounded-full"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * Math.PI) / 4) * 100,
                  y: Math.sin((i * Math.PI) / 4) * 100,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default XPAnimation;
