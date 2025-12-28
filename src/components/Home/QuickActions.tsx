import { motion } from 'framer-motion';
import { BookOpen, Zap, Users, Trophy } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface QuickActionsProps {
  onLearn: () => void;
  onPractice: () => void;
  onCompete: () => void;
  onLeaderboard: () => void;
}

export function QuickActions({ onLearn, onPractice, onCompete, onLeaderboard }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'learn',
      label: 'Learn',
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      onClick: onLearn,
    },
    {
      id: 'practice',
      label: 'Practice',
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      onClick: onPractice,
    },
    {
      id: 'compete',
      label: 'Compete',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      onClick: onCompete,
    },
    {
      id: 'ranks',
      label: 'Ranks',
      icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      onClick: onLeaderboard,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          className={`
            flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl
            border ${action.bgColor}
            transition-colors min-h-[60px] sm:min-h-[72px] touch-target
          `}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
        >
          <span className={action.color}>{action.icon}</span>
          <span className={`text-[10px] sm:text-xs mt-1 font-medium ${action.color}`}>
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export default QuickActions;
