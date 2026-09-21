import { db } from '../../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import type { UserProgress, SkillProgress, Achievement } from '../Types/user';
import { calculateLevel } from '../Types/user';

export interface QuizResult {
  id: string;
  userId: string;
  topic: string;
  category: 'field' | 'technology';
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  xpEarned: number;
  questions: {
    question: string;
    userAnswer: string | number;
    correctAnswer: string | number;
    isCorrect: boolean;
  }[];
  completedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
  change?: 'up' | 'down' | 'same';
}

const COLLECTIONS = {
  USERS: 'userProgress',
  SCORES: 'userScores',
  QUIZZES: 'quizResults',
  ACHIEVEMENTS: 'achievements',
} as const;

const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'isUnlocked' | 'progress'>[] = [
  { id: 'first_quiz', name: 'First Steps', description: 'Complete your first quiz', icon: '🎯' },
  { id: 'streak_3', name: 'Getting Started', description: '3-day streak', icon: '🔥' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '⚡' },
  { id: 'streak_30', name: 'Unstoppable', description: '30-day streak', icon: '💪' },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🌟' },
  { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐' },
  { id: 'level_10', name: 'Legend', description: 'Reach level 10', icon: '👑' },
  { id: 'questions_50', name: 'Curious Mind', description: 'Answer 50 questions', icon: '🧠' },
  { id: 'questions_100', name: 'Knowledge Seeker', description: 'Answer 100 questions', icon: '📚' },
  { id: 'questions_500', name: 'Master Scholar', description: 'Answer 500 questions', icon: '🎓' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete a quiz in under 2 minutes', icon: '⚡' },
  { id: 'comeback', name: 'Comeback Kid', description: 'Improve your score by 50%', icon: '🦸' },
];

export async function getOrCreateUserProgress(
  userId: string,
  username: string,
  email: string,
  photoURL?: string
): Promise<UserProgress> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      return snapshot.data() as UserProgress;
    }

    const now = new Date().toISOString();
    const newProgress: UserProgress = {
      id: userId,
      username,
      email,
      photoURL,
      xp: 0,
      level: 1,
      levelTitle: 'Novice',
      xpToNextLevel: 100,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: now.split('T')[0],
      dailyGoal: 50,
      dailyProgress: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      totalTimeSpent: 0,
      skills: [],
      weakTopics: [],
      achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a, isUnlocked: false })),
      preferredTutor: 'both',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, newProgress);
    return newProgress;
  } catch (error) {
    console.error('Error creating user progress:', error);
    throw error;
  }
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? (snapshot.data() as UserProgress) : null;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
}

export async function checkStreakStatus(userId: string): Promise<{
  streakActive: boolean;
  currentStreak: number;
  practicedToday: boolean;
}> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return { streakActive: false, currentStreak: 0, practicedToday: false };
    }

    const data = snapshot.data() as UserProgress;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastActive = data.lastActiveDate;

    const practicedToday = lastActive === today;
    const practicedYesterday = lastActive === yesterday;

    if (practicedToday) {
      return { streakActive: true, currentStreak: data.currentStreak, practicedToday: true };
    }

    if (practicedYesterday) {
      return { streakActive: true, currentStreak: data.currentStreak, practicedToday: false };
    }

    return { streakActive: false, currentStreak: 0, practicedToday: false };
  } catch (error) {
    console.error('Error checking streak:', error);
    return { streakActive: false, currentStreak: 0, practicedToday: false };
  }
}

export async function addXP(userId: string, xpAmount: number): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const scoreRef = doc(db, COLLECTIONS.SCORES, userId);

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) return;

      const userData = userDoc.data() as UserProgress;
      const newXp = userData.xp + xpAmount;
      const levelInfo = calculateLevel(newXp);

      transaction.update(userRef, {
        xp: newXp,
        level: levelInfo.level,
        levelTitle: levelInfo.title,
        xpToNextLevel: levelInfo.xpToNext,
        updatedAt: new Date().toISOString(),
      });

      transaction.set(scoreRef, {
        totalScore: newXp,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
  } catch (error) {
    console.error('Error adding XP:', error);
  }
}

