/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "../../components/ui/button";
import useSendBack from '../../Services/sendBack'

export default function QuizCard() {
  useSendBack();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  
  if (!state || !state.questionData || !state.quizTime) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
        <div className="text-white text-center py-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">No quiz data available</h2>
          <p className="text-gray-400 text-sm sm:text-base">Please try generating a new quiz.</p>
        </div>
      </div>
    );
  }
  
  const questionData = state.questionData;
  const quizTime = state.quizTime;
  const [allQuestions] = useState(Array.isArray(questionData) ? questionData : [questionData]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(Array(allQuestions.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quizTime);

  useEffect(() => {
    if (quizSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!quizSubmitted) {
            handleSubmitQuiz();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizSubmitted]);

  const handleSelect = (index) => {
    if (!quizSubmitted) {
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestionIndex] = index;
      setUserAnswers(newAnswers);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (quizSubmitted) return;
    
    setQuizSubmitted(true);

    let newScore = 0;
    userAnswers.forEach((answer, index) => {
      if (answer !== null && allQuestions[index].options[answer].isCorrect) {
        newScore++;
      }
    });
    setScore(newScore);

    const completedAnswers = [...userAnswers];
    for (let i = 0; i < allQuestions.length; i++) {
      if (completedAnswers[i] === null) {
        completedAnswers[i] = -1;
      }
    }

    navigate('/SoloComplete', {
      state: {
        score: newScore,
        allQuestions,
        userAnswers: completedAnswers,
        timeUp: timeLeft <= 0
      },
      replace: true,
    });
  };

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!allQuestions || allQuestions.length === 0) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
        <div className="text-white text-center py-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">No questions available</h2>
          <p className="text-gray-400 text-sm sm:text-base">Please try generating a new quiz.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentAnswer = userAnswers[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
        <div className="text-white text-center py-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Question data is invalid</h2>
          <p className="text-gray-400 text-sm sm:text-base">Please try generating a new quiz.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen min-h-[100dvh] flex flex-col justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-6 py-4 overflow-x-hidden animate-fade-in safe-top">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-orange-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Timer - Fixed position */}
      <div className="fixed top-4 left-4 z-20 text-orange-500 font-bold text-sm sm:text-lg tracking-wide bg-gray-900/80 px-3 sm:px-4 py-2 rounded-xl border border-orange-500 shadow-lg backdrop-blur-md safe-top">
        ⏱ {formatTime(timeLeft)}
      </div>

      {/* Question counter - Fixed position */}
      <div className="fixed top-4 right-4 z-20 text-white font-bold text-sm sm:text-lg tracking-wide bg-gray-900/80 px-3 sm:px-4 py-2 rounded-xl border border-gray-700 shadow-lg backdrop-blur-md safe-top">
        {currentQuestionIndex + 1}/{allQuestions.length}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl mt-16 sm:mt-20"
      >
        {!quizSubmitted ? (
          <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in max-h-[calc(100vh-120px)] max-h-[calc(100dvh-120px)] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6">
              <motion.h2
                className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-orange-400 leading-tight"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentQuestion.question}
              </motion.h2>

              <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = currentAnswer === index;

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelect(index)}
                      className={`w-full text-left px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl border transition-all duration-300 min-h-[44px] text-sm sm:text-base
                        ${isSelected
                          ? "bg-orange-500/90 border-orange-400 text-white"
                          : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300"
                        }`}
                      whileTap={{ scale: 0.97 }}
                    >
                      {option.text}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-4 pb-4 sm:pb-6 px-4 sm:px-6 gap-2">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1 min-h-[44px] text-sm sm:text-base ${currentQuestionIndex === 0
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-800 hover:bg-gray-700 text-white"
                  }`}
              >
                <ChevronLeft className="h-4 w-4" /> <span className="hidden xs:inline">Previous</span><span className="xs:hidden">Prev</span>
              </Button>

              {currentQuestionIndex === allQuestions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-xl flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1 min-h-[44px] text-sm sm:text-base"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
            <CardContent className="space-y-6 pt-6 px-4 sm:px-6">
              <motion.h2
                className="text-2xl sm:text-3xl font-bold text-center text-orange-400"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Quiz Results
              </motion.h2>

              <div className="text-center text-xl sm:text-2xl text-white font-bold">
                Your Score: {score}/{allQuestions.length}
              </div>

              <div className="space-y-4 sm:space-y-6 mt-4">
                {allQuestions.map((question, qIndex) => {
                  const userAnswer = userAnswers[qIndex];

                  return (
                    <div key={qIndex} className="border border-gray-700 rounded-xl p-3 sm:p-4 bg-gray-800/50">
                      <h3 className="font-bold text-white mb-2 text-sm sm:text-base">
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
                              className={`px-3 py-2 rounded-lg ${bgColor} flex items-center text-sm sm:text-base`}
                            >
                              <span className="flex-1">{option.text}</span>
                              {isUserSelection && isCorrectAnswer && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 flex-shrink-0" />}
                              {isUserSelection && !isCorrectAnswer && <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-300 flex-shrink-0" />}
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
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl min-h-[44px]"
              >
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
