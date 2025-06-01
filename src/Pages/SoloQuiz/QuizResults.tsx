import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import useSendBack from  '../../Services/sendBack'


export default function QuizResults({ score, totalQuestions }) {
  const navigate = useNavigate();
  useSendBack();
  return (
    <Card className="w-full max-w-xl border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl">
      <CardContent className="space-y-6 pt-6 px-6">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center text-orange-400"
        >
          Quiz Complete!
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 rounded-xl p-6 text-center"
        >
          <p className="text-xl text-white mb-2">Your score</p>
          <p className="text-4xl font-bold text-orange-500">{score}/{totalQuestions}</p>
          <p className="text-gray-400 mt-2">
            {score === totalQuestions ? "Perfect score! 🎉" : 
             score >= totalQuestions * 0.7 ? "Great job! 👏" : 
             score >= totalQuestions * 0.5 ? "Good effort! 👍" : 
             "Keep practicing! 💪"}
          </p>
        </motion.div>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl"
          >
            Return to Dashboard
          </Button>
          
          <Button 
            onClick={() => navigate('/quiz-settings/solo')}
            variant="outline"
            className="w-full py-4 border-orange-500/50 text-orange-400 hover:bg-orange-500/10 font-semibold rounded-xl"
          >
            Start New Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}