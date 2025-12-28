import { motion } from 'framer-motion';

interface DailyGoalBarProps {
  current: number;
  goal: number;
  showLabel?: boolean;
}

export function DailyGoalBar({ current, goal, showLabel = true }: DailyGoalBarProps) {
  const progress = Math.min((current / goal) * 100, 100);
  const isComplete = current >= goal;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Daily Goal</span>
          <span className={`text-sm font-medium ${isComplete ? 'text-green-400' : 'text-orange-400'}`}>
            {current}/{goal} XP
          </span>
        </div>
      )}
      
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${
            isComplete 
              ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
              : 'bg-gradient-to-r from-orange-500 to-amber-400'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '400%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      </div>

      {isComplete && (
        <motion.p
          className="text-xs text-green-400 mt-1 flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span>✓</span> Goal complete! Keep going!
        </motion.p>
      )}
    </div>
  );
}

export default DailyGoalBar;
