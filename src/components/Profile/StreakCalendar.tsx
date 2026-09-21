import { motion } from 'framer-motion';

interface StreakCalendarProps {
  activeDays: string[];  // ISO date strings of active days
  currentStreak: number;
  longestStreak: number;
}

export function StreakCalendar({ activeDays, currentStreak, longestStreak }: StreakCalendarProps) {
  // Generate last 28 days
  const today = new Date();
  const days: Date[] = [];
  for (let i = 27; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date);
  }

  const isActive = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return activeDays.some(d => d.startsWith(dateStr));
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-gray-800/50 rounded-2xl p-3 sm:p-4 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
        <h3 className="text-white font-semibold text-sm sm:text-base">Activity</h3>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <span className="text-gray-400">
            Current: <span className="text-orange-400 font-bold">{currentStreak}🔥</span>
          </span>
          <span className="text-gray-400">
            Best: <span className="text-amber-400 font-bold">{longestStreak}</span>
          </span>
        </div>
      </div>

      {/* Week day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1 sm:mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-[10px] sm:text-xs text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for alignment */}
        {[...Array(days[0].getDay())].map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {days.map((date, index) => {
          const active = isActive(date);
          const todayCell = isToday(date);

          return (
            <motion.div
              key={date.toISOString()}
              className={`
                aspect-square rounded-md flex items-center justify-center text-[10px] sm:text-xs
                ${active
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white'
                  : 'bg-gray-700/50 text-gray-500'
                }
                ${todayCell ? 'ring-1 sm:ring-2 ring-orange-400 ring-offset-1 ring-offset-gray-900' : ''}
              `}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ scale: 1.1 }}
            >
              {active && '🔥'}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gray-700/50" />
          <span>Inactive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gradient-to-br from-orange-500 to-amber-500" />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
}

export default StreakCalendar;
