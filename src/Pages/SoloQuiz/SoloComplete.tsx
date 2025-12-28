// ============================================
// SOLO QUIZ COMPLETE PAGE
// Shows results and saves to Firebase
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle2, XCircle, Trophy, Sparkles, MessageCircle } from "lucide-react";
import useSendBack from '../../Services/sendBack';
import { useEffect, useState, useRef } from 'react';
import { auth } from '../../../firebase';
import { useUserProgress } from '../../Context/UserProgressContext';
import { getNimeFeedback } from '../../Services/tutorService';
import confetti from 'canvas-confetti';

export default function SoloComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const [scoreSaved, setScoreSaved] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [tutorFeedback, setTutorFeedback] = useState<string | null>(null);
  const [showTutorFeedback, setShowTutorFeedback] = useState(false);
  const hasSavedScore = useRef(false);
  
  const { submitQuizResult, userProgress } = useUserProgress();
  useSendBack();

  useEffect(() => {
    const saveScore = async () => {
      if (
        typeof state?.score === 'number' &&
        auth.currentUser?.uid &&
        !hasSavedScore.current &&
        state?.allQuestions
      ) {
        try {
          hasSavedScore.current = true;
          
          // Prepare quiz result data
          const quizResult = {
            topic: state.topic || 'General',
            category: (state.category || 'technology') as 'field' | 'technology',
            difficulty: state.difficulty || 'beginner',
            totalQuestions: state.allQuestions.length,
            correctAnswers: state.score,
            score: state.score,
            timeSpent: state.timeSpent || 0,
            questions: state.allQuestions.map((q: any, i: number) => ({
              question: q.question,
              userAnswer: state.userAnswers[i] ?? -1,
              correctAnswer: q.options?.findIndex((o: any) => o.isCorrect) ?? q.correctAnswer ?? 0,
              isCorrect: state.userAnswers[i] !== null && state.userAnswers[i] !== -1 && 
                (q.options?.[state.userAnswers[i]]?.isCorrect || state.userAnswers[i] === q.correctAnswer),
            })),
          };

          // Submit to Firebase via context
          const result = await submitQuizResult(quizResult);
          
          setXpEarned(result.xpEarned);
          setLeveledUp(result.leveledUp);
          setNewAchievements(result.newAchievements);
          setScoreSaved(true);

          // Trigger confetti for good scores
          const percentage = (state.score / state.allQuestions.length) * 100;
          if (percentage >= 70) {
            confetti({
              particleCount: percentage === 100 ? 150 : 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f97316', '#fbbf24', '#22c55e'],
            });
          }

          // Get tutor feedback
          try {
            const feedback = await getNimeFeedback({
              question: `Quiz on ${state.topic || 'coding'}`,
              userAnswer: `${state.score}/${state.allQuestions.length} correct`,
              correctAnswer: 'N/A',
              topic: state.topic || 'coding',
              difficulty: state.difficulty || 'beginner',
              isCorrect: percentage >= 70,
            });
            setTutorFeedback(feedback.message);
          } catch (err) {
            console.error('Error getting tutor feedback:', err);
          }

        } catch (error) {
          console.error('Error saving score:', error);
          setScoreSaved(true);
        }
      }
    };

    saveScore();
  }, [state, submitQuizResult]);

  if (!state || state.score === undefined || !state.allQuestions) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
        <div className="text-white text-center py-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">No quiz results available</h2>
          <p className="text-gray-400 text-sm sm:text-base">Please complete a quiz first.</p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-orange-500 hover:bg-orange-600"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { score, allQuestions, userAnswers } = state;
  const percentage = (score / allQuestions.length) * 100;

  let emotionImage = "";
  let resultMessage = "";
  if (percentage >= 80) {
    emotionImage = "/assets/Excited.png";
    resultMessage = "Excellent work! 🎉";
  } else if (percentage >= 50) {
    emotionImage = "/assets/Content.png";
    resultMessage = "Good job! Keep practicing! 👍";
  } else {
    emotionImage = "/assets/Sad.png";
    resultMessage = "Don't give up! Try again! 💪";
  }

  return (
    <div className="relative w-full min-h-screen min-h-[100dvh] flex justify-center items-start bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-6 py-6 sm:py-12 overflow-x-hidden animate-fade-in safe-top">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-orange-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="w-full border-none bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
          <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-4 sm:px-6">
            <motion.h2
              className="text-2xl sm:text-3xl font-bold text-center text-orange-400"
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
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                />
              </div>
            )}

            <div className="text-center">
              <p className="text-xl sm:text-2xl text-white font-bold mb-2">
                {score}/{allQuestions.length}
              </p>
              <p className="text-gray-400">{resultMessage}</p>
            </div>

            {/* XP & Achievements */}
            <AnimatePresence>
              {scoreSaved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center gap-4"
                >
                  <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-xl">
                    <Trophy className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-400 font-bold">+{xpEarned} XP</span>
                  </div>
                  {leveledUp && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-xl"
                    >
                      <Sparkles className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-bold">Level Up!</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Achievements */}
            <AnimatePresence>
              {newAchievements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3"
                >
                  <p className="text-purple-400 text-sm font-medium mb-2">🏆 Achievements Unlocked!</p>
                  <div className="flex flex-wrap gap-2">
                    {newAchievements.map((achievement, i) => (
                      <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg">
                        {achievement}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tutor Feedback */}
            {tutorFeedback && (
              <motion.button
                onClick={() => setShowTutorFeedback(!showTutorFeedback)}
                className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-sm">
                    🦊
                  </div>
                  <span className="text-orange-400 text-sm font-medium">Nime's Feedback</span>
                  <MessageCircle className="w-4 h-4 text-orange-400 ml-auto" />
                </div>
                <AnimatePresence>
                  {showTutorFeedback && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-gray-300 text-sm"
                    >
                      {tutorFeedback}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* Questions Review */}
            <div className="space-y-4 sm:space-y-6 mt-4 max-h-[40vh] overflow-y-auto">
              {allQuestions.map((question: any, qIndex: number) => {
                const userAnswer = userAnswers[qIndex];
                const isCorrect = question.options 
                  ? question.options[userAnswer]?.isCorrect 
                  : userAnswer === question.correctAnswer;

                return (
                  <div key={qIndex} className="border border-gray-700 rounded-xl p-3 sm:p-4 bg-gray-800/50">
                    <h3 className="font-bold text-white mb-2 text-sm sm:text-base">
                      {qIndex + 1}. {question.question}
                    </h3>

                    <div className="space-y-2">
                      {(question.options || []).map((option: any, oIndex: number) => {
                        const optionText = typeof option === 'string' ? option : option.text;
                        const optionIsCorrect = typeof option === 'object' ? option.isCorrect : oIndex === question.correctAnswer;
                        const isUserSelection = userAnswer === oIndex;

                        let bgColor = "bg-gray-700";
                        if (isUserSelection && optionIsCorrect) bgColor = "bg-green-600/70";
                        else if (isUserSelection && !optionIsCorrect) bgColor = "bg-red-600/70";
                        else if (optionIsCorrect) bgColor = "bg-green-600/40";

                        return (
                          <div
                            key={oIndex}
                            className={`px-3 py-2 rounded-lg ${bgColor} flex items-center text-sm sm:text-base`}
                          >
                            <span className="flex-1 text-white">{optionText}</span>
                            {isUserSelection && optionIsCorrect && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 flex-shrink-0 ml-2" />}
                            {isUserSelection && !optionIsCorrect && <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-300 flex-shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>
                    
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-orange-700/50 rounded-lg">
                        <h4 className="font-semibold text-orange-300 mb-1 text-sm">Explanation:</h4>
                        <p className="text-gray-200 text-xs sm:text-sm">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-4 pb-6 px-4 sm:px-6">
            <Button
              onClick={() => navigate('/tutor')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl min-h-[48px] text-sm sm:text-base"
            >
              Learn More with AI Tutor
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 px-6 py-2 rounded-xl min-h-[44px] text-sm sm:text-base"
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </div>
      </motion.div>
    </div>
  );
}
