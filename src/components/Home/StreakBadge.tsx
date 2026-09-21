import { motion } from 'framer-motion';

interface StreakBadgeProps {
  streak: number;
  isActive?: boolean;  // Did user practice today?
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, isActive = true, size = 'md' }: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm gap-1',
    md: 'px-3 py-1.5 text-base gap-1.5',
    lg: 'px-4 py-2 text-lg gap-2',
  };

  const fireSize = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <motion.div
      className={`
        inline-flex items-center rounded-full font-bold
        ${sizeClasses[size]}
        ${isActive 
          ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30' 
          : 'bg-gray-800 text-gray-500 border border-gray-700'
        }
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.span
        className={fireSize[size]}
        animate={isActive ? { 
          scale: [1, 1.2, 1],
          rotate: [0, -5, 5, 0]
        } : {}}
        transition={{ 
          duration: 0.5, 
          repeat: isActive ? Infinity : 0, 
          repeatDelay: 2 
        }}
      >
        {isActive ? '🔥' : '❄️'}
      </motion.span>
      <span>{streak}</span>
      <span className="text-gray-500 font-normal">
        {streak === 1 ? 'day' : 'days'}
      </span>
    </motion.div>
  );
}

export default StreakBadge;
