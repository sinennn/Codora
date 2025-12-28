// ============================================
// HOME PAGE - Main Dashboard
// Now integrated with Firebase for real user data
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { auth } from '../../../firebase';
import { Loader2 } from 'lucide-react';

import {
  XPRing,
  StreakBadge,
  DailyGoalBar,
  TutorMessage,
  ContinueLearningCard,
  LeaderboardTeaser,
  QuickActions,
} from '../../components/Home';
import FooterNav from '../DashBoard/Footer';
import { calculateLevel } from '../../Types/user';
import { useUserProgress } from '../../Context/UserProgressContext';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [tutorIndex, setTutorIndex] = useState(0);
  
  // Get real user progress from context
  const { userProgress, loading, rank, xpToClimb, isPracticedToday } = useUserProgress();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Dynamic tutor messages based on user progress
  const getTutorMessages = () => {
    if (!userProgress) {
      return [
        { tutor: 'nime' as const, message: "Welcome! Ready to start your coding journey?" },
        { tutor: 'nesto' as const, message: "Let's get started. Pick a topic and begin!" },
      ];
    }

    const messages: { tutor: 'nime' | 'nesto'; message: string }[] = [];
    
    // Nime messages (encouraging)
    if (!isPracticedToday) {
      messages.push({ tutor: 'nime', message: "Hey! You haven't practiced today yet. Let's keep that streak going! 🔥" });
    } else if (userProgress.dailyProgress >= userProgress.dailyGoal) {
      messages.push({ tutor: 'nime', message: "Amazing! You've hit your daily goal! Want to go for extra credit? 🌟" });
    } else {
      const remaining = userProgress.dailyGoal - userProgress.dailyProgress;
      messages.push({ tutor: 'nime', message: `You're doing great! Just ${remaining} more XP to hit your daily goal. You got this! 💪` });
    }

    // Nesto messages (competitive)
    if (userProgress.currentStreak > 0) {
      messages.push({ tutor: 'nesto', message: `${userProgress.currentStreak}-day streak. ${userProgress.currentStreak >= 7 ? "Impressive. Keep dominating." : "Don't break it now. Push for 7."}` });
    }
    
    if (userProgress.weakTopics.length > 0) {
      messages.push({ tutor: 'nesto', message: `I noticed ${userProgress.weakTopics[0]} needs work. Time to level up that skill.` });
    }

    if (rank > 0 && xpToClimb > 0) {
      messages.push({ tutor: 'nesto', message: `You're rank #${rank}. Just ${xpToClimb} XP to climb. Let's go.` });
    }

    return messages.length > 0 ? messages : [
      { tutor: 'nime' as const, message: "Ready to learn something new today?" },
      { tutor: 'nesto' as const, message: "Time to sharpen those skills. Let's go." },
    ];
  };

  const tutorMessages = getTutorMessages();

  // Rotate tutor messages
  useEffect(() => {
    const interval = setInterval(() => {
      setTutorIndex(prev => (prev + 1) % tutorMessages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [tutorMessages.length]);

  const levelInfo = calculateLevel(userProgress?.xp || 0);
  const firstName = user?.displayName?.split(' ')[0] || 'Developer';
  const currentTutor = tutorMessages[tutorIndex];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Get continue learning data from user's skills
  const getContinueLearning = () => {
    if (!userProgress || userProgress.skills.length === 0) {
      return {
        topic: 'JavaScript',
        lessonName: 'Start Your Journey',
        progress: 0,
        xpReward: 25,
      };
    }

    // Find the most recently practiced skill
    const sortedSkills = [...userProgress.skills].sort((a, b) => {
      const dateA = a.lastPracticed ? new Date(a.lastPracticed).getTime() : 0;
      const dateB = b.lastPracticed ? new Date(b.lastPracticed).getTime() : 0;
      return dateB - dateA;
    });

    const recentSkill = sortedSkills[0];
    const progress = Math.min((recentSkill.completedLessons / Math.max(recentSkill.totalLessons, 1)) * 100, 100);

    return {
      topic: recentSkill.name,
      lessonName: `Continue ${recentSkill.name}`,
      progress: Math.round(progress),
      xpReward: 25,
    };
  };

  const continueLesson = getContinueLearning();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your progress...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-black via-gray-900 to-black safe-top">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-orange-700/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 px-4 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-32 max-w-lg mx-auto w-full">
        {/* Header */}
        <motion.header
          className="flex items-center justify-between mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs sm:text-sm">{getGreeting()}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{firstName}</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <StreakBadge 
              streak={userProgress?.currentStreak || 0} 
              isActive={isPracticedToday}
              size="sm" 
            />
            <motion.button
              onClick={() => navigate('/profile')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="touch-target flex items-center justify-center"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-orange-500 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/navuser.png';
                  }}
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-700 rounded-full flex items-center justify-center text-orange-400 font-bold border-2 border-orange-500 text-sm sm:text-base">
                  {firstName[0]}
                </div>
              )}
            </motion.button>
          </div>
        </motion.header>

        {/* XP Ring + Daily Goal */}
        <motion.section
          className="flex flex-col xs:flex-row items-center gap-4 sm:gap-6 mb-4 sm:mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <XPRing
            progress={levelInfo.progress}
            level={levelInfo.level}
            title={levelInfo.title}
            xpToNext={levelInfo.xpToNext}
            size="md"
          />
          <div className="flex-1 w-full xs:w-auto">
            <DailyGoalBar
              current={userProgress?.dailyProgress || 0}
              goal={userProgress?.dailyGoal || 50}
            />
          </div>
        </motion.section>

        {/* Continue Learning CTA */}
        <motion.section
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ContinueLearningCard
            topic={continueLesson.topic}
            lessonName={continueLesson.lessonName}
            progress={continueLesson.progress}
            xpReward={continueLesson.xpReward}
            onContinue={() => navigate('/tutor')}
          />
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickActions
            onLearn={() => navigate('/tutor')}
            onPractice={() => navigate('/SoloSetting')}
            onCompete={() => navigate('/GroupQuiz')}
            onLeaderboard={() => navigate('/leaderboard')}
          />
        </motion.section>

        {/* AI Tutor Message */}
        <motion.section
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TutorMessage
            tutor={currentTutor.tutor}
            message={currentTutor.message}
            onTap={() => navigate('/tutor')}
          />
        </motion.section>

        {/* Leaderboard Teaser */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <LeaderboardTeaser
            rank={rank || 0}
            xpToClimb={xpToClimb || 0}
            nextUser="Challenger"
            onTap={() => navigate('/leaderboard')}
          />
        </motion.section>
      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  );
}
