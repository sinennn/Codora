// ============================================
// USER PROGRESS SERVICE - Firebase Integration
// Handles all user progress, XP, streaks, achievements
// Syncs XP to userScores collection for leaderboard
// ============================================

import { db } from '../../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where
} from 'firebase/firestore';
import type { UserProgress, SkillProgress, Achievement } from '../Types/user';
import { calculateLevel, XP_THRESHOLDS, LEVEL_TITLES } from '../Types/user';
import { updateUserScore } from './scoreService';

// ============================================
// CONSTANTS
// ============================================

const COLLECTIONS = {
  USER_PROGRESS: 'userProgress',
  QUIZ_RESULTS: 'quizResults',
} as const;

// Default achievements available in the app
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your first quiz', icon: '🎯', isUnlocked: false },
  { id: 'streak_3', name: 'Getting Warm', description: '3-day streak', icon: '🔥', isUnlocked: false, progress: 0, requirement: 3 },
  { id: 'streak_7', name: 'On Fire', description: '7-day streak', icon: '🔥', isUnlocked: false, progress: 0, requirement: 7 },
  { id: 'streak_30', name: 'Unstoppable', description: '30-day streak', icon: '💪', isUnlocked: false, progress: 0, requirement: 30 },
  { id: 'quiz_master', name: 'Quiz Master', description: '100% on a quiz', icon: '🏆', isUnlocked: false },
  { id: 'night_owl', name: 'Night Owl', description: 'Study after midnight', icon: '🦉', isUnlocked: false },
  { id: 'early_bird', name: 'Early Bird', description: 'Study before 6 AM', icon: '🐦', isUnlocked: false },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Finish quiz in under 1 min', icon: '⚡', isUnlocked: false },
  { id: 'perfectionist', name: 'Perfectionist', description: '10 perfect quizzes', icon: '💎', isUnlocked: false, progress: 0, requirement: 10 },
  { id: 'century', name: 'Century', description: 'Answer 100 questions', icon: '💯', isUnlocked: false, progress: 0, requirement: 100 },
  { id: 'scholar', name: 'Scholar', description: 'Answer 500 questions', icon: '📚', isUnlocked: false, progress: 0, requirement: 500 },
  { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', isUnlocked: false, progress: 0, requirement: 5 },
  { id: 'level_10', name: 'Legend', description: 'Reach level 10', icon: '👑', isUnlocked: false, progress: 0, requirement: 10 },
  { id: 'multi_skill', name: 'Jack of All Trades', description: 'Practice 5 different skills', icon: '🎭', isUnlocked: false, progress: 0, requirement: 5 },
];

