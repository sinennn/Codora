import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import roomService from '../../Services/Rooms';

export default function GroupQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  if (!state || !state.roomCode || !state.questions) {
    return (
      <div className="text-white text-center py-8">
        <h2 className="text-2xl font-bold mb-4">No quiz data available</h2>
        <p className="text-gray-400">Please join or create a quiz room.</p>
      </div>
    );
  }
  const { roomCode, questions, quizTime } = state;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quizTime);
  const [allAnswers, setAllAnswers] = useState({});
  useEffect(() => {
    if (quizSubmitted || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, quizSubmitted]);
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
    await roomService.submitAnswers(roomCode, userAnswers);
  };
  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers[currentQuestionIndex];
  if (quizSubmitted) {
    // Gather all participant results
    const participantResults = Object.values(allAnswers).map((entry) => {
      let participantScore = 0;
      questions.forEach((q, idx) => {
        if ((entry as { answers?: (number | null)[] }).answers?.[idx] !== null && 
            q.options[(entry as { answers?: (number | null)[] }).answers?.[idx] as number]?.isCorrect) {
          participantScore++;
        }
      });
      return { 
        username: (entry as { username: string }).username, 
        score: participantScore, 
        answers: (entry as { answers: (number | null)[] }).answers 
      };
    });
    return (
      <div className="relative w-full h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-8 overflow-hidden animate-fade-in">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-xl">
          <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
            <CardContent className="space-y-6 pt-6 px-6">
              <motion.h2 className="text-3xl font-bold text-center text-orange-400" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>Quiz Results</motion.h2>
              <div className="text-center text-2xl text-white font-bold">Your Score: {score}/{questions.length}</div>
              <div className="mt-6">
                <h3 className="text-xl font-bold text-white mb-2">All Participants</h3>
                <ul className="space-y-2">
                  {participantResults.map((p, i) => (
                    <li key={i} className="bg-gray-800 rounded-lg p-3 flex justify-between">
                      <span className="text-white">{p.username}</span>
                      <span className="text-orange-400 font-bold">{p.score}/{questions.length}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pt-4 pb-6">
              <Button onClick={() => navigate('/dashboard')} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl">Return to Dashboard</Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }
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
      <div className="absolute top-6 left-6 text-orange-500 font-bold text-xl tracking-wide bg-gray-900/60 px-4 py-2 rounded-xl border border-orange-500 shadow-lg backdrop-blur-md">⏱ {formatTime(timeLeft)}</div>
      <div className="absolute top-6 right-6 text-white font-bold text-xl tracking-wide bg-gray-900/60 px-4 py-2 rounded-xl border border-gray-700 shadow-lg backdrop-blur-md">Question {currentQuestionIndex + 1}/{questions.length}</div>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-xl">
        <Card className="w-full border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl animate-scale-in">
          <CardContent className="space-y-6 pt-6 px-6">
            <motion.h2 className="text-3xl font-bold text-center text-orange-400" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>{currentQuestion.question}</motion.h2>
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer === index;
                return (
                  <motion.button key={index} onClick={() => handleSelect(index)} className={`w-full text-left px-5 py-3 rounded-xl border transition-all duration-300 ${isSelected ? "bg-orange-500/90 border-orange-400 text-white" : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300"}`} whileTap={{ scale: 0.97 }}>{option.text}</motion.button>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4 pb-6 px-6">
            <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0} className={`px-4 py-2 rounded-xl flex items-center gap-1 ${currentQuestionIndex === 0 ? "bg-gray-700 text-gray-400" : "bg-gray-800 hover:bg-gray-700 text-white"}`}>Previous</Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmitQuiz} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl flex items-center gap-2">Submit Quiz</Button>
            ) : (
              <Button onClick={handleNextQuestion} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-1">Next</Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}