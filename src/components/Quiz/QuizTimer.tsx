import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface QuizTimerProps {
  timeLeft: number;  // seconds
  totalTime: number; // seconds
}

export function QuizTimer({ timeLeft, totalTime }: QuizTimerProps) {
  const progress = (timeLeft / totalTime) * 100;
  const isLow = timeLeft <= 30;
  const isCritical = timeLeft <= 10;

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        ${isCritical 
          ? 'bg-red-500/20 border border-red-500/50' 
          : isLow 
            ? 'bg-amber-500/20 border border-amber-500/50'
            : 'bg-gray-800/80 border border-gray-700'
        }
      `}
      animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
    >
      <Clock className={`w-4 h-4 ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-400'}`} />
      
      <span className={`
        font-mono font-bold text-sm
        ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}
      `}>
        {formatTime(timeLeft)}
      </span>

      {/* Mini progress bar */}
      <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-orange-500'
          }`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

export default QuizTimer;
