// ============================================
// FOOTER NAVIGATION
// Bottom navigation bar with Home, Learn, Ranks, Profile
// ============================================

import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, GraduationCap, Trophy, User } from 'lucide-react';

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/tutor", icon: GraduationCap, label: "Learn" },
  { to: "/leaderboard", icon: Trophy, label: "Ranks" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function FooterNav() {
  const location = useLocation();

  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="fixed left-1/2 -translate-x-1/2 z-50 md:hidden"
      style={{
        bottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
      }}
    >
      <nav className="bg-gray-900/95 text-white border border-gray-800 flex justify-around items-center py-2 px-4 sm:px-6 rounded-2xl shadow-xl backdrop-blur-md ring-1 ring-gray-700 min-w-[280px] w-auto max-w-[calc(100vw-32px)]">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || 
            (to === '/tutor' && location.pathname.startsWith('/tutor'));

          return (
            <Link 
              key={to} 
              to={to} 
              className="flex flex-col items-center px-3 sm:px-4 py-1 touch-target"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center transition-all duration-150"
              >
                <div className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-none' : ''
                }`}>
                  <Icon 
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      isActive ? 'text-orange-500' : 'text-gray-400'
                    }`}
                  />
                </div>
                <span className={`text-[10px] sm:text-xs font-medium mt-0.5 ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </motion.footer>
  );
}
