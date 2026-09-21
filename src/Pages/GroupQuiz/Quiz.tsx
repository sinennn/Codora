import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Users, CheckCircle } from 'lucide-react';
import roomService from '../../Services/Rooms';
import { toast } from 'sonner';

export default function GroupQuiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, roomData } = location.state || {};

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(roomData?.quizTime || 60);
  const [submitted, setSubmitted] = useState(false);
  const [otherSubmissions, setOtherSubmissions] = useState<number>(0);

  const questions = roomData?.questions || [];

  useEffect(() => {
    if (!roomCode || !roomData) {
      navigate('/quiz/group');
      return;
    }

    // Listen for other submissions
    const unsubscribe = roomService.listenForAnswers(roomCode, (allAnswers) => {
      setOtherSubmissions(Object.keys(allAnswers).length);
    });

    return () => unsubscribe();
  }, [roomCode, roomData, navigate]);

  // Timer
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, timeLeft]);

  const handleAnswer = (answerIndex: number) => {
    if (submitted) return;
    setSelectedAnswer(answerIndex);
    setAnswers((prev) => ({ ...prev, [currentQuestion]: answerIndex }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(answers[currentQuestion + 1] ?? null);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(answers[currentQuestion - 1] ?? null);
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);

    try {
      await roomService.submitAnswers(roomCode, answers);
      toast.success('Answers submitted!');
      
      // Navigate to results after a short delay
      setTimeout(() => {
        navigate('/quiz/group/results', { 
          state: { roomCode, roomData, answers } 
        });
      }, 2000);
    } catch (error) {
      toast.error('Failed to submit answers');
      setSubmitted(false);
    }
  };

  const question = questions[currentQuestion];
  if (!question) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-gray-400">
          <Users className="w-4 h-4" />
          <span className="text-sm">{otherSubmissions} submitted</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          timeLeft < 30 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-white'
        }`}>
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {questions.map((_: any, i: number) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              answers[i] !== undefined
                ? 'bg-orange-500'
                : i === currentQuestion
                ? 'bg-gray-600'
                : 'bg-gray-800'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <p className="text-gray-400 text-sm mb-2">
          Question {currentQuestion + 1} of {questions.length}
        </p>
        <h2 className="text-xl font-semibold text-white">{question.question}</h2>
      </motion.div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {question.options?.map((option: string, index: number) => (
          <motion.button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={submitted}
            className={`w-full p-4 rounded-xl text-left transition-all ${
              selectedAnswer === index
                ? 'bg-orange-500/20 border-2 border-orange-500 text-white'
                : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-gray-600'
            } ${submitted ? 'opacity-50' : ''}`}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm ${
                selectedAnswer === index
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-gray-600'
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          className="flex-1 py-3 bg-gray-800 text-white rounded-xl disabled:opacity-50"
        >
          Previous
        </button>
        
        {currentQuestion === questions.length - 1 ? (
          <motion.button
            onClick={handleSubmit}
            disabled={submitted}
            className="flex-1 py-3 bg-orange-600 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
          >
            {submitted ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Submitted
              </>
            ) : (
              'Submit'
            )}
          </motion.button>
        ) : (
          <button
            onClick={nextQuestion}
            className="flex-1 py-3 bg-orange-600 text-white rounded-xl"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
