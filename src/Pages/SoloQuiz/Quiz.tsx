import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "../../components/ui/button";

export default function QuizCard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  if (!state || !state.questionData || !state.quizTime) {
    return (
      <div className="text-white text-center py-8">
        <h2 className="text-2xl font-bold mb-4">No quiz data available</h2>
        <p className="text-gray-400">Please try generating a new quiz.</p>
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
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

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
    if (!quizSubmitted) {
      setQuizSubmitted(true);
      
      // Calculate score
      let newScore = 0;
      userAnswers.forEach((answer, index) => {
        if (answer !== null && allQuestions[index].options[answer].isCorrect) {
          newScore++;
        }
      });
      setScore(newScore);
      
      // Navigate to the SoloComplete page with the quiz results
      navigate('/SoloComplete', {
        state: {
          score: newScore,
          allQuestions,
          userAnswers
        }
      });
    }
  };

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Check if we have questions before trying to access them
  if (!allQuestions || allQuestions.length === 0) {
    return (
      <div className="text-white text-center py-8">
        <h2 className="text-2xl font-bold mb-4">No questions available</h2>
        <p className="text-gray-400">Please try generating a new quiz.</p>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentAnswer = userAnswers[currentQuestionIndex];

  // Add additional safety check
  if (!currentQuestion) {
    return (
      <div className="text-white text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Question data is invalid</h2>
        <p className="text-gray-400">Please try generating a new quiz.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-8 overflow-hidden animate-fade-in">
      {/* Glowing Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Timer Display */}
      <div className="absolute top-6 left-6 text-orange-500 font-bold text-xl tracking-wide bg-gray-900/60 px-4 py-2 rounded-xl border border-orange-500 shadow-lg backdrop-blur-md">
        ⏱ {formatTime(timeLeft)}
      </div>

      {/* Question Counter */}
      <div className="absolute top-6 right-6 text-white font-bold text-xl tracking-wide bg-gray-900/60 px-4 py-2 rounded-xl border border-gray-700 shadow-lg backdrop-blur-md">
        Question {currentQuestionIndex + 1}/{allQuestions.length}
      </div>

      {/* Quiz Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        {!quizSubmitted ? (
          <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
            <CardContent className="space-y-6 pt-6 px-6">
              <motion.h2
                className="text-3xl font-bold text-center text-orange-400"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentQuestion.question}
              </motion.h2>

              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = currentAnswer === index;

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelect(index)}
                      className={`w-full text-left px-5 py-3 rounded-xl border transition-all duration-300
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

            <CardFooter className="flex justify-between pt-4 pb-6 px-6">
              <Button 
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-xl flex items-center gap-1 ${
                  currentQuestionIndex === 0 
                    ? "bg-gray-700 text-gray-400" 
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              
              {currentQuestionIndex === allQuestions.length - 1 ? (
                <Button 
                  onClick={handleSubmitQuiz}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl flex items-center gap-2"
                >
                  Submit Quiz <Send className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleNextQuestion}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
            <CardContent className="space-y-6 pt-6 px-6">
              <motion.h2
                className="text-3xl font-bold text-center text-orange-400"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Quiz Results
              </motion.h2>
              
              <div className="text-center text-2xl text-white font-bold">
                Your Score: {score}/{allQuestions.length}
              </div>
              
              <div className="space-y-6 mt-4">
                {allQuestions.map((question, qIndex) => {
                  const userAnswer = userAnswers[qIndex];
                  const isCorrect = userAnswer !== null && question.options[userAnswer].isCorrect;
                  
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
          </Card>
        )}
      </motion.div>
    </div>
  );
}
