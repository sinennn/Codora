import { motion } from 'framer-motion';
import type { SkillProgress } from '../../Types/user';

interface SkillCardProps {
  skill: SkillProgress;
  onTap?: () => void;
}

const categoryIcons: Record<string, string> = {
  language: '💻',
  framework: '⚛️',
  concept: '🧠',
};

const levelColors = [
  'from-gray-500 to-gray-600',      // 0
  'from-green-600 to-green-500',    // 1
  'from-blue-600 to-blue-500',      // 2
  'from-purple-600 to-purple-500',  // 3
  'from-orange-600 to-orange-500',  // 4
  'from-amber-500 to-yellow-400',   // 5 (mastery)
];

export function SkillCard({ skill, onTap }: SkillCardProps) {
  const progress = (skill.completedLessons / skill.totalLessons) * 100;
  const levelColor = levelColors[skill.level] || levelColors[0];

  return (
    <motion.div
      className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 cursor-pointer"
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(55, 65, 81, 0.7)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoryIcons[skill.category] || '📚'}</span>
          <div>
            <h4 className="text-white font-medium">{skill.name}</h4>
            <p className="text-xs text-gray-500 capitalize">{skill.category}</p>
          </div>
        </div>

        {/* Level badge */}
        <div className={`
          px-2 py-0.5 rounded-full text-xs font-bold text-white
          bg-gradient-to-r ${levelColor}
        `}>
          Lv.{skill.level}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${levelColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{skill.completedLessons}/{skill.totalLessons} lessons</span>
        <span>{skill.accuracy}% accuracy</span>
      </div>
    </motion.div>
  );
}

export default SkillCard;
