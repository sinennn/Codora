import { motion } from "framer-motion";
import { UserRound } from "lucide-react";

export default function IndividualQuizCard() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="flex flex-wrap justify-center gap-2 max-w-4xl w-full">
        <QuizCard />
      </div>
    </div>
  );
}

function QuizCard() {
  return (
    <motion.div
      className="bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-orange-500/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-5 w-full sm:w-[300px]"
      initial={{ opacity: 0, scale: 1.3 }} 
      animate={{ opacity: 1, scale: 1.3 }} 
      whileHover={{opacity:1, scale:1.5}}
      whileFocus={{opacity:1, scale:1.5}}
      transition={{ duration: 0.2, ease: "easeIn" }}
    >
      <span className="flex gap-x-2">
        <UserRound className="w-[48px] h-[48px] stroke-orange-500" strokeWidth={0.75} />
        <UserRound className="w-[48px] h-[48px] stroke-orange-500" strokeWidth={0.75} />
        <UserRound className="w-[48px] h-[48px] stroke-orange-500" strokeWidth={0.75} />
      </span>
      <h3 className="text-xl font-bold text-orange-400 mb-2">Group Quizzes</h3>
      <p className="text-gray-400">Or find out who's the better dev in your friend group🙂</p>
    </motion.div>
  );
}