// Helper functions
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayISO(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function isPracticedToday(lastActiveDate: string): boolean {
  return lastActiveDate === getTodayISO();
}

function shouldContinueStreak(lastActiveDate: string): boolean {
  const today = getTodayISO();
  const yesterday = getYesterdayISO();
  return lastActiveDate === today || lastActiveDate === yesterday;
}


// ============================================
// USER PROGRESS CRUD
// ============================================

export async function createUserProgress(
  userId: string, 
  username: string, 
  email: string, 
  photoURL?: string
): Promise<UserProgress> {
  const now = new Date().toISOString();
  
  const initialProgress: UserProgress = {
    id: userId,
    username,
    email,
    photoURL,
    xp: 0,
    level: 1,
    levelTitle: LEVEL_TITLES[1],
    xpToNextLevel: XP_THRESHOLDS[2],
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    dailyGoal: 50,
    dailyProgress: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
    totalTimeSpent: 0,
    skills: [],
    weakTopics: [],
    achievements: DEFAULT_ACHIEVEMENTS,
    preferredTutor: 'both',
    createdAt: now,
    updatedAt: now,
  };

  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  await setDoc(userRef, {
    ...initialProgress,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return initialProgress;
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as UserProgress;
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
}

export async function getOrCreateUserProgress(
  userId: string, 
  username: string, 
  email: string, 
  photoURL?: string
): Promise<UserProgress> {
  const existing = await getUserProgress(userId);
  if (existing) {
    const today = getTodayISO();
    if (existing.lastActiveDate !== today && existing.dailyProgress > 0) {
      await updateDoc(doc(db, COLLECTIONS.USER_PROGRESS, userId), {
        dailyProgress: 0,
        updatedAt: serverTimestamp(),
      });
      existing.dailyProgress = 0;
    }
    return existing;
  }
  return createUserProgress(userId, username, email, photoURL);
}


// ============================================
// XP & LEVELING
// Syncs XP to both userProgress AND userScores (leaderboard)
// ============================================

export async function addXP(
  userId: string, 
  xpAmount: number,
  username?: string,
  email?: string
): Promise<{ newXP: number; leveledUp: boolean; newLevel: number; newTitle: string }> {
  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User progress not found');
  }

  const currentData = userDoc.data() as UserProgress;
  const newXP = currentData.xp + xpAmount;
  const levelInfo = calculateLevel(newXP);
  const leveledUp = levelInfo.level > currentData.level;

  // Update userProgress collection
  await updateDoc(userRef, {
    xp: newXP,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    xpToNextLevel: levelInfo.xpToNext,
    dailyProgress: increment(xpAmount),
    updatedAt: serverTimestamp(),
  });

  // Also sync to userScores collection for leaderboard
  // This ensures XP from both quizzes AND lessons count toward rankings
  try {
    await updateUserScore(
      userId, 
      xpAmount, 
      username || currentData.username, 
      email || currentData.email
    );
  } catch (error) {
    console.error('Error syncing to leaderboard:', error);
    // Don't throw - leaderboard sync is secondary
  }

  return { newXP, leveledUp, newLevel: levelInfo.level, newTitle: levelInfo.title };
}

// ============================================
// STREAKS
// ============================================

export async function updateStreak(
  userId: string
): Promise<{ currentStreak: number; longestStreak: number; streakBroken: boolean }> {
  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User progress not found');
  }

  const currentData = userDoc.data() as UserProgress;
  const today = getTodayISO();
  const yesterday = getYesterdayISO();
  
  let newStreak = currentData.currentStreak;
  let longestStreak = currentData.longestStreak;
  let streakBroken = false;

  if (currentData.lastActiveDate === today) {
    return { currentStreak: newStreak, longestStreak, streakBroken: false };
  }

  if (currentData.lastActiveDate === yesterday) {
    newStreak += 1;
  } else if (currentData.lastActiveDate === '') {
    newStreak = 1;
  } else {
    streakBroken = currentData.currentStreak > 0;
    newStreak = 1;
  }

  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  await updateDoc(userRef, {
    currentStreak: newStreak,
    longestStreak,
    lastActiveDate: today,
    updatedAt: serverTimestamp(),
  });

  return { currentStreak: newStreak, longestStreak, streakBroken };
}

export async function checkStreakStatus(
  userId: string
): Promise<{ streakActive: boolean; currentStreak: number }> {
  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return { streakActive: false, currentStreak: 0 };
  }

  const currentData = userDoc.data() as UserProgress;
  const shouldContinue = shouldContinueStreak(currentData.lastActiveDate);
  
  if (!shouldContinue && currentData.currentStreak > 0) {
    await updateDoc(userRef, {
      currentStreak: 0,
      updatedAt: serverTimestamp(),
    });
    return { streakActive: false, currentStreak: 0 };
  }

  return { 
    streakActive: isPracticedToday(currentData.lastActiveDate), 
    currentStreak: currentData.currentStreak 
  };
}


// ============================================
// QUIZ RESULTS
// ============================================

export interface QuizResult {
  id?: string;
  userId: string;
  topic: string;
  category: 'field' | 'technology';
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  xpEarned: number;
  timeSpent: number;
  completedAt: string;
  questions: {
    question: string;
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
}

export async function saveQuizResult(
  userId: string,
  result: Omit<QuizResult, 'id' | 'userId' | 'completedAt'>
): Promise<{ xpEarned: number; leveledUp: boolean; newAchievements: string[] }> {
  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User progress not found');
  }

  const currentData = userDoc.data() as UserProgress;
  
  // Calculate XP
  const baseXP = result.correctAnswers * 10;
  const bonusXP = result.score === result.totalQuestions ? 20 : 0;
  const difficultyMultiplier = result.difficulty === 'advanced' ? 1.5 : result.difficulty === 'intermediate' ? 1.2 : 1;
  const xpEarned = Math.round((baseXP + bonusXP) * difficultyMultiplier);

  // Save quiz result
  const quizResultRef = doc(collection(db, COLLECTIONS.QUIZ_RESULTS));
  await setDoc(quizResultRef, {
    ...result,
    id: quizResultRef.id,
    userId,
    xpEarned,
    completedAt: new Date().toISOString(),
  });

