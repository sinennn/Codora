/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect, useRef, JSX } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Send } from 'lucide-react';
import { Button } from "../../components/ui/button";
import roomService from '../../Services/Rooms';
import useSendBack from "../../Services/sendBack";
import { auth } from '../../../firebase';
import { updateUserScore } from '../../Services/scoreService';

const GroupQuiz: React.FC = (): JSX.Element => {
  useSendBack();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const [scoreSaved, setScoreSaved] = useState(false);
  const hasSavedScore = useRef(false);

  if (!state || !state.roomCode || !state.questions) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
        <div className="text-white text-center py-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">No quiz data available</h2>
          <p className="text-gray-400 text-sm sm:text-base">Please join or create a quiz room.</p>
        </div>
      </div>
    );
  }

  if (scoreSaved) {
    console.log("ScoreSaved")
  }

  const { roomCode, questions, quizTime } = state;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quizTime);
  const [allAnswers, setAllAnswers] = useState({});

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

  useEffect(() => {
    const unsubscribe = roomService.listenForAnswers(roomCode, (answers) => {
      setAllAnswers(answers || {});
    });
    return () => unsubscribe();
  }, [roomCode]);

  useEffect(() => {
    if (timeLeft === 0 && !quizSubmitted) {
      handleSubmitQuiz();
    }
  }, [timeLeft, quizSubmitted]);

  useEffect(() => {
    const saveScore = async () => {
      if (quizSubmitted && score > 0 && auth.currentUser?.uid && !hasSavedScore.current) {
        try {
          hasSavedScore.current = true;
          const username = auth.currentUser.displayName || 'Anonymous';
          const email = auth.currentUser.email || '';
          await updateUserScore(auth.currentUser.uid, score, username, email);
          setScoreSaved(true);
          console.log("Group quiz score uploaded successfully");
        } catch (error) {
          console.error('Error saving group quiz score:', error);
          setScoreSaved(true);
        }
      }
    };

    saveScore();
  }, [quizSubmitted, score]);

  const handleSelect = (index) => {
    if (!quizSubmitted) {
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestionIndex] = index;
      setUserAnswers(newAnswers);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (quizSubmitted) return;

    setQuizSubmitted(true);
    let newScore = 0;
    userAnswers.forEach((answer, index) => {
      if (answer !== null && questions[index].options[answer].isCorrect) {
        newScore++;
      }
    });
    setScore(newScore);

    try {
      await roomService.submitAnswers(roomCode, userAnswers);
    } catch (error) {
      console.error('Error submitting answers:', error);
    }
  };

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers[currentQuestionIndex];

  if (quizSubmitted) {
    const participantResults = Object.values(allAnswers).map((entry) => {
      let participantScore = 0;
      const participantAnswers = questions.map((q, idx) => {
        const selectedAnswer = (entry as { answers?: (number | null)[] }).answers?.[idx];
        const isCorrect = selectedAnswer !== null && q.options[selectedAnswer]?.isCorrect;
        if (isCorrect) participantScore++;
        return {
          text: q.options[selectedAnswer]?.text || "No answer",
          isCorrect,
        };
      });

      return {
        username: (entry as { username: string }).username,
        score: participantScore,
        answers: participantAnswers,
      };
    });

    let emotionImage = "";
    const percentage = (score / questions.length) * 100;
    if (percentage >= 0 && percentage < 50) {
      emotionImage = "/assets/Sad.png";
    } else if (percentage >= 50 && percentage < 80) {
      emotionImage = "/assets/Content.png";
    } else if (percentage >= 80 && percentage <= 100) {
      emotionImage = "/assets/Excited.png";
    }

    const userCorrections = questions.map((question, qIndex) => {
      const userAnswer = userAnswers[qIndex];
      return {
        question: question.question,
        explanation: question.explanation || 'No explanation available',
        options: question.options.map((option, oIndex) => {
          const isUserSelection = userAnswer === oIndex;
          const isCorrectAnswer = option.isCorrect;
          return {
            text: option.text,
            isUserSelection,
            isCorrectAnswer,
          };
        }),
      };
    });

    return (
      <div className="relative w-full min-h-screen min-h-[100dvh] flex justify-center items-start bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-6 py-6 overflow-x-hidden animate-fade-in safe-top">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl space-y-4 sm:space-y-6"
        >
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

          <div className="text-center text-xl sm:text-2xl text-white font-bold">
            Your Score: {score}/{questions.length}
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">All Participants</h3>
            <ul className="space-y-2">
              {participantResults.map((p, i) => (
                <li key={i} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-white truncate">{p.username}</span>
                    <span className="text-orange-400 font-bold flex-shrink-0 ml-2">{p.score}/{questions.length}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 sm:space-y-6 mt-4 overflow-auto max-h-[50vh]">
            {userCorrections.map((correction, qIndex) => (
              <div key={qIndex} className="border border-gray-700 rounded-xl p-3 sm:p-4 bg-gray-800/50">
                <h3 className="font-bold text-white mb-2 text-sm sm:text-base">
                  {qIndex + 1}. {correction.question}
                </h3>
                <div className="space-y-2 mb-3">
                  {correction.options.map((option, oIndex) => {
                    let bgColor = "bg-gray-700";
                    if (option.isUserSelection && option.isCorrectAnswer) bgColor = "bg-green-600/70";
                    else if (option.isUserSelection && !option.isCorrectAnswer) bgColor = "bg-red-600/70";
                    else if (option.isCorrectAnswer) bgColor = "bg-green-600/40";

                    return (
                      <div key={oIndex} className={`px-3 py-2 rounded-lg ${bgColor} flex items-center text-sm sm:text-base`}>
                        <span className="flex-1">{option.text}</span>
                        {option.isUserSelection && option.isCorrectAnswer && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 flex-shrink-0 ml-2" />}
                        {option.isUserSelection && !option.isCorrectAnswer && <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-300 flex-shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
                {correction.explanation && (
                  <div className="mt-3 p-3 bg-orange-700/50 rounded-lg">
                    <h4 className="font-semibold text-orange-300 mb-1 text-sm">Explanation:</h4>
                    <p className="text-gray-200 text-xs sm:text-sm">{correction.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2 pb-6">
            <Button onClick={() => navigate('/dashboard')} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl min-h-[44px] text-sm sm:text-base">
              Return to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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
      {/* Timer */}
      <div className="fixed top-4 left-4 z-20 text-orange-500 font-bold text-sm sm:text-lg tracking-wide bg-gray-900/80 px-3 sm:px-4 py-2 rounded-xl border border-orange-500 shadow-lg backdrop-blur-md safe-top">
        ⏱ {formatTime(timeLeft)}
      </div>

      {/* Question counter */}
      <div className="fixed top-4 right-4 z-20 text-white font-bold text-sm sm:text-lg tracking-wide bg-gray-900/80 px-3 sm:px-4 py-2 rounded-xl border border-gray-700 shadow-lg backdrop-blur-md safe-top">
        {currentQuestionIndex + 1}/{questions.length}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl mt-16 sm:mt-20"
      >
        <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in max-h-[calc(100vh-120px)] max-h-[calc(100dvh-120px)] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-4 sm:px-6">
            <motion.h2
              className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-orange-400 leading-tight"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentQuestion.question}
            </motion.h2>
            <div className="space-y-3 sm:space-y-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer === index;
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleSelect(index)}
                    className={`w-full text-left px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl border transition-all duration-300 min-h-[44px] text-sm sm:text-base ${isSelected ? "bg-orange-500/90 border-orange-400 text-white" : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300"}`}
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
              className={`px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1 min-h-[44px] text-sm sm:text-base ${currentQuestionIndex === 0 ? "bg-gray-700 text-gray-400" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
            >
              <ChevronLeft className="h-4 w-4" /><span className="hidden xs:inline">Previous</span><span className="xs:hidden">Prev</span>
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-xl flex items-center gap-2 min-h-[44px] text-sm sm:text-base"
              >
                <Send className='text-white h-4 w-4' />
                Submit
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1 min-h-[44px] text-sm sm:text-base"
              >
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default GroupQuiz;
