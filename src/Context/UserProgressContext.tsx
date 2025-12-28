// ============================================
// USER PROGRESS CONTEXT
// Global state management for user progress, XP, streaks, achievements
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { UserProgress, SkillProgress, Achievement } from '../Types/user';
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

// ============================================
// TYPES
// ============================================

interface UserProgressContextType {
  // State
  userProgress: UserProgress | null;
  loading: boolean;
  error: string | null;
  rank: number;
  xpToClimb: number;
  
  // Actions
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
  
  // Computed
  isPracticedToday: boolean;
  dailyGoalComplete: boolean;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

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

  // Load user progress on auth change
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
        // Try cache first for faster load
        const cached = getCachedUserProgress();
        if (cached && cached.id === currentUser.uid) {
          setUserProgress(cached);
        }

        // Fetch fresh data
        const progress = await getOrCreateUserProgress(
          currentUser.uid,
          currentUser.displayName || 'Developer',
          currentUser.email || '',
          currentUser.photoURL || undefined
        );

        // Check streak status
        const streakStatus = await checkStreakStatus(currentUser.uid);
        if (!streakStatus.streakActive && progress.currentStreak > 0) {
          progress.currentStreak = streakStatus.currentStreak;
        }

        setUserProgress(progress);
        cacheUserProgress(progress);

        // Get rank
        const rankData = await getUserRank(currentUser.uid);
        setRank(rankData.rank);
        setXpToClimb(rankData.xpToClimb);
      } catch (err) {
        console.error('Error loading user progress:', err);
        setError('Failed to load progress');
        
        // Fall back to cache
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

  // Refresh progress
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

  // Submit quiz result
  const submitQuizResult = useCallback(async (
    result: Omit<QuizResult, 'id' | 'userId' | 'completedAt'>
  ) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const quizResult = await saveQuizResult(currentUser.uid, result);

      // Show notifications
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

      // Refresh progress
      await refreshProgress();

      return quizResult;
    } catch (err) {
      console.error('Error submitting quiz result:', err);
      throw err;
    }
  }, [currentUser, refreshProgress]);

  // Update skill
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

  // Computed values
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

// ============================================
// HOOK
// ============================================

export function useUserProgress() {
  const context = useContext(UserProgressContext);
  if (context === undefined) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
}
