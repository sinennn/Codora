// ============================================
// CODORA ANIMATION PRESETS
// ============================================

import type { Variants } from 'framer-motion';

// Page transitions
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

// Stagger children animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Button press animation
export const buttonTap = {
  whileTap: { scale: 0.95 },
  whileHover: { scale: 1.02 },
};

// Card hover animation
export const cardHover = {
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.98 },
};

// Success animation (correct answer)
export const successPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 },
  },
};

// Error animation (wrong answer)
export const errorShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

// XP count up animation config
export const xpCountUp = {
  duration: 1000,
  steps: 20,
};

// Level up celebration
export const levelUpCelebration: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

// Streak fire animation
export const fireAnimation = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, -5, 5, 0],
  },
  transition: {
    duration: 0.5,
    repeat: Infinity,
    repeatDelay: 2,
  },
};

// Progress bar fill
export const progressFill = (progress: number) => ({
  initial: { width: 0 },
  animate: { width: `${progress}%` },
  transition: { duration: 1, ease: 'easeOut' },
});

// Fade in from direction
export const fadeInFrom = (direction: 'left' | 'right' | 'up' | 'down', distance = 20) => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const value = direction === 'left' || direction === 'up' ? -distance : distance;
  
  return {
    initial: { opacity: 0, [axis]: value },
    animate: { opacity: 1, [axis]: 0 },
    transition: { duration: 0.3 },
  };
};

// Haptic feedback simulation (visual)
export const hapticFeedback = {
  correct: {
    backgroundColor: ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0)'],
    transition: { duration: 0.3 },
  },
  incorrect: {
    backgroundColor: ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0)'],
    transition: { duration: 0.3 },
  },
};
