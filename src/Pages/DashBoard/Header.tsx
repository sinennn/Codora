import { motion } from 'framer-motion';

interface User {
  displayName?: string;
  photoURL?: string;
}

export default function Header({ user }: { user: User }) {
  const firstName = user?.displayName?.split(' ')[0] || 'User';

  return (
    <motion.header
      className="w-full p-4 flex justify-end items-center bg-gray-900 shadow-md sticky top-0 z-30"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-white text-lg font-semibold hidden sm:inline">
          Hi, {firstName}
        </span>
        {user?.photoURL && (
          <motion.img
            src={user.photoURL}
            alt="User Avatar"
            className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
        )}
      </div>
    </motion.header>
  );
}

  