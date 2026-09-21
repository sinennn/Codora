import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface LearnerProfile {
  id: string;
  userId: string;
  
  // Learning speed (how fast they move through content)
  pace: 'slow' | 'moderate' | 'fast';
  avgTimePerSection: number; // seconds
  avgTimePerExercise: number; // seconds
  
  // Comprehension patterns
  exerciseAccuracy: number; // 0-100
  firstTryAccuracy: number; // % correct on first attempt
  hintsUsed: number;
  totalExercises: number;
  
  // Struggle detection
  struggledTopics: StruggledTopic[];
  strongTopics: string[];
  
  // Learning style indicators
  prefersCodeFirst: boolean; // Do they skip to code examples?
  needsMoreExamples: boolean; // Do they struggle without multiple examples?
  benefitsFromAnalogies: boolean; // Do analogies help them?
  
  // Engagement patterns
  averageSessionLength: number; // minutes
  dropOffPoints: string[]; // Where do they quit lessons?
  completionRate: number; // % of started lessons completed
  
  // Adaptive settings
  currentDifficultyMultiplier: number; // 0.5 (easier) to 1.5 (harder)
  explanationDepth: 'brief' | 'standard' | 'detailed';
  codeExampleCount: 'minimal' | 'standard' | 'extra';
  
  updatedAt: string;
}

export interface StruggledTopic {
  topic: string;
  attempts: number;
  lastAttempt: string;
  resolved: boolean;
}

export interface LessonInteraction {
  lessonId: string;
  sectionTimes: number[]; // Time spent on each section (seconds)
  exerciseAttempts: ExerciseAttemptData[];
  hintsRequested: number;
  sectionsRevisited: string[]; // Which sections did they go back to?
  completedAt?: string;
  abandoned?: boolean;
  abandonedAtSection?: number;
}

export interface ExerciseAttemptData {
  exerciseId: string;
  attempts: number;
  timeToFirstAnswer: number; // seconds
  timeToCorrect: number; // seconds (0 if first try correct)
  hintsUsed: number;
  correct: boolean;
  userAnswer?: string | number; // Track what they answered
}

const DEFAULT_PROFILE: Omit<LearnerProfile, 'id' | 'userId'> = {
  pace: 'moderate',
  avgTimePerSection: 120, // 2 minutes
  avgTimePerExercise: 60, // 1 minute
  exerciseAccuracy: 70,
  firstTryAccuracy: 50,
  hintsUsed: 0,
  totalExercises: 0,
  struggledTopics: [],
  strongTopics: [],
  prefersCodeFirst: false,
  needsMoreExamples: false,
  benefitsFromAnalogies: true,
  averageSessionLength: 15,
  dropOffPoints: [],
  completionRate: 100,
  currentDifficultyMultiplier: 1.0,
  explanationDepth: 'standard',
  codeExampleCount: 'standard',
  updatedAt: new Date().toISOString(),
};

