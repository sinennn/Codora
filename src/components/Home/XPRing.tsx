import { motion } from 'framer-motion';

interface XPRingProps {
  progress: number;      // 0-100
  level: number;
  title: string;

  xpToNext: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { ring: 80, stroke: 6, text: 'text-lg', sub: 'text-xs' },
  md: { ring: 120, stroke: 8, text: 'text-2xl', sub: 'text-sm' },
  lg: { ring: 160, stroke: 10, text: 'text-3xl', sub: 'text-base' },
};

export function XPRing({ progress, level, title, xpToNext, size = 'md' }: XPRingProps) {
  const config = sizes[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        {/* Background ring */}
        <svg className="absolute inset-0 -rotate-90" width={config.ring} height={config.ring}>
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={config.stroke}
          />
        </svg>
        
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={config.ring} height={config.ring}>
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="url(#xpGradient)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`font-bold text-white ${config.text}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            {level}
          </motion.span>
          <span className={`text-gray-400 ${config.sub}`}>Level</span>
        </div>
      </div>

      {/* Title below ring */}
      <motion.div
        className="mt-3 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-orange-400 font-semibold">{title}</p>
        <p className="text-gray-500 text-xs mt-1">
          {xpToNext > 0 ? `${xpToNext} XP to next level` : 'Max level!'}
        </p>
      </motion.div>
    </div>
  );
}

export default XPRing;
