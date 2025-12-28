import { motion } from 'framer-motion';
import type { TutorType } from '../../Types/tutor';

interface TutorMessageProps {
  tutor: TutorType;
  message: string;
  onTap?: () => void;
}

const tutorConfig = {
  nime: {
    emoji: '🦊',
    name: 'Nime',
    gradient: 'from-orange-500/10 to-amber-500/10',
    border: 'border-orange-500/20',
    accent: 'text-orange-400',
  },
  nesto: {
    emoji: '🦅',
    name: 'Nesto',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    border: 'border-blue-500/20',
    accent: 'text-blue-400',
  },
};

export function TutorMessage({ tutor, message, onTap }: TutorMessageProps) {
  const config = tutorConfig[tutor];

  return (
    <motion.div
      className={`
        relative p-4 rounded-2xl cursor-pointer
        bg-gradient-to-br ${config.gradient}
        border ${config.border}
        backdrop-blur-sm
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
    >
      {/* Avatar */}
      <div className="flex items-start gap-3">
        <motion.div
          className="text-3xl"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          {config.emoji}
        </motion.div>
        
        <div className="flex-1">
          <p className={`text-xs font-medium ${config.accent} mb-1`}>
            {config.name} says
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {/* Tap hint */}
      <motion.div
        className="absolute bottom-2 right-3 text-xs text-gray-500"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Tap to chat →
      </motion.div>
    </motion.div>
  );
}

export default TutorMessage;
