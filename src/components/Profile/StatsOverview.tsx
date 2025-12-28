import { motion } from 'framer-motion';
import { Target, Clock, Zap, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  totalXP: number;
  totalQuestions: number;
  accuracy: number;
  totalTime: number;  // seconds
}

export function StatsOverview({ totalXP, totalQuestions, accuracy, totalTime }: StatsOverviewProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const stats = [
    {
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Total XP',
      value: totalXP.toLocaleString(),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Questions',
      value: totalQuestions.toLocaleString(),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Accuracy',
      value: `${accuracy}%`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: 'Time Spent',
      value: formatTime(totalTime),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className={`${stat.bgColor} rounded-xl p-3 sm:p-4 border border-gray-700/30`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className={`${stat.color} mb-1 sm:mb-2`}>{stat.icon}</div>
          <p className="text-white text-lg sm:text-xl font-bold">{stat.value}</p>
          <p className="text-gray-500 text-[10px] sm:text-xs">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default StatsOverview;
