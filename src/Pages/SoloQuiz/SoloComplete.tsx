import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import useSendBack from '../../Services/sendBack';
import { useEffect, useState, useRef } from 'react';
import { auth } from '../../../firebase';
import { updateUserScore } from '../../Services/scoreService';


export default function SoloComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const [scoreSaved, setScoreSaved] = useState(false);
  const hasSavedScore = useRef(false);
  useSendBack();

  useEffect(() => {
    const saveScore = async () => {
      if (
        typeof state?.score === 'number' &&
        auth.currentUser?.uid &&
        !hasSavedScore.current
      ) {
        try {
          hasSavedScore.current = true; 
          const username = auth.currentUser.displayName || 'Anonymous';
          const email = auth.currentUser.email || '';
          await updateUserScore(auth.currentUser.uid, state.score, username, email);
          setScoreSaved(true);
          console.log("Score Uploaded Successfully");
        } catch (error) {
          console.error('Error saving score:', error);
          setScoreSaved(true);
        }
      }
    };
  
    saveScore();
  }, [auth.currentUser?.uid, state?.score]);
  
  
  

  {scoreSaved && 
    console.log("Score Uploaded Succesfully");
  }

  if (!state || state.score === undefined || !state.allQuestions) {
    return (
      <div className="text-white text-center py-8">
        <h2 className="text-2xl font-bold mb-4">No quiz results available</h2>
        <p className="text-gray-400">Please complete a quiz first.</p>
      </div>
    );
  }

  const { score, allQuestions, userAnswers } = state;

  let emotionImage = "";
  const percentage = (score / allQuestions.length) * 100;
  if (percentage >= 0 && percentage < 50) {
    emotionImage = "/assets/Sad.png";
  } else if (percentage >= 50 && percentage < 80) {
    emotionImage = "/assets/Content.png";
  } else if (percentage >= 80 && percentage <= 100) {
    emotionImage = "/assets/Excited.png";
  }

  return (
    <div className="relative w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-8 py-12 overflow-hidden animate-fade-in">

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="w-full border-none bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
          <CardContent className="space-y-6 pt-6 px-6">
            <motion.h2
              className="text-3xl font-bold text-center text-orange-400"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Quiz Results
            </motion.h2>


            {emotionImage && (
              <div className="flex justify-center">
                <motion.img
                  src={emotionImage}
                  alt="Emotion"
                  className="w-32 h-32 object-contain"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                />
              </div>
            )}

            <div className="text-center text-2xl text-white font-bold">
              Your Score: {score}/{allQuestions.length}
            </div>

            <div className="space-y-6 mt-4">
              {allQuestions.map((question, qIndex) => {
                const userAnswer = userAnswers[qIndex];

                return (
                  <div key={qIndex} className="border border-gray-700 rounded-xl p-4 bg-gray-800/50">
                    <h3 className="font-bold text-white mb-2">
                      {qIndex + 1}. {question.question}
                    </h3>

                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => {
                        const isUserSelection = userAnswer === oIndex;
                        const isCorrectAnswer = option.isCorrect;

                        let bgColor = "bg-gray-700";
                        if (isUserSelection && isCorrectAnswer) bgColor = "bg-green-600/70";
                        else if (isUserSelection && !isCorrectAnswer) bgColor = "bg-red-600/70";
                        else if (isCorrectAnswer) bgColor = "bg-green-600/40";

                        return (
                          <div
                            key={oIndex}
                            className={`px-3 py-2 rounded-lg ${bgColor} flex items-center`}
                          >
                            <span className="flex-1">{option.text}</span>
                            {isUserSelection && isCorrectAnswer && <CheckCircle2 className="h-5 w-5 text-green-300" />}
                            {isUserSelection && !isCorrectAnswer && <XCircle className="h-5 w-5 text-red-300" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="flex justify-center pt-4 pb-6">
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl"
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </div>
      </motion.div>

    </div>
  );
}