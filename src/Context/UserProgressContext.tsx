import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { UserProgress, SkillProgress } from '../Types/user';
import {
  getOrCreateUserProgress,
  getUserProgress,
  checkStreakStatus,
  saveQuizResult,
  updateSkillProgress,
  getUserRank,
  cacheUserProgress,
  getCachedUserProgress,
  clearCachedProgress,
  type QuizResult,
} from '../Services/userProgressService';
import { toast } from 'sonner';

interface UserProgressContextType {
  userProgress: UserProgress | null;
  loading: boolean;
  error: string | null;
  rank: number;
  xpToClimb: number;
  
  refreshProgress: () => Promise<void>;
  submitQuizResult: (result: Omit<QuizResult, 'id' | 'userId' | 'completedAt'>) => Promise<{
    xpEarned: number;
    leveledUp: boolean;
    newAchievements: string[];
  }>;
  updateSkill: (
    skillName: string,
    category: 'language' | 'framework' | 'concept',
    questionsAnswered: number,
    correctAnswers: number
  ) => Promise<SkillProgress>;
  
  isPracticedToday: boolean;
  dailyGoalComplete: boolean;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

interface UserProgressProviderProps {
  children: ReactNode;
}

export function UserProgressProvider({ children }: UserProgressProviderProps) {
  const { currentUser } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState(0);
  const [xpToClimb, setXpToClimb] = useState(0);

  useEffect(() => {
    async function loadProgress() {
      if (!currentUser) {
        setUserProgress(null);
        setLoading(false);
        clearCachedProgress();
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const cached = getCachedUserProgress();
        if (cached && cached.id === currentUser.uid) {
          setUserProgress(cached);
        }

        const progress = await getOrCreateUserProgress(
          currentUser.uid,
          currentUser.displayName || 'Developer',
          currentUser.email || '',
          currentUser.photoURL || undefined
        );

        const streakStatus = await checkStreakStatus(currentUser.uid);
        if (!streakStatus.streakActive && progress.currentStreak > 0) {
          progress.currentStreak = streakStatus.currentStreak;
        }

        setUserProgress(progress);
        cacheUserProgress(progress);

        const rankData = await getUserRank(currentUser.uid);
        setRank(rankData.rank);
        setXpToClimb(rankData.xpToClimb);
      } catch (err) {
        console.error('Error loading user progress:', err);
        setError('Failed to load progress');
        
        const cached = getCachedUserProgress();
        if (cached) {
          setUserProgress(cached);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, [currentUser]);

  const refreshProgress = useCallback(async () => {
    if (!currentUser) return;

    try {
      const progress = await getUserProgress(currentUser.uid);
      if (progress) {
        setUserProgress(progress);
        cacheUserProgress(progress);
      }

      const rankData = await getUserRank(currentUser.uid);
      setRank(rankData.rank);
      setXpToClimb(rankData.xpToClimb);
    } catch (err) {
      console.error('Error refreshing progress:', err);
    }
  }, [currentUser]);

  const submitQuizResult = useCallback(async (
    result: Omit<QuizResult, 'id' | 'userId' | 'completedAt'>
  ) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const quizResult = await saveQuizResult(currentUser.uid, result);

      if (quizResult.leveledUp) {
        toast.success('🎉 Level Up!', {
          description: 'Congratulations on reaching a new level!',
        });
      }

      if (quizResult.newAchievements.length > 0) {
        quizResult.newAchievements.forEach(achievement => {
          toast.success('🏆 Achievement Unlocked!', {
            description: achievement,
          });
        });
      }

      await refreshProgress();

      return quizResult;
    } catch (err) {
      console.error('Error submitting quiz result:', err);
      throw err;
    }
  }, [currentUser, refreshProgress]);

  const updateSkill = useCallback(async (
    skillName: string,
    category: 'language' | 'framework' | 'concept',
    questionsAnswered: number,
    correctAnswers: number
  ) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const skill = await updateSkillProgress(
        currentUser.uid,
        skillName,
        category,
        questionsAnswered,
        correctAnswers
      );

      await refreshProgress();
      return skill;
    } catch (err) {
      console.error('Error updating skill:', err);
      throw err;
    }
  }, [currentUser, refreshProgress]);

  const isPracticedToday = userProgress?.lastActiveDate === new Date().toISOString().split('T')[0];
  const dailyGoalComplete = (userProgress?.dailyProgress || 0) >= (userProgress?.dailyGoal || 50);

  const value: UserProgressContextType = {
    userProgress,
    loading,
    error,
    rank,
    xpToClimb,
    refreshProgress,
    submitQuizResult,
    updateSkill,
    isPracticedToday,
    dailyGoalComplete,
  };

  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const context = useContext(UserProgressContext);
  if (context === undefined) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
}