export async function saveQuizResult(
  userId: string,
  result: Omit<QuizResult, 'id' | 'userId' | 'completedAt'>
): Promise<{
  xpEarned: number;
  leveledUp: boolean;
  newAchievements: string[];
}> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const scoreRef = doc(db, COLLECTIONS.SCORES, userId);
    const quizRef = doc(collection(db, COLLECTIONS.QUIZZES));

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    return await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User progress not found');
      }

      const userData = userDoc.data() as UserProgress;
      const newAchievements: string[] = [];

      const percentage = (result.correctAnswers / result.totalQuestions) * 100;
      const baseXp = result.totalQuestions * 10;
      const xpMultiplier = percentage >= 80 ? 1.5 : percentage >= 50 ? 1.0 : 0.5;
      const xpEarned = Math.round(baseXp * xpMultiplier);

      const newXp = userData.xp + xpEarned;
      const oldLevel = userData.level;
      const levelInfo = calculateLevel(newXp);
      const leveledUp = levelInfo.level > oldLevel;

      const newTotalQuestions = userData.totalQuestions + result.totalQuestions;
      const newCorrectAnswers = userData.correctAnswers + result.correctAnswers;
      const newAccuracy = Math.round((newCorrectAnswers / newTotalQuestions) * 100);

      const lastActive = userData.lastActiveDate;
      let newStreak = userData.currentStreak;
      if (lastActive === yesterday) {
        newStreak += 1;
      } else if (lastActive !== today) {
        newStreak = 1;
      }

      const newLongestStreak = Math.max(userData.longestStreak, newStreak);
      const newDailyProgress = lastActive === today ? userData.dailyProgress + xpEarned : xpEarned;

      const updatedAchievements = userData.achievements.map((achievement) => {
        if (achievement.isUnlocked) return achievement;

        let shouldUnlock = false;

        switch (achievement.id) {
          case 'first_quiz':
            shouldUnlock = true;
            break;
          case 'streak_3':
            shouldUnlock = newStreak >= 3;
            break;
          case 'streak_7':
            shouldUnlock = newStreak >= 7;
            break;
          case 'streak_30':
            shouldUnlock = newStreak >= 30;
            break;
          case 'perfect_score':
            shouldUnlock = percentage === 100;
            break;
          case 'level_5':
            shouldUnlock = levelInfo.level >= 5;
            break;
          case 'level_10':
            shouldUnlock = levelInfo.level >= 10;
            break;
          case 'questions_50':
            shouldUnlock = newTotalQuestions >= 50;
            break;
          case 'questions_100':
            shouldUnlock = newTotalQuestions >= 100;
            break;
          case 'questions_500':
            shouldUnlock = newTotalQuestions >= 500;
            break;
          case 'speed_demon':
            shouldUnlock = result.timeSpent > 0 && result.timeSpent < 120;
            break;
        }

        if (shouldUnlock) {
          newAchievements.push(achievement.name);
          return { ...achievement, isUnlocked: true, unlockedAt: now.toISOString() };
        }

        return achievement;
      });

      const weakTopics = calculateWeakTopics(userData.skills, result);

      transaction.update(userRef, {
        xp: newXp,
        level: levelInfo.level,
        levelTitle: levelInfo.title,
        xpToNextLevel: levelInfo.xpToNext,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: today,
        dailyProgress: newDailyProgress,
        totalQuestions: newTotalQuestions,
        correctAnswers: newCorrectAnswers,
        accuracy: newAccuracy,
        totalTimeSpent: userData.totalTimeSpent + (result.timeSpent || 0),
        weakTopics,
        achievements: updatedAchievements,
        updatedAt: now.toISOString(),
      });

      transaction.set(scoreRef, {
        totalScore: newXp,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const quizResult: QuizResult = {
        ...result,
        id: quizRef.id,
        userId,
        completedAt: now.toISOString(),
      };
      transaction.set(quizRef, quizResult);

      return { xpEarned, leveledUp, newAchievements };
    });
  } catch (error) {
    console.error('Error saving quiz result:', error);
    throw error;
  }
}

function calculateWeakTopics(skills: SkillProgress[], result: Omit<QuizResult, 'id' | 'userId' | 'completedAt'>): string[] {
  const weakTopics: string[] = [];
  const percentage = (result.correctAnswers / result.totalQuestions) * 100;

  if (percentage < 60) {
    weakTopics.push(result.topic);
  }

  skills.forEach((skill) => {
    if (skill.accuracy < 50) {
      weakTopics.push(skill.name);
    }
  });

  return weakTopics.slice(0, 5);
}

