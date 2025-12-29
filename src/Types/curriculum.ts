// ============================================
// CURRICULUM & ROADMAP TYPES
// Structured learning paths with progress tracking
// ============================================

// ============================================
// ROADMAP STRUCTURE
// ============================================

export interface Roadmap {
  id: string;
  name: string;                    // e.g., "React", "Python", "Backend Development"
  type: 'field' | 'technology';
  description: string;
  estimatedWeeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];         // IDs of other roadmaps that should be completed first
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  roadmapId: string;
  name: string;
  description: string;
  order: number;                   // Position in the roadmap
  estimatedHours: number;
  isOptional: boolean;             // Advanced/optional modules
  prerequisites: string[];         // Module IDs that must be completed first
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  type: 'concept' | 'tutorial' | 'practice' | 'project' | 'assessment';
  content: LessonContent;
  exercises: Exercise[];
}

export interface LessonContent {
  sections: ContentSection[];
  codeExamples: CodeExample[];
  resources: Resource[];
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;                 // Markdown content
  order: number;
}

export interface CodeExample {
  id: string;
  language: string;
  code: string;
  explanation: string;
  isRunnable: boolean;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'documentation' | 'article' | 'video' | 'tool';
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: 'multiple_choice' | 'code_completion' | 'code_fix' | 'free_response' | 'project';
  question: string;
  codeSnippet?: string;
  options?: string[];
  correctAnswer: string | number;
  hints: string[];
  explanation: string;
  xpReward: number;
  order: number;
  isRequired: boolean;
}

// ============================================
// USER ENROLLMENT & PROGRESS
// ============================================

export interface UserEnrollment {
  id: string;
  userId: string;
  roadmapId: string;
  roadmapName: string;
  roadmapType: 'field' | 'technology';
  enrolledAt: string;              // ISO timestamp
  lockedUntil: string;             // ISO timestamp (enrolledAt + 2 weeks)
  status: 'active' | 'completed' | 'paused';
  completedAt?: string;
}

export interface UserCurriculumProgress {
  id: string;                      // `${userId}_${roadmapId}`
  userId: string;
  roadmapId: string;
  
  // Overall progress
  overallProgress: number;         // 0-100
  currentModuleId: string;
  currentLessonId: string;
  
  // Detailed tracking
  moduleProgress: ModuleProgress[];
  
  // Stats
  totalXpEarned: number;
  totalTimeSpent: number;          // seconds
  lessonsCompleted: number;
  exercisesCompleted: number;
  exercisesAttempted: number;
  
  // Timestamps
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: number;                // 0-100
  lessonsProgress: LessonProgress[];
  startedAt?: string;
  completedAt?: string;
}

export interface LessonProgress {
  lessonId: string;
  lessonName: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';
  progress: number;                // 0-100
  sectionsCompleted: string[];     // Section IDs
  exerciseAttempts: ExerciseAttempt[];
  timeSpent: number;               // seconds
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
}

export interface ExerciseAttempt {
  exerciseId: string;
  attempts: number;
  isCorrect: boolean;
  userAnswer: string | number;
  hintsUsed: number;
  timeSpent: number;               // seconds
  attemptedAt: string;
  completedAt?: string;
}

// ============================================
// LEARNING SESSION
// ============================================

export interface LearningSession {
  id: string;
  userId: string;
  roadmapId: string;
  moduleId: string;
  lessonId: string;
  startedAt: string;
  endedAt?: string;
  duration: number;                // seconds
  sectionsViewed: string[];
  exercisesAttempted: string[];
  exercisesCompleted: string[];
  xpEarned: number;
}

// ============================================
// MENTOR FEEDBACK
// ============================================

export interface MentorFeedback {
  type: 'encouragement' | 'hint' | 'correction' | 'celebration' | 'guidance';
  message: string;
  context?: {
    exerciseId?: string;
    lessonId?: string;
    mistakePattern?: string;
  };
}

// ============================================
// CONSTANTS
// ============================================

export const LOCK_DURATION_DAYS = 14;

export const ROADMAP_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;
