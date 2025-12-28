import { motion } from 'framer-motion';
import { Target, Clock, TrendingUp, Home, RotateCcw } from 'lucide-react';
import { DualTutorFeedback } from '../Tutors';
import type { TutorFeedback } from '../../Types/tutor';

interface QuizCompleteProps {
  score: number;
  totalQuestions: number;
  xpEarned: number;
  timeSpent: number;        // seconds
  accuracy: number;         // 0-100
  streakUpdate?: number;    // New streak count
  tutorFeedback?: TutorFeedback | null;
  onGoHome: () => void;
  onRetry: () => void;
}

export function QuizComplete({
  score,
  totalQuestions,
  xpEarned,
  timeSpent,
  accuracy,
  streakUpdate,
  tutorFeedback,
  onGoHome,
  onRetry,
}: QuizCompleteProps) {
  const percentage = (score / totalQuestions) * 100;
  
  // Determine result tier
  const getTier = () => {
    if (percentage >= 90) return { emoji: '🏆', label: 'Perfect!', color: 'text-amber-400' };
    if (percentage >= 70) return { emoji: '🎉', label: 'Great Job!', color: 'text-green-400' };
    if (percentage >= 50) return { emoji: '👍', label: 'Good Effort!', color: 'text-blue-400' };
    return { emoji: '💪', label: 'Keep Practicing!', color: 'text-orange-400' };
  };

  const tier = getTier();

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}m ${seconds}s`;
  };

  const stats = [
    { icon: <Target className="w-5 h-5" />, label: 'Accuracy', value: `${accuracy}%`, color: 'text-green-400' },
    { icon: <Clock className="w-5 h-5" />, label: 'Time', value: formatTime(timeSpent), color: 'text-blue-400' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'XP Earned', value: `+${xpEarned}`, color: 'text-orange-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black px-4 py-8">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-700/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Result Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          >
            {tier.emoji}
          </motion.div>
          
          <motion.h1
            className={`text-3xl font-bold ${tier.color} mb-2`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {tier.label}
          </motion.h1>

          <motion.p
            className="text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You scored {score} out of {totalQuestions}
          </motion.p>
        </motion.div>

        {/* Score Ring */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={352}
                initial={{ strokeDashoffset: 352 }}
                animate={{ strokeDashoffset: 352 - (352 * percentage) / 100 }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{Math.round(percentage)}%</span>
              <span className="text-xs text-gray-500">Score</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <div className={`${stat.color} flex justify-center mb-1`}>
                {stat.icon}
              </div>
              <p className="text-white font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Streak Update */}
        {streakUpdate && (
          <motion.div
            className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-4 mb-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
          >
            <span className="text-2xl">🔥</span>
            <p className="text-orange-400 font-bold">{streakUpdate}-day streak!</p>
            <p className="text-xs text-gray-400">Keep it going tomorrow</p>
          </motion.div>
        )}

        {/* AI Tutor Feedback */}
        {tutorFeedback && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <DualTutorFeedback feedback={tutorFeedback} />
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <motion.button
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoHome}
          >
            <Home className="w-5 h-5" />
            Back to Home
          </motion.button>

          <motion.button
            className="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-300 font-medium py-3 rounded-xl border border-gray-700"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(55, 65, 81, 1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default QuizComplete;
