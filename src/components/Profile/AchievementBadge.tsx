import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { Achievement } from '../../Types/user';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  onTap?: () => void;
}

export function AchievementBadge({ achievement, size = 'md', onTap }: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl',
    md: 'w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl',
    lg: 'w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl',
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-1 cursor-pointer touch-target"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
    >
      <div className={`
        relative rounded-xl flex items-center justify-center
        ${sizeClasses[size]}
        ${achievement.isUnlocked
          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
          : 'bg-gray-800 border border-gray-700'
        }
      `}>
        {achievement.isUnlocked ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {achievement.icon}
          </motion.span>
        ) : (
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        )}

        {/* Progress indicator for progressive achievements */}
        {!achievement.isUnlocked && achievement.progress !== undefined && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 sm:h-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${achievement.progress}%` }}
            />
          </div>
        )}
      </div>

      <p className={`
        text-[10px] sm:text-xs text-center max-w-[60px] sm:max-w-[80px] truncate
        ${achievement.isUnlocked ? 'text-gray-300' : 'text-gray-600'}
      `}>
        {achievement.name}
      </p>
    </motion.div>
  );
}

export default AchievementBadge;
