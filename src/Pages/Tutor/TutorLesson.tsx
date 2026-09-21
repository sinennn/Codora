import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, BookOpen, Code, Lightbulb, 
  CheckCircle, XCircle, Loader2, Trophy, Zap
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { useUserProgress } from '../../Context/UserProgressContext';
import { generateLesson, saveLessonProgress, type LessonContent } from '../../Services/tutorLessonService';
import { getNimeFeedback } from '../../Services/tutorService';
import { 
  recordLessonInteraction, 
  recordStruggle, 
  recordMastery,
  type LessonInteraction,
  type ExerciseAttemptData 
} from '../../Services/adaptiveLearningService';

export default function TutorLesson() {
  const location = useLocation();
  const navigate = useNavigate();
  const { submitQuizResult, userProgress } = useUserProgress();
  const { topic, category, difficulty, roadmapId, lessonId, fromRoadmap } = location.state || {};
  
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [showExercises, setShowExercises] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [exerciseResults, setExerciseResults] = useState<{ correct: boolean; answered: boolean }[]>([]);
  const [tutorFeedback, setTutorFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  
  // Adaptive learning tracking
  const sectionStartTime = useRef<number>(Date.now());
  const exerciseStartTime = useRef<number>(Date.now());
  const sectionTimes = useRef<number[]>([]);
  const exerciseAttempts = useRef<Map<string, ExerciseAttemptData>>(new Map());
  const sectionsRevisited = useRef<string[]>([]);
  const currentAttemptCount = useRef<number>(0);

  useEffect(() => {
    async function loadLesson() {
      if (!topic || !category || !difficulty) {
        setError('Missing lesson parameters');
        setLoading(false);
        return;
      }
      try {
        // Pass userId for adaptive lesson generation
        const generatedLesson = await generateLesson(
          topic, 
          category, 
          difficulty, 
          undefined, // specificFocus
          fromRoadmap ? roadmapId : undefined,
          fromRoadmap ? lessonId : undefined,
          userProgress?.id // Pass userId for adaptive learning
        );
        setLesson(generatedLesson);
        setExerciseResults(generatedLesson.exercises.map(() => ({ correct: false, answered: false })));
        sectionStartTime.current = Date.now();
      } catch (err) {
        console.error('Error generating lesson:', err);
        setError('Failed to generate lesson. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [topic, category, difficulty, roadmapId, lessonId, fromRoadmap, userProgress?.id]);

  const handleNextSection = () => {
    if (!lesson) return;
    
    // Track time spent on this section
    const timeSpent = Math.round((Date.now() - sectionStartTime.current) / 1000);
    sectionTimes.current.push(timeSpent);
    sectionStartTime.current = Date.now();
    
    if (currentSection < lesson.sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      setShowExercises(true);
      exerciseStartTime.current = Date.now();
    }
  };

  const handlePrevSection = () => {
    if (showExercises) {
      setShowExercises(false);
    } else if (currentSection > 0) {
      // Track that user revisited a previous section (indicates confusion)
      const sectionId = lesson?.sections[currentSection]?.id;
      if (sectionId && !sectionsRevisited.current.includes(sectionId)) {
        sectionsRevisited.current.push(sectionId);
      }
      setCurrentSection(prev => prev - 1);
      sectionStartTime.current = Date.now();
    }
  };

  const handleAnswerSubmit = async () => {
    if (!lesson || selectedAnswer === null) return;
    const exercise = lesson.exercises[currentExercise];
    const isCorrect = selectedAnswer === exercise.correctAnswer || 
                      selectedAnswer.toString() === exercise.correctAnswer.toString();
    
    // Track this attempt for adaptive learning
    currentAttemptCount.current += 1;
    const timeToAnswer = Math.round((Date.now() - exerciseStartTime.current) / 1000);
    
    const existingAttempt = exerciseAttempts.current.get(exercise.id);
    if (existingAttempt) {
      existingAttempt.attempts += 1;
      existingAttempt.correct = isCorrect;
      existingAttempt.userAnswer = selectedAnswer;
      if (isCorrect) {
        existingAttempt.timeToCorrect = timeToAnswer;
      }
    } else {
      exerciseAttempts.current.set(exercise.id, {
        exerciseId: exercise.id,
        attempts: 1,
        timeToFirstAnswer: timeToAnswer,
        timeToCorrect: isCorrect ? timeToAnswer : 0,
        hintsUsed: 0,
        correct: isCorrect,
        userAnswer: selectedAnswer,
      });
    }
    
    // Record struggle if multiple attempts
    if (currentAttemptCount.current >= 3 && userProgress?.id) {
      recordStruggle(userProgress.id, topic, exercise.id, currentAttemptCount.current);
    }
    
    const newResults = [...exerciseResults];
    newResults[currentExercise] = { correct: isCorrect, answered: true };
    setExerciseResults(newResults);
    if (isCorrect) setXpEarned(prev => prev + exercise.xpReward);
    
    try {
      const feedback = await getNimeFeedback({
        question: exercise.question,
        userAnswer: selectedAnswer.toString(),
        correctAnswer: exercise.correctAnswer.toString(),
        topic, difficulty, isCorrect,
      });
      setTutorFeedback(feedback.message);
      setShowFeedback(true);
    } catch (err) {
      console.error('Error getting feedback:', err);
    }
  };

  const handleNextExercise = () => {
    if (!lesson) return;
    setShowFeedback(false);
    setSelectedAnswer(null);
    setTutorFeedback(null);
    currentAttemptCount.current = 0; // Reset for next exercise
    exerciseStartTime.current = Date.now();
    
    if (currentExercise < lesson.exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
    } else {
      handleLessonComplete();
    }
  };

  const handleLessonComplete = async () => {
    if (!lesson || !userProgress) return;
    const correctCount = exerciseResults.filter(r => r.correct).length;
    const totalExercises = lesson.exercises.length;
    
    // Record learning interaction for adaptive learning
    const interaction: LessonInteraction = {
      lessonId: lesson.id,
      sectionTimes: sectionTimes.current,
      exerciseAttempts: Array.from(exerciseAttempts.current.values()),
      hintsRequested: 0, // TODO: track hints
      sectionsRevisited: sectionsRevisited.current,
      completedAt: new Date().toISOString(),
    };
    
    try {
      // Record interaction for adaptive learning
      await recordLessonInteraction(userProgress.id, interaction);
      
      // Record mastery if high accuracy
      if (correctCount / totalExercises >= 0.8) {
        await recordMastery(userProgress.id, topic);
      }
      
      await saveLessonProgress(
        userProgress.id, 
        lesson.id, 
        100, 
        lesson.sections.length, 
        lesson.exercises.map(e => e.id), 
        xpEarned,
        {
          topic,
          title: lesson.title,
          category,
          difficulty,
          totalSections: lesson.sections.length,
          totalExercises: lesson.exercises.length,
        }
      );
      await submitQuizResult({
        topic, category, difficulty,
        totalQuestions: totalExercises,
        correctAnswers: correctCount,
        score: correctCount,
        timeSpent: 0,
        questions: lesson.exercises.map((ex, i) => ({
          question: ex.question,
          userAnswer: exerciseResults[i].correct ? 0 : 1,
          correctAnswer: 0,
          isCorrect: exerciseResults[i].correct,
        })),
        xpEarned: 0
      });
      toast.success(`Lesson Complete! +${xpEarned} XP`);
      navigate('/tutor/complete', { state: { topic, correctCount, totalExercises, xpEarned } });
    } catch (err) {
      console.error('Error completing lesson:', err);
      toast.error('Failed to save progress');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Generating your lesson...</p>
          <p className="text-gray-400 text-sm mt-2">Nime is preparing {topic} content</p>
        </motion.div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-gray-400 mb-4">{error || 'Something went wrong'}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-3 bg-orange-500 text-white rounded-xl">Go Back</button>
        </div>
      </div>
    );
  }

  const currentSectionData = lesson.sections[currentSection];
  const currentExerciseData = lesson.exercises[currentExercise];
  const progress = showExercises 
    ? ((currentExercise + 1) / lesson.exercises.length) * 100
    : ((currentSection + 1) / lesson.sections.length) * 50;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-black via-gray-900 to-black safe-top overflow-x-hidden">
      <div className="px-4 pt-4 pb-28 w-full max-w-lg mx-auto box-border">
        {/* Header */}
        <motion.header className="flex items-center gap-2 mb-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-800/50 text-gray-400 flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-sm font-bold text-white truncate">{lesson.title}</h1>
            <p className="text-xs text-gray-400">{topic} • {difficulty}</p>
          </div>
          <div className="flex items-center gap-1 text-orange-400 flex-shrink-0">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-bold">{xpEarned}</span>
          </div>
        </motion.header>

        {/* Progress */}
        <div className="h-2 bg-gray-800 rounded-full mb-6 overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-orange-500 to-amber-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!showExercises ? (
            <motion.div key={`section-${currentSection}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2 text-orange-400">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium">Section {currentSection + 1} of {lesson.sections.length}</span>
              </div>
              <h2 className="text-lg font-bold text-white break-words">{currentSectionData.title}</h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{currentSectionData.content}</p>

              {currentSectionData.codeExample && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Code className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium">Code Example</span>
                  </div>
                  <div className="rounded-xl overflow-hidden">
                    <SyntaxHighlighter
                      language={currentSectionData.codeExample.language || 'javascript'}
                      style={atomDark}
                      customStyle={{ margin: 0, borderRadius: '0.75rem', fontSize: '0.7rem', padding: '0.75rem', overflowX: 'auto' }}
                      wrapLongLines
                    >
                      {currentSectionData.codeExample.code}
                    </SyntaxHighlighter>
                  </div>
                  <p className="text-gray-400 text-xs mt-2 italic break-words">{currentSectionData.codeExample.explanation}</p>
                </div>
              )}

              {currentSectionData.tips && currentSectionData.tips.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <Lightbulb className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium">Pro Tips</span>
                  </div>
                  <ul className="space-y-1">
                    {currentSectionData.tips.map((tip, i) => (
                      <li key={i} className="text-gray-300 text-xs flex items-start gap-2">
                        <span className="text-orange-400 flex-shrink-0">•</span>
                        <span className="break-words">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key={`exercise-${currentExercise}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Zap className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium">Exercise {currentExercise + 1} of {lesson.exercises.length}</span>
                <span className="ml-auto text-orange-400 text-xs flex-shrink-0">+{currentExerciseData.xpReward} XP</span>
              </div>
              <h2 className="text-sm font-bold text-white break-words">{currentExerciseData.question}</h2>

              {currentExerciseData.codeSnippet && (
                <div className="rounded-xl overflow-hidden">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ margin: 0, borderRadius: '0.75rem', fontSize: '0.7rem', padding: '0.75rem', overflowX: 'auto' }} wrapLongLines>
                    {currentExerciseData.codeSnippet}
                  </SyntaxHighlighter>
                </div>
              )}

              {currentExerciseData.options ? (
                <div className="space-y-2">
                  {currentExerciseData.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => !exerciseResults[currentExercise].answered && setSelectedAnswer(i)}
                      disabled={exerciseResults[currentExercise].answered}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        exerciseResults[currentExercise].answered
                          ? i === currentExerciseData.correctAnswer
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : selectedAnswer === i ? 'bg-red-500/20 border-2 border-red-500' : 'bg-gray-800/30 border border-gray-700/50'
                          : selectedAnswer === i ? 'bg-orange-500/20 border-2 border-orange-500' : 'bg-gray-800/30 border border-gray-700/50'
                      }`}
                    >
                      <span className="text-white text-xs break-words">{option}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={selectedAnswer?.toString() || ''}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={exerciseResults[currentExercise].answered}
                  placeholder="Type your answer..."
                  className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-orange-500/50 min-h-[80px] resize-none"
                />
              )}

              {currentExerciseData.hint && !exerciseResults[currentExercise].answered && (
                <p className="text-gray-500 text-xs italic break-words">💡 Hint: {currentExerciseData.hint}</p>
              )}

              <AnimatePresence>
                {showFeedback && tutorFeedback && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className={`p-3 rounded-xl ${exerciseResults[currentExercise].correct ? 'bg-green-500/10 border border-green-500/30' : 'bg-orange-500/10 border border-orange-500/30'}`}>
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-sm flex-shrink-0">🦊</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-orange-400 mb-1">Nime</p>
                        <p className="text-gray-300 text-xs break-words">{tutorFeedback}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={handlePrevSection} disabled={currentSection === 0 && !showExercises} className="p-3 rounded-xl bg-gray-800/50 text-gray-400 disabled:opacity-50 flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!showExercises ? (
            <button onClick={handleNextSection} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
              {currentSection < lesson.sections.length - 1 ? <>Continue <ChevronRight className="w-5 h-5" /></> : <>Start Exercises <Zap className="w-5 h-5" /></>}
            </button>
          ) : !exerciseResults[currentExercise].answered ? (
            <button onClick={handleAnswerSubmit} disabled={selectedAnswer === null} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-5 h-5" /> Submit
            </button>
          ) : (
            <button onClick={handleNextExercise} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
              {currentExercise < lesson.exercises.length - 1 ? <>Next <ChevronRight className="w-5 h-5" /></> : <>Complete <Trophy className="w-5 h-5" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
