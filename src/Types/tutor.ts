// Tutor identities
export type TutorType = 'nime' | 'nesto';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';


export interface NimeInput {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  topic: string;
  difficulty: Difficulty;
  isCorrect: boolean;
}

export interface NimeResponse {
  message: string;
  tip?: string;
  nextSuggestion?: string;
}

export interface UserStats {
  accuracy: number;       
  streak: number;          
  weakTopics: string[];    
  totalQuestions: number;
  correctAnswers: number;
  averageTime?: number;    
}

export interface NestoInput {
  userStats: UserStats;
  recentResult: 'correct' | 'incorrect';
  currentTopic?: string;
  sessionProgress?: {
    questionsAnswered: number;
    sessionAccuracy: number;
  };
}

export interface NestoResponse {
  message: string;
  challengeSuggestion?: string;
}

// Combined Tutor Response (for UI display)

export interface TutorFeedback {
  nime?: NimeResponse;
  nesto?: NestoResponse;
  timestamp: number;
}

// Tutor Context (for lesson/quiz integration)

export type TutorContext = 
  | 'lesson_explanation'
  | 'quiz_feedback'
  | 'streak_summary'
  | 'dashboard_tip'
  | 'challenge_prompt'
  | 'encouragement';

export interface TutorMessage {
  tutor: TutorType;
  context: TutorContext;
  content: NimeResponse | NestoResponse;
  displayPriority: 'high' | 'medium' | 'low';
}
// Tutor Preferences (user settings)
export interface TutorPreferences {
  preferredTutor: TutorType | 'both';
  showNimeExplanations: boolean;
  showNestoCoaching: boolean;
  feedbackFrequency: 'always' | 'sometimes' | 'minimal';
}

export const defaultTutorPreferences: TutorPreferences = {
  preferredTutor: 'both',
  showNimeExplanations: true,
  showNestoCoaching: true,
  feedbackFrequency: 'always',
};
