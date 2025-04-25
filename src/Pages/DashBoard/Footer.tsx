import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, Trophy, Settings } from 'lucide-react';

const navItems = [
  { to: "/profile", label: "Profile", Icon: User },
  { to: "/individual-quizzes", label: "Solo", Icon: Home },
  { to: "/group-quizzes", label: "Group", Icon: Users },
  { to: "/leaderboard", label: "Rank", Icon: Trophy },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export default function FooterNav() {
  const location = useLocation();

  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="fixed bottom-0 left-0 w-full bg-gray-900 text-white border-t border-gray-800 flex justify-around py-3 md:hidden z-50"
    >
      {navItems.map(({ to, label, Icon }) => {
        const isActive = location.pathname === to;

        return (
          <Link key={to} to={to} className="flex flex-col items-center text-sm">
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={`flex flex-col items-center ${
                isActive ? 'text-orange-500' : 'text-white'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs">{label}</span>
            </motion.div>
          </Link>
        );
      })}
    </motion.footer>
  );
}
