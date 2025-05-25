import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { firestore } from "../../../firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

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

  const { roomCode, isHost, username,  questions, quizTime } = state;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quizTime);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [participantScores, setParticipantScores] = useState([]);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || quizSubmitted) return;
    
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, quizSubmitted]);
  
  // Listen for other participants' answers if host
  useEffect(() => {
    if (!isHost || !roomCode) return;
    
    const unsubscribe = onSnapshot(
      collection(doc(firestore, "rooms", roomCode), "answers"),
      (snapshot) => {
        // Process answers and update scores
        const scores = {};
        
        snapshot.docs.forEach(doc => {
          const answerData = doc.data();
          const userId = answerData.userId;
          const username = answerData.username;
          const answers = answerData.answers;
          const userScore = calculateScore(answers, questions);
          
          scores[userId] = { username, score: userScore };
        });
        
        // Convert to array for display
        const scoresArray = Object.keys(scores).map(userId => ({
          userId,
          username: scores[userId].username,
          score: scores[userId].score
        }));
        
        setParticipantScores(scoresArray);
      }
    );
    
    return () => unsubscribe();
  }, [roomCode, isHost, questions]);
  
  const calculateScore = (answers, questions) => {
    let score = 0;
    
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const correctAnswerIndex = question.options.findIndex(opt => opt.isCorrect);
      
      if (userAnswer === correctAnswerIndex) {
        score += 1;
      }
    });
    
    return score;
  };
  
  const handleSelectAnswer = (optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmitQuiz = async () => {
    // Calculate score
    const userScore = calculateScore(userAnswers, questions);
    setScore(userScore);
    setQuizSubmitted(true);
    
    // Submit answers to Firebase
    try {
      await addDoc(collection(doc(firestore, "rooms", roomCode), "answers"), {
        userId: auth.currentUser ? auth.currentUser.uid : "anonymous",
        username,
        answers: userAnswers,
        submittedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error submitting answers:", error);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (quizSubmitted) {
    return (
      <div className="relative w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-8 py-12 overflow-hidden">
        <Card className="w-full max-w-xl border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl">
          <CardContent className="space-y-6 pt-6 px-6">
            <h2 className="text-3xl font-bold text-center text-orange-400">Quiz Complete!</h2>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-white">Your Score: {score}/{questions.length}</p>
              <p className="text-gray-400 mt-2">Thank you for participating!</p>
            </div>
            
            {isHost && participantScores.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4">Participant Scores</h3>
                <ul className="space-y-2">
                  {participantScores.map(participant => (
                    <li key={participant.userId} className="bg-gray-800 rounded-lg p-3 flex justify-between">
                      <span className="text-white">{participant.username}</span>
                      <span className="text-orange-400 font-bold">{participant.score}/{questions.length}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-6"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="relative w-full min-h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-4 sm:px-8 py-12 overflow-hidden">
      <Card className="w-full max-w-xl border border-gray-700 bg-[#131924]/90 backdrop-blur-xl shadow-xl rounded-2xl">
        <CardContent className="space-y-6 pt-6 px-6">
          <div className="flex justify-between items-center">
            <span className="text-orange-400 font-bold">Question {currentQuestionIndex + 1}/{questions.length}</span>
            <span className="text-white bg-gray-800 px-3 py-1 rounded-full">{formatTime(timeLeft)}</span>
          </div>
          
          <h2 className="text-xl font-bold text-white">{currentQuestion.question}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div 
                key={index}
                onClick={() => handleSelectAnswer(index)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  userAnswers[currentQuestionIndex] === index 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {option.text}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="border-gray-700 text-gray-300"
            >
              Previous
            </Button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <Button 
                onClick={handleSubmitQuiz}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button 
                onClick={handleNextQuestion}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { auth } from '../../../firebase'