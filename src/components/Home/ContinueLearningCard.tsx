import { motion } from 'framer-motion';
import { Play, ChevronRight } from 'lucide-react';

interface ContinueLearningCardProps {
  topic: string;
  lessonName: string;
  progress: number;        // 0-100
  xpReward: number;
  onContinue: () => void;
}

export function ContinueLearningCard({
  topic,
  lessonName,
  progress,
  xpReward,
  onContinue,
}: ContinueLearningCardProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-4 shadow-lg shadow-orange-500/20 cursor-pointer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onContinue}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-1">
          <span className="text-[10px] sm:text-xs font-medium text-orange-100 bg-white/20 px-2 py-0.5 rounded-full">
            {topic}
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-white">
            +{xpReward} XP
          </span>
        </div>

        {/* Lesson name */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 line-clamp-2">
          {lessonName}
        </h3>

        {/* Progress bar */}
        <div className="mb-3 sm:mb-4">
          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-orange-100 mt-1">{progress}% complete</p>
        </div>

        {/* CTA Button */}
        <motion.button
          className="w-full flex items-center justify-center gap-1 sm:gap-2 bg-white text-orange-600 font-bold py-2.5 sm:py-3 rounded-xl min-h-[44px] text-sm sm:text-base"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
          Continue Learning
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default ContinueLearningCard;