  // Update user stats
  const newTotalQuestions = currentData.totalQuestions + result.totalQuestions;
  const newCorrectAnswers = currentData.correctAnswers + result.correctAnswers;
  const newAccuracy = Math.round((newCorrectAnswers / newTotalQuestions) * 100);
  const newTimeSpent = currentData.totalTimeSpent + result.timeSpent;

  await updateDoc(userRef, {
    totalQuestions: newTotalQuestions,
    correctAnswers: newCorrectAnswers,
    accuracy: newAccuracy,
    totalTimeSpent: newTimeSpent,
    updatedAt: serverTimestamp(),
  });

  // Add XP (this also syncs to leaderboard)
  const xpResult = await addXP(userId, xpEarned, currentData.username, currentData.email);
  await updateStreak(userId);

  const newAchievements = await checkAndUnlockAchievements(userId, {
    totalQuestions: newTotalQuestions,
    perfectQuiz: result.score === result.totalQuestions,
    timeSpent: result.timeSpent,
    level: xpResult.newLevel,
  });

  return { xpEarned, leveledUp: xpResult.leveledUp, newAchievements };
}

export async function getQuizHistory(userId: string, limitCount: number = 10): Promise<QuizResult[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.QUIZ_RESULTS),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as QuizResult);
  } catch (error) {
    console.error('Error getting quiz history:', error);
    return [];
  }
}


// ============================================
// SKILLS TRACKING
// ============================================

export async function updateSkillProgress(
  userId: string,
  skillName: string,
  category: 'language' | 'framework' | 'concept',
  questionsAnswered: number,
  correctAnswers: number
): Promise<SkillProgress> {
  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User progress not found');
  }

  const currentData = userDoc.data() as UserProgress;
  const skills = [...currentData.skills];
  
  let skillIndex = skills.findIndex(s => s.name.toLowerCase() === skillName.toLowerCase());
  
  if (skillIndex === -1) {
    const newSkill: SkillProgress = {
      skillId: `skill_${Date.now()}`,
      name: skillName,
      category,
      level: 0,
      xp: 0,
      totalLessons: 0,
      completedLessons: 0,
      accuracy: 0,
      lastPracticed: new Date().toISOString(),
    };
    skills.push(newSkill);
    skillIndex = skills.length - 1;
  }

  const skill = skills[skillIndex];
  const xpGained = correctAnswers * 10;
  skill.xp += xpGained;
  skill.totalLessons += 1;
  skill.completedLessons += 1;
  skill.accuracy = Math.round((correctAnswers / questionsAnswered) * 100);
  
  const skillLevelThresholds = [0, 100, 300, 600, 1000, 1500];
  skill.level = skillLevelThresholds.findIndex((threshold, i) => 
    skill.xp >= threshold && (i === skillLevelThresholds.length - 1 || skill.xp < skillLevelThresholds[i + 1])
  );
  
  skill.lastPracticed = new Date().toISOString();
  skills[skillIndex] = skill;

  const weakTopics = skills.filter(s => s.accuracy < 70).map(s => s.name);

  await updateDoc(userRef, {
    skills,
    weakTopics,
    updatedAt: serverTimestamp(),
  });

  return skill;
}

// ============================================
// ACHIEVEMENTS
// ============================================

interface AchievementCheckParams {
  totalQuestions?: number;
  perfectQuiz?: boolean;
  timeSpent?: number;
  level?: number;
  streak?: number;
}

