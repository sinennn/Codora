import { motion } from 'framer-motion';
import { BookOpen, Zap, Users } from 'lucide-react';

interface QuickActionsProps {
  onLearn: () => void;
  onPractice: () => void;
  onCompete: () => void;
}

export function QuickActions({ onLearn, onPractice, onCompete }: QuickActionsProps) {
  const actions = [
    {
      id: 'learn',
      label: 'Learn',
      description: 'AI-guided lessons',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
      onClick: onLearn,
    },
    {
      id: 'practice',
      label: 'Solo Quiz',
      description: 'Test yourself',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
      onClick: onPractice,
    },
    {
      id: 'compete',
      label: 'Group Quiz',
      description: 'Play with friends',
      icon: <Users className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
      onClick: onCompete,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          className={`
            flex flex-col items-center justify-center p-3 rounded-xl
            border ${action.bgColor}
            transition-colors min-h-[80px] touch-target
          `}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
        >
          <span className={action.color}>{action.icon}</span>
          <span className={`text-xs mt-1.5 font-semibold ${action.color}`}>
            {action.label}
          </span>
          <span className="text-[9px] text-gray-500 mt-0.5">
            {action.description}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export default QuickActions;
