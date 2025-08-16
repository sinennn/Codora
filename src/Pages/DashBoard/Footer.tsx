import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import Home from '/assets/home.png';
import LeaderBoard from '/assets/Leaderboard.png';
import User from '/assets/user.png';

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/leaderboard", icon: LeaderBoard, label: "LeaderBoard" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function FooterNav() {
  const location = useLocation();

  return (
    <motion.footer
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 100 }}
    className="fixed left-1/2 -translate-x-1/2 bottom-6 bg-gray-900/90 text-white border border-gray-800 flex justify-around items-center py-3 px-8 rounded-full shadow-xl backdrop-blur-md ring-1 ring-gray-700 md:hidden z-50 w-auto min-w-[240px] max-w-[90vw]"
  >
    {navItems.map(({ to, icon, label }) => {
      const isActive = location.pathname === to;

      return (
        <Link key={to} to={to} className="flex flex-col items-center mx-4">
          <motion.div
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center transition-all duration-150 text-white"
          >
            <img
              src={icon}
              alt={label}
              className="w-[24px] h-[24px] mb-1"
            />
            <span className={`text-xs font-medium ${isActive ? 'text-orange-500' : 'text-white'}`}>
              {label}
            </span>
          </motion.div>
        </Link>
      );
    })}
  </motion.footer>
  );
}