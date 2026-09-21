import { motion, AnimatePresence } from 'framer-motion';
import type { NimeResponse, NestoResponse, TutorType } from '../../Types/tutor';

interface TutorFeedbackCardProps {
  tutor: TutorType;
  feedback: NimeResponse | NestoResponse;
  isVisible: boolean;
  onDismiss?: () => void;
}

const tutorConfig = {
  nime: {
    name: 'Nime',
    emoji: '🦊',
    gradient: 'from-orange-400 to-amber-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-900',
  },
  nesto: {
    name: 'Nesto',
    emoji: '🦅',
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
  },
};

export function TutorFeedbackCard({ tutor, feedback, isVisible, onDismiss }: TutorFeedbackCardProps) {
  const config = tutorConfig[tutor];
  const isNime = tutor === 'nime';
  const nimeFeedback = isNime ? (feedback as NimeResponse) : null;
  const nestoFeedback = !isNime ? (feedback as NestoResponse) : null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-4 shadow-sm`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{config.emoji}</span>
              <span className={`font-semibold ${config.textColor}`}>{config.name}</span>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Message */}
          <p className={`${config.textColor} text-sm leading-relaxed`}>
            {feedback.message}
          </p>

          {/* Nime-specific: Tip */}
          {nimeFeedback?.tip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 flex items-start gap-2 text-xs text-orange-700 bg-orange-100 rounded-lg p-2"
            >
              <span>💡</span>
              <span>{nimeFeedback.tip}</span>
            </motion.div>
          )}

          {/* Nime-specific: Next Suggestion */}
          {nimeFeedback?.nextSuggestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-xs text-orange-600"
            >
              → {nimeFeedback.nextSuggestion}
            </motion.div>
          )}

          {/* Nesto-specific: Challenge */}
          {nestoFeedback?.challengeSuggestion && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg"
            >
              {nestoFeedback.challengeSuggestion}
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TutorFeedbackCard;