export async function updateSkillProgress(
  userId: string,
  skillName: string,
  category: 'language' | 'framework' | 'concept',
  questionsAnswered: number,
  correctAnswers: number
): Promise<SkillProgress> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    const userData = snapshot.data() as UserProgress;
    const existingSkillIndex = userData.skills.findIndex(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    );

    let updatedSkill: SkillProgress;

    if (existingSkillIndex >= 0) {
      const existing = userData.skills[existingSkillIndex];
      const newTotal = existing.totalLessons + questionsAnswered;
      const newCorrect = (existing.accuracy / 100) * existing.totalLessons + correctAnswers;
      const newAccuracy = Math.round((newCorrect / newTotal) * 100);

      updatedSkill = {
        ...existing,
        totalLessons: newTotal,
        completedLessons: existing.completedLessons + correctAnswers,
        accuracy: newAccuracy,
        level: calculateSkillLevel(newAccuracy),
        lastPracticed: new Date().toISOString(),
      };

      userData.skills[existingSkillIndex] = updatedSkill;
    } else {
      const accuracy = Math.round((correctAnswers / questionsAnswered) * 100);
      updatedSkill = {
        skillId: `${userId}_${skillName.toLowerCase().replace(/\s+/g, '_')}`,
        name: skillName,
        category,
        level: calculateSkillLevel(accuracy),
        xp: 0,
        totalLessons: questionsAnswered,
        completedLessons: correctAnswers,
        accuracy,
        lastPracticed: new Date().toISOString(),
      };

      userData.skills.push(updatedSkill);
    }

    await updateDoc(userRef, {
      skills: userData.skills,
      updatedAt: new Date().toISOString(),
    });

    return updatedSkill;
  } catch (error) {
    console.error('Error updating skill:', error);
    throw error;
  }
}

function calculateSkillLevel(accuracy: number): number {
  if (accuracy >= 90) return 5;
  if (accuracy >= 75) return 4;
  if (accuracy >= 60) return 3;
  if (accuracy >= 40) return 2;
  return 1;
}

export async function getUserRank(userId: string): Promise<{ rank: number; xpToClimb: number }> {
  try {
    const scoreRef = doc(db, COLLECTIONS.SCORES, userId);
    const scoreDoc = await getDoc(scoreRef);

    if (!scoreDoc.exists()) {
      return { rank: 0, xpToClimb: 0 };
    }

    const userScore = scoreDoc.data().totalScore || 0;

    const scoresRef = collection(db, COLLECTIONS.SCORES);
    const q = query(scoresRef, orderBy('totalScore', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    let rank = 1;
    let nextScore = 0;

    snapshot.docs.forEach((doc, index) => {
      const score = doc.data().totalScore || 0;
      if (score > userScore) {
        rank = index + 2;
      }
      if (rank === 1 && index === 0) {
        nextScore = score;
      }
    });

    const xpToClimb = rank > 1 ? nextScore - userScore : 0;

    return { rank, xpToClimb };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { rank: 0, xpToClimb: 0 };
  }
}

export async function getTopScores(limitCount: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const scoresRef = collection(db, COLLECTIONS.SCORES);
    const q = query(scoresRef, orderBy('totalScore', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    const entries: LeaderboardEntry[] = [];

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        name: data.displayName || data.username || 'Anonymous',
        score: data.totalScore || 0,
        rank: index + 1,
      });
    });

    return entries;
  } catch (error) {
    console.error('Error getting top scores:', error);
    return [];
  }
}

export async function getUserScore(userId: string): Promise<{ totalScore: number } | null> {
  try {
    const scoreRef = doc(db, COLLECTIONS.SCORES, userId);
    const snapshot = await getDoc(scoreRef);
    return snapshot.exists() ? { totalScore: snapshot.data().totalScore || 0 } : null;
  } catch (error) {
    console.error('Error getting user score:', error);
    return null;
  }
}

const CACHE_KEY = 'codora_user_progress_cache';

export function cacheUserProgress(progress: UserProgress): void {
  try {
    const cacheData = {
      ...progress,
      _cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching user progress:', error);
  }
}

export function getCachedUserProgress(): UserProgress | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const cacheAge = Date.now() - (data._cachedAt || 0);
    const MAX_CACHE_AGE = 5 * 60 * 1000;

    if (cacheAge > MAX_CACHE_AGE) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    delete data._cachedAt;
    return data as UserProgress;
  } catch (error) {
    console.error('Error getting cached progress:', error);
    return null;
  }
}

export function clearCachedProgress(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cached progress:', error);
  }
}