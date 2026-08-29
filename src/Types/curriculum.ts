export interface Roadmap {
  id: string;
  name: string;
  type: 'field' | 'technology';
  description: string;
  estimatedWeeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  roadmapId: string;
  name: string;
  description: string;
  order: number;
  estimatedHours: number;
  isOptional: boolean;
  prerequisites: string[];
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
  content: string;
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

export interface UserEnrollment {
  id: string;
  userId: string;
  roadmapId: string;
  roadmapName: string;
  roadmapType: 'field' | 'technology';
  enrolledAt: string;
  lockedUntil: string;
  status: 'active' | 'completed' | 'paused';
  completedAt?: string;
}

export interface UserCurriculumProgress {
  id: string;
  userId: string;
  roadmapId: string;
  overallProgress: number;
  currentModuleId: string;
  currentLessonId: string;
  moduleProgress: ModuleProgress[];
  totalXpEarned: number;
  totalTimeSpent: number;
  lessonsCompleted: number;
  exercisesCompleted: number;
  exercisesAttempted: number;
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: number;
  lessonsProgress: LessonProgress[];
  startedAt?: string;
  completedAt?: string;
}

export interface LessonProgress {
  lessonId: string;
  lessonName: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';
  progress: number;
  sectionsCompleted: string[];
  exerciseAttempts: ExerciseAttempt[];
  timeSpent: number;
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
  timeSpent: number;
  attemptedAt: string;
  completedAt?: string;
}

export interface LearningSession {
  id: string;
  userId: string;
  roadmapId: string;
  moduleId: string;
  lessonId: string;
  startedAt: string;
  endedAt?: string;
  duration: number;
  sectionsViewed: string[];
  exercisesAttempted: string[];
  exercisesCompleted: string[];
  xpEarned: number;
}

export interface MentorFeedback {
  type: 'encouragement' | 'hint' | 'correction' | 'celebration' | 'guidance';
  message: string;
  context?: {
    exerciseId?: string;
    lessonId?: string;
    mistakePattern?: string;
  };
}

export const LOCK_DURATION_DAYS = 14;

export const ROADMAP_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;