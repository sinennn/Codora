import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

export default function GroupQuizCard() {
  return (
    <Link to="/solosetting">
      <motion.div
        className="bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-orange-500/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 w-full sm:w-[123px] max-w-md mx-auto"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeIn' }}
      >
        <User className="w-[53px] h-[53px] stroke-orange-500" strokeWidth={0.75} />
        <h3 className="text-xl font-bold text-orange-400 mb-2">Indie Quizzes</h3>
        <p className="text-gray-400 text-base">Test & sharpen your skills solo 💪&nbsp;</p>
      </motion.div>
    </Link>
  );
}