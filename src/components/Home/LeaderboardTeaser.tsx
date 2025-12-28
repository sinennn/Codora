import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp } from 'lucide-react';

interface LeaderboardTeaserProps {
  rank: number;
  xpToClimb: number;
  nextUser?: string;
  onTap: () => void;
}

export function LeaderboardTeaser({ rank, xpToClimb, nextUser, onTap }: LeaderboardTeaserProps) {
  return (
    <motion.div
      className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 cursor-pointer min-h-[60px] touch-target"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(55, 65, 81, 0.7)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Rank badge */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xs sm:text-sm font-bold text-white">#{rank}</span>
        </div>

        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-white font-medium truncate">
            You're #{rank} this week
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1 truncate">
            <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span className="truncate">{xpToClimb} XP to pass {nextUser || 'next'}</span>
          </p>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
    </motion.div>
  );
}

export default LeaderboardTeaser;