export async function checkAndUnlockAchievements(
  userId: string,
  params: AchievementCheckParams
): Promise<string[]> {
  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return [];

  const currentData = userDoc.data() as UserProgress;
  const achievements = [...currentData.achievements];
  const newlyUnlocked: string[] = [];
  const now = new Date().toISOString();
  const hour = new Date().getHours();

  achievements.forEach((achievement, index) => {
    if (achievement.isUnlocked) return;

    let shouldUnlock = false;
    let newProgress = achievement.progress || 0;

    switch (achievement.id) {
      case 'first_steps':
        shouldUnlock = (params.totalQuestions || 0) > 0;
        break;
      case 'streak_3':
        newProgress = Math.min(((params.streak || currentData.currentStreak) / 3) * 100, 100);
        shouldUnlock = (params.streak || currentData.currentStreak) >= 3;
        break;
      case 'streak_7':
        newProgress = Math.min(((params.streak || currentData.currentStreak) / 7) * 100, 100);
        shouldUnlock = (params.streak || currentData.currentStreak) >= 7;
        break;
      case 'streak_30':
        newProgress = Math.min(((params.streak || currentData.currentStreak) / 30) * 100, 100);
        shouldUnlock = (params.streak || currentData.currentStreak) >= 30;
        break;
      case 'quiz_master':
        shouldUnlock = params.perfectQuiz === true;
        break;
      case 'night_owl':
        shouldUnlock = hour >= 0 && hour < 5;
        break;
      case 'early_bird':
        shouldUnlock = hour >= 5 && hour < 6;
        break;
      case 'speed_demon':
        shouldUnlock = (params.timeSpent || 0) > 0 && (params.timeSpent || 0) < 60;
        break;
      case 'century':
        newProgress = Math.min(((params.totalQuestions || currentData.totalQuestions) / 100) * 100, 100);
        shouldUnlock = (params.totalQuestions || currentData.totalQuestions) >= 100;
        break;
      case 'scholar':
        newProgress = Math.min(((params.totalQuestions || currentData.totalQuestions) / 500) * 100, 100);
        shouldUnlock = (params.totalQuestions || currentData.totalQuestions) >= 500;
        break;
      case 'level_5':
        newProgress = Math.min(((params.level || currentData.level) / 5) * 100, 100);
        shouldUnlock = (params.level || currentData.level) >= 5;
        break;
      case 'level_10':
        newProgress = Math.min(((params.level || currentData.level) / 10) * 100, 100);
        shouldUnlock = (params.level || currentData.level) >= 10;
        break;
      case 'multi_skill':
        const skillCount = currentData.skills.length;
        newProgress = Math.min((skillCount / 5) * 100, 100);
        shouldUnlock = skillCount >= 5;
        break;
    }

    if (shouldUnlock) {
      achievements[index] = { ...achievement, isUnlocked: true, unlockedAt: now, progress: 100 };
      newlyUnlocked.push(achievement.name);
    } else if (newProgress !== achievement.progress) {
      achievements[index] = { ...achievement, progress: newProgress };
    }
  });

  if (newlyUnlocked.length > 0 || achievements.some((a, i) => a.progress !== currentData.achievements[i].progress)) {
    await updateDoc(userRef, { achievements, updatedAt: serverTimestamp() });
  }

  return newlyUnlocked;
}


// ============================================
// LEADERBOARD
// ============================================

export interface LeaderboardEntry {
  id: string;
  username: string;
  photoURL?: string;
  xp: number;
  level: number;
  levelTitle: string;
  rank: number;
}

export async function getLeaderboard(limitCount: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_PROGRESS),
      orderBy('xp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        photoURL: data.photoURL,
        xp: data.xp,
        level: data.level,
        levelTitle: data.levelTitle,
        rank: index + 1,
      };
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

export async function getUserRank(userId: string): Promise<{ rank: number; xpToClimb: number }> {
  try {
    const userProgress = await getUserProgress(userId);
    if (!userProgress) return { rank: 0, xpToClimb: 0 };

    const q = query(
      collection(db, COLLECTIONS.USER_PROGRESS),
      where('xp', '>', userProgress.xp)
    );
    const snapshot = await getDocs(q);
    const rank = snapshot.size + 1;

    let xpToClimb = 0;
    if (snapshot.size > 0) {
      const sortedByXP = snapshot.docs.map(d => d.data().xp as number).sort((a, b) => a - b);
      xpToClimb = sortedByXP[0] - userProgress.xp + 1;
    }

    return { rank, xpToClimb };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { rank: 0, xpToClimb: 0 };
  }
}

// ============================================
// DAILY GOALS & PREFERENCES
// ============================================

export async function updateDailyGoal(userId: string, newGoal: number): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  await updateDoc(userRef, { dailyGoal: newGoal, updatedAt: serverTimestamp() });
}

export async function updateTutorPreference(userId: string, tutor: 'nime' | 'nesto' | 'both'): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USER_PROGRESS, userId);
  await updateDoc(userRef, { preferredTutor: tutor, updatedAt: serverTimestamp() });
}

// ============================================
// OFFLINE CACHE
// ============================================

const CACHE_KEY = 'codora_user_progress';
const CACHE_EXPIRY = 5 * 60 * 1000;

export function cacheUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: progress, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error caching user progress:', error);
  }
}

export function getCachedUserProgress(): UserProgress | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error('Error getting cached progress:', error);
    return null;
  }
}

export function clearCachedProgress(): void {
  localStorage.removeItem(CACHE_KEY);
}