export async function getLearnerProfile(userId: string): Promise<LearnerProfile> {
  try {
    const profileRef = doc(db, 'learnerProfiles', userId);
    const snapshot = await getDoc(profileRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as LearnerProfile;
    }
    
    // Create default profile
    const newProfile: LearnerProfile = {
      id: userId,
      userId,
      ...DEFAULT_PROFILE,
    };
    
    await setDoc(profileRef, newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error getting learner profile:', error);
    return { id: userId, userId, ...DEFAULT_PROFILE };
  }
}

export async function updateLearnerProfile(
  userId: string, 
  updates: Partial<LearnerProfile>
): Promise<void> {
  try {
    const profileRef = doc(db, 'learnerProfiles', userId);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating learner profile:', error);
  }
}

export async function recordLessonInteraction(
  userId: string,
  interaction: LessonInteraction
): Promise<void> {
  const profile = await getLearnerProfile(userId);
  const updates: Partial<LearnerProfile> = {};
  
  // Analyze pace
  const avgSectionTime = interaction.sectionTimes.reduce((a, b) => a + b, 0) / interaction.sectionTimes.length;
  const newAvgTime = (profile.avgTimePerSection * 0.7) + (avgSectionTime * 0.3); // Weighted average
  updates.avgTimePerSection = newAvgTime;
  
  if (newAvgTime < 60) {
    updates.pace = 'fast';
  } else if (newAvgTime > 180) {
    updates.pace = 'slow';
  } else {
    updates.pace = 'moderate';
  }
  
  // Analyze exercise performance
  const exerciseData = interaction.exerciseAttempts;
  if (exerciseData.length > 0) {
    const correctCount = exerciseData.filter(e => e.correct).length;
    const firstTryCorrect = exerciseData.filter(e => e.attempts === 1 && e.correct).length;
    const totalHints = exerciseData.reduce((sum, e) => sum + e.hintsUsed, 0);
    
    const newAccuracy = (correctCount / exerciseData.length) * 100;
    const newFirstTry = (firstTryCorrect / exerciseData.length) * 100;
    
    // Weighted update (recent performance matters more)
    updates.exerciseAccuracy = (profile.exerciseAccuracy * 0.6) + (newAccuracy * 0.4);
    updates.firstTryAccuracy = (profile.firstTryAccuracy * 0.6) + (newFirstTry * 0.4);
    updates.hintsUsed = profile.hintsUsed + totalHints;
    updates.totalExercises = profile.totalExercises + exerciseData.length;
    
    // Detect if user needs more examples (low first-try accuracy)
    updates.needsMoreExamples = updates.firstTryAccuracy < 40;
    
    // Adjust difficulty multiplier based on performance
    if (newAccuracy >= 90 && newFirstTry >= 70) {
      updates.currentDifficultyMultiplier = Math.min(1.5, profile.currentDifficultyMultiplier + 0.1);
    } else if (newAccuracy < 50) {
      updates.currentDifficultyMultiplier = Math.max(0.5, profile.currentDifficultyMultiplier - 0.1);
    }
  }
  
  // Track abandonment
  if (interaction.abandoned) {
    const dropOffPoint = `section_${interaction.abandonedAtSection}`;
    if (!profile.dropOffPoints.includes(dropOffPoint)) {
      updates.dropOffPoints = [...profile.dropOffPoints, dropOffPoint].slice(-10);
    }
    
    // Update completion rate
    const totalLessons = profile.totalExercises > 0 ? Math.ceil(profile.totalExercises / 3) : 1;
    updates.completionRate = ((profile.completionRate * totalLessons) + 0) / (totalLessons + 1);
  } else if (interaction.completedAt) {
    const totalLessons = profile.totalExercises > 0 ? Math.ceil(profile.totalExercises / 3) : 1;
    updates.completionRate = ((profile.completionRate * totalLessons) + 100) / (totalLessons + 1);
  }
  
  // Detect revisited sections (indicates confusion)
  if (interaction.sectionsRevisited.length > 2) {
    updates.explanationDepth = 'detailed';
  }
  
  await updateLearnerProfile(userId, updates);
}

export async function recordStruggle(
  userId: string,
  topic: string,
  _exerciseId: string,
  attempts: number
): Promise<void> {
  if (attempts < 3) return; // Only track significant struggles
  
  const profile = await getLearnerProfile(userId);
  const existingStruggle = profile.struggledTopics.find(s => s.topic === topic);
  
  if (existingStruggle) {
    existingStruggle.attempts += attempts;
    existingStruggle.lastAttempt = new Date().toISOString();
  } else {
    profile.struggledTopics.push({
      topic,
      attempts,
      lastAttempt: new Date().toISOString(),
      resolved: false,
    });
  }
  
  // Keep only recent struggles
  const recentStruggles = profile.struggledTopics
    .sort((a, b) => new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime())
    .slice(0, 10);
  
  await updateLearnerProfile(userId, { struggledTopics: recentStruggles });
}

export async function recordMastery(userId: string, topic: string): Promise<void> {
  const profile = await getLearnerProfile(userId);
  
  // Mark any related struggles as resolved
  const updatedStruggles = profile.struggledTopics.map(s => 
    s.topic === topic ? { ...s, resolved: true } : s
  );
  
  // Add to strong topics if not already there
  const strongTopics = profile.strongTopics.includes(topic) 
    ? profile.strongTopics 
    : [...profile.strongTopics, topic].slice(-20);
  
  await updateLearnerProfile(userId, { 
    struggledTopics: updatedStruggles,
    strongTopics,
  });
}

// ============================================
// ADAPTIVE PROMPT GENERATION
// ============================================

export interface AdaptivePromptConfig {
  explanationStyle: string;
  codeExampleGuidance: string;
  exerciseDifficulty: string;
  paceGuidance: string;
  focusAreas: string[];
  avoidPatterns: string[];
}

export function generateAdaptivePromptConfig(profile: LearnerProfile): AdaptivePromptConfig {
  const config: AdaptivePromptConfig = {
    explanationStyle: '',
    codeExampleGuidance: '',
    exerciseDifficulty: '',
    paceGuidance: '',
    focusAreas: [],
    avoidPatterns: [],
  };
  
  // Explanation depth
  switch (profile.explanationDepth) {
    case 'brief':
      config.explanationStyle = 'Be concise and direct. Skip lengthy introductions. Get to the point quickly with minimal preamble.';
      break;
    case 'detailed':
      config.explanationStyle = 'Provide thorough explanations. Use multiple analogies. Break down complex concepts into smaller steps. Explain the "why" behind each concept.';
      break;
    default:
      config.explanationStyle = 'Provide clear, balanced explanations with one good analogy per concept.';
  }
  
  // Code examples
  switch (profile.codeExampleCount) {
    case 'minimal':
      config.codeExampleGuidance = 'Include only essential code examples. One example per concept is enough.';
      break;
    case 'extra':
      config.codeExampleGuidance = 'Include multiple code examples for each concept. Show variations and edge cases. Include a "wrong way" example to contrast with the correct approach.';
      break;
    default:
      config.codeExampleGuidance = 'Include 1-2 clear code examples per concept.';
  }
  
  // Exercise difficulty
  const diffMultiplier = profile.currentDifficultyMultiplier;
  if (diffMultiplier < 0.8) {
    config.exerciseDifficulty = 'Create easier exercises. Focus on recognition and basic application. Provide more hints. Use simpler scenarios.';
  } else if (diffMultiplier > 1.2) {
    config.exerciseDifficulty = 'Create challenging exercises. Include edge cases and tricky scenarios. Require deeper understanding. Fewer hints.';
  } else {
    config.exerciseDifficulty = 'Create balanced exercises that test understanding without being frustrating.';
  }
  
  // Pace guidance
  switch (profile.pace) {
    case 'fast':
      config.paceGuidance = 'This learner moves quickly. Keep sections focused and avoid repetition. They likely have some background knowledge.';
      break;
    case 'slow':
      config.paceGuidance = 'This learner takes their time. Include recap points. Reinforce key concepts. Don\'t rush through material.';
      break;
    default:
      config.paceGuidance = 'Maintain a steady pace with clear progression between concepts.';
  }
  
  // Focus areas based on struggles
  if (profile.struggledTopics.length > 0) {
    const unresolvedStruggles = profile.struggledTopics.filter(s => !s.resolved);
    if (unresolvedStruggles.length > 0) {
      config.focusAreas.push(
        `Pay extra attention to these concepts the learner has struggled with: ${unresolvedStruggles.map(s => s.topic).join(', ')}`
      );
    }
  }
  
  // Patterns to avoid
  if (profile.needsMoreExamples) {
    config.avoidPatterns.push('Avoid abstract explanations without concrete examples');
  }
  
  if (profile.completionRate < 70) {
    config.avoidPatterns.push('Avoid overly long sections - break content into smaller chunks');
    config.focusAreas.push('Keep the learner engaged with interactive elements and quick wins');
  }
  
  if (!profile.benefitsFromAnalogies) {
    config.avoidPatterns.push('Skip analogies - this learner prefers direct technical explanations');
  }
  
  return config;
}

export function buildAdaptiveSystemPrompt(profile: LearnerProfile): string {
  const config = generateAdaptivePromptConfig(profile);
  
  return `
ADAPTIVE TEACHING INSTRUCTIONS:
You are teaching a learner with the following profile:
- Learning pace: ${profile.pace}
- Exercise accuracy: ${Math.round(profile.exerciseAccuracy)}%
- First-try success rate: ${Math.round(profile.firstTryAccuracy)}%
- Completion rate: ${Math.round(profile.completionRate)}%

TEACHING STYLE ADJUSTMENTS:
${config.explanationStyle}

CODE EXAMPLES:
${config.codeExampleGuidance}

EXERCISES:
${config.exerciseDifficulty}

PACING:
${config.paceGuidance}

${config.focusAreas.length > 0 ? `FOCUS AREAS:\n${config.focusAreas.map(f => `- ${f}`).join('\n')}` : ''}

${config.avoidPatterns.length > 0 ? `AVOID:\n${config.avoidPatterns.map(p => `- ${p}`).join('\n')}` : ''}

Remember: Adapt your teaching to THIS specific learner, not a generic audience.
`.trim();
}

// ============================================
// REAL-TIME ADAPTATION SIGNALS
// ============================================

export interface RealTimeSignal {
  type: 'fast_completion' | 'slow_progress' | 'multiple_attempts' | 'hint_requested' | 'section_revisit';
  data: Record<string, unknown>;
  timestamp: string;
}

export function interpretSignal(signal: RealTimeSignal): string {
  switch (signal.type) {
    case 'fast_completion':
      return 'The learner completed this quickly. Consider increasing complexity or skipping basics in future content.';
    
    case 'slow_progress':
      return 'The learner is taking longer than usual. They may need more explanation or simpler examples.';
    
    case 'multiple_attempts':
      const attempts = signal.data.attempts as number;
      if (attempts >= 3) {
        return `The learner needed ${attempts} attempts. Provide a clearer explanation and simpler follow-up exercise.`;
      }
      return 'Minor struggle detected. A brief clarification may help.';
    
    case 'hint_requested':
      return 'The learner requested a hint. They may benefit from more guided examples.';
    
    case 'section_revisit':
      return 'The learner went back to review a previous section. The current content may be building on concepts they haven\'t fully grasped.';
    
    default:
      return '';
  }
}

// ============================================
// SMART HINT GENERATION
// ============================================

export function generateProgressiveHint(
  _question: string,
  correctAnswer: string,
  attemptNumber: number,
  profile: LearnerProfile
): string {
  // Hints get more specific with each attempt
  // Adjusted based on learner profile
  
  const baseHints = [
    'Think about what the question is really asking.',
    'Consider the key concept involved here.',
    'The answer relates to a fundamental principle we covered.',
  ];
  
  const specificHints = [
    `Focus on how this concept works in practice.`,
    `Remember the pattern we discussed in the examples.`,
    `The answer involves understanding ${correctAnswer.split(' ')[0]}...`,
  ];
  
  const directHints = [
    `The correct approach involves: ${correctAnswer.substring(0, Math.floor(correctAnswer.length / 3))}...`,
    `Think step by step: first... then...`,
  ];
  
  // Faster learners get less hand-holding
  if (profile.pace === 'fast' && profile.firstTryAccuracy > 60) {
    if (attemptNumber === 1) return baseHints[0];
    if (attemptNumber === 2) return specificHints[1];
    return directHints[0];
  }
  
  // Struggling learners get more support
  if (profile.firstTryAccuracy < 40 || profile.needsMoreExamples) {
    if (attemptNumber === 1) return specificHints[0];
    if (attemptNumber === 2) return directHints[0];
    return `Let me help: ${correctAnswer.substring(0, Math.floor(correctAnswer.length / 2))}...`;
  }
  
  // Default progression
  if (attemptNumber === 1) return baseHints[attemptNumber % baseHints.length];
  if (attemptNumber === 2) return specificHints[attemptNumber % specificHints.length];
  return directHints[attemptNumber % directHints.length];
}
