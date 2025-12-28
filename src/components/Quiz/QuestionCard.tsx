import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Option {
  text: string;
  isCorrect?: boolean;
}

interface QuestionCardProps {
  question: string;
  options: Option[];
  selectedAnswer: number | null;
  isSubmitted: boolean;
  onSelect: (index: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({
  question,
  options,
  selectedAnswer,
  isSubmitted,
  onSelect,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {questionNumber}/{totalQuestions}
        </span>
      </div>

      {/* Question */}
      <motion.h2
        className="text-xl font-bold text-white mb-6 leading-relaxed"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {question}
      </motion.h2>

      {/* Options */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = option.isCorrect;
            const showResult = isSubmitted && isSelected;

            let bgClass = 'bg-gray-800/80 border-gray-700 hover:bg-gray-700/80 hover:border-gray-600';
            let textClass = 'text-gray-200';

            if (isSubmitted) {
              if (isSelected && isCorrect) {
                bgClass = 'bg-green-500/20 border-green-500';
                textClass = 'text-green-400';
              } else if (isSelected && !isCorrect) {
                bgClass = 'bg-red-500/20 border-red-500';
                textClass = 'text-red-400';
              } else if (isCorrect) {
                bgClass = 'bg-green-500/10 border-green-500/50';
                textClass = 'text-green-400/80';
              }
            } else if (isSelected) {
              bgClass = 'bg-orange-500/20 border-orange-500';
              textClass = 'text-orange-400';
            }

            return (
              <motion.button
                key={index}
                className={`
                  w-full text-left px-4 py-3.5 rounded-xl border
                  transition-all duration-200 flex items-center justify-between
                  ${bgClass} ${textClass}
                  ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}
                `}
                onClick={() => !isSubmitted && onSelect(index)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: showResult ? [1, 1.02, 1] : 1,
                }}
                transition={{ delay: index * 0.05 }}
                whileTap={!isSubmitted ? { scale: 0.98 } : {}}
              >
                <span className="flex items-center gap-3">
                  <span className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium
                    ${isSelected ? 'bg-current/20' : 'bg-gray-700'}
                  `}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option.text}</span>
                </span>

                {/* Result icon */}
                {isSubmitted && isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default QuestionCard;
