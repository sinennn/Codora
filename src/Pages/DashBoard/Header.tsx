import { motion } from 'framer-motion';
import logo from '/assets/Start.png';
import { Link } from "react-router-dom";

interface User {
  displayName?: string;
  photoURL?: string;
}

export default function Header({ user }: { user?: User }) {
  const firstName = user?.displayName?.split(' ')[0] || 'User';

  return (
    <motion.header
      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-none top-0 z-30 backdrop-blur-md relative safe-top"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and greeting - visible on mobile */}
        <div className="flex items-center gap-2 sm:gap-4 md:hidden">
          <motion.img
            src={logo}
            alt="Codora Logo"
            className="h-12 sm:h-16 w-auto"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <span className="text-orange-400 text-base sm:text-lg font-semibold truncate max-w-[120px] sm:max-w-none">
            Hi, {firstName}
          </span>
        </div>

        {/* Profile picture */}
        <Link to="/profile" className="touch-target flex items-center justify-center">
          {user?.photoURL ? (
            <motion.img
              src={user.photoURL}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/navuser.png";
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-orange-500 object-cover shadow-md hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              alt="Profile"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-full flex items-center justify-center text-orange-400 font-bold text-sm sm:text-base border-2 border-orange-500">
              {firstName[0]}
            </div>
          )}
        </Link>
      </div>
    </motion.header>
  );
}
