import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

export default function IndividualQuizCard() {
  return (
    <Link to="/solosetting" className="block w-full">
      <motion.div
        className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-md hover:shadow-orange-500/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 sm:gap-4 w-full max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeIn' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <User className="w-12 h-12 sm:w-[53px] sm:h-[53px] stroke-orange-500" strokeWidth={0.75} />
        <h3 className="text-lg sm:text-xl font-bold text-orange-400 mb-1 sm:mb-2 text-center">Indie Quizzes</h3>
        <p className="text-gray-400 text-sm sm:text-base text-center">Test & sharpen your skills solo 💪</p>
      </motion.div>
    </Link>
  );
}
