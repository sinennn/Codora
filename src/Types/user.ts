// ============================================
// CODORA USER & PROGRESSION TYPES
// ============================================

export interface UserProgress {
  id: string;
  username: string;
  email: string;
  photoURL?: string;
  
  // XP & Leveling
  xp: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO date
  
  // Daily Goals
  dailyGoal: number;        // XP target per day
  dailyProgress: number;    // XP earned today
  
  // Stats
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalTimeSpent: number;   // seconds
  
  // Skills
  skills: SkillProgress[];
  weakTopics: string[];
  
  // Achievements
  achievements: Achievement[];
  
  // Preferences
  preferredTutor: 'nime' | 'nesto' | 'both';
  
  createdAt: string;
  updatedAt: string;
}

export interface SkillProgress {
  skillId: string;
  name: string;
  category: 'language' | 'framework' | 'concept';
  level: number;           // 0-5 mastery
  xp: number;
  totalLessons: number;
  completedLessons: number;
  accuracy: number;
  lastPracticed?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
  progress?: number;       // 0-100 for progressive achievements
  requirement?: number;
}

// Level titles based on XP thresholds
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Novice',
  2: 'Apprentice',
  3: 'Explorer',
  4: 'Developer',
  5: 'Engineer',
  6: 'Architect',
  7: 'Expert',
  8: 'Master',
  9: 'Grandmaster',
  10: 'Legend',
};

// XP required for each level
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 600,
  5: 1000,
  6: 1500,
  7: 2200,
  8: 3000,
  9: 4000,
  10: 5500,
};

export function calculateLevel(xp: number): { level: number; title: string; xpToNext: number; progress: number } {
  let level = 1;
  for (const [lvl, threshold] of Object.entries(XP_THRESHOLDS)) {
    if (xp >= threshold) level = parseInt(lvl);
  }
  
  const currentThreshold = XP_THRESHOLDS[level] || 0;
  const nextThreshold = XP_THRESHOLDS[level + 1] || XP_THRESHOLDS[10];
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  
  return {
    level,
    title: LEVEL_TITLES[level] || 'Legend',
    xpToNext: nextThreshold - xp,
    progress: Math.min((xpInLevel / xpNeeded) * 100, 100),
  };
}

// Default user progress for new users
export const defaultUserProgress: Omit<UserProgress, 'id' | 'username' | 'email'> = {
  xp: 0,
  level: 1,
  levelTitle: 'Novice',
  xpToNextLevel: 100,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: new Date().toISOString(),
  dailyGoal: 50,
  dailyProgress: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  accuracy: 0,
  totalTimeSpent: 0,
  skills: [],
  weakTopics: [],
  achievements: [],
  preferredTutor: 'both',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
