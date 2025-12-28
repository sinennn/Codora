// ============================================
// TUTOR LESSON COMPLETE PAGE
// Shows results after completing a lesson
// ============================================

import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Star, Target, ArrowRight, Home, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function TutorComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, correctCount, totalExercises, xpEarned } = location.state || {};

  const percentage = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;
  const isPerfect = percentage === 100;
  const isGood = percentage >= 70;

  // Confetti effect for good scores
  useEffect(() => {
    if (isGood) {
      const duration = isPerfect ? 3000 : 1500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: isPerfect ? 3 : 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f97316', '#fbbf24', '#22c55e'],
        });
        confetti({
          particleCount: isPerfect ? 3 : 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f97316', '#fbbf24', '#22c55e'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isGood, isPerfect]);

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">No lesson data available</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-xl"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const getMessage = () => {
    if (isPerfect) return { emoji: '🎉', text: 'Perfect Score!', sub: 'You nailed every exercise!' };
    if (percentage >= 80) return { emoji: '🔥', text: 'Excellent!', sub: 'You\'re on fire!' };
    if (percentage >= 60) return { emoji: '👍', text: 'Good Job!', sub: 'Keep practicing!' };
    return { emoji: '💪', text: 'Keep Going!', sub: 'Practice makes perfect!' };
  };

  const message = getMessage();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-black via-gray-900 to-black safe-top">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-12 pb-8 max-w-lg mx-auto w-full flex flex-col items-center justify-center min-h-screen">
        {/* Emoji */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-7xl mb-4"
        >
          {message.emoji}
        </motion.div>

        {/* Message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-2"
        >
          {message.text}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-8"
        >
          {message.sub}
        </motion.p>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 text-center">{topic}</h2>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Score */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white">{percentage}%</p>
              <p className="text-xs text-gray-400">Score</p>
            </div>

            {/* Correct */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{correctCount}/{totalExercises}</p>
              <p className="text-xs text-gray-400">Correct</p>
            </div>

            {/* XP */}
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white">+{xpEarned}</p>
              <p className="text-xs text-gray-400">XP Earned</p>
            </div>
          </div>
        </motion.div>

        {/* Tutor Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl p-4 border border-orange-500/30 mb-8"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-lg flex-shrink-0">
              🦊
            </div>
            <div>
              <p className="text-sm font-medium text-orange-400 mb-1">Nime says:</p>
              <p className="text-gray-300 text-sm">
                {isPerfect 
                  ? `Amazing work on ${topic}! You've mastered this lesson. Ready for the next challenge?`
                  : isGood
                    ? `Great progress on ${topic}! You're getting the hang of it. Keep practicing!`
                    : `Don't worry, ${topic} takes time to master. Review the lesson and try again!`
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full space-y-3"
        >
          <button
            onClick={() => navigate('/tutor')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
          >
            <ArrowRight className="w-5 h-5" />
            Learn Something New
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/tutor/lesson', { state: { topic, category: 'technology', difficulty: 'beginner' } })}
              className="flex-1 py-3 bg-gray-800/50 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 border border-gray-700/50"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-gray-800/50 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 border border-gray-700/50"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
