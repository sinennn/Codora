import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { loadRoadmap, getLesson as getCurriculumLesson, type Lesson, type Module } from './curriculumDataService';
import { 
  getLearnerProfile, 
  buildAdaptiveSystemPrompt 
} from './adaptiveLearningService';
import { callGroq } from '../lib/groqClient';

export interface LessonContent {
  id: string;
  title: string;
  topic: string;
  category: 'field' | 'technology';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  sections: LessonSection[];
  exercises: Exercise[];
  resources: { type: string; title: string; url: string }[];
  createdAt: string;
  roadmapId?: string;
  moduleId?: string;
  moduleName?: string;
}

export interface LessonSection {
  id: string;
  title: string;
  content: string;
  codeExample?: CodeExample;
  tips?: string[];
}

export interface CodeExample {
  language: string;
  code: string;
  explanation: string;
}

export interface Exercise {
  id: string;
  type: 'code_completion' | 'multiple_choice' | 'code_fix' | 'explain';
  question: string;
  codeSnippet?: string;
  options?: string[];
  correctAnswer: string | number;
  hint?: string;
  explanation: string;
  xpReward: number;
}

export interface TutorLesson {
  id: string;
  userId: string;
  lessonContent: LessonContent;
  progress: number;
  currentSection: number;
  completedExercises: string[];
  xpEarned: number;
  startedAt: string;
  completedAt?: string;
}

const CURRICULUM_LESSON_PROMPT = `You are an expert coding instructor. Using the provided curriculum topic and resources, create an engaging, practical lesson.

CURRICULUM TOPIC: {topic}
DESCRIPTION: {description}
RESOURCES: {resources}

{adaptiveInstructions}

Create a lesson that:
1. Explains the concept clearly with real-world analogies
2. Includes practical, runnable code examples
3. Has 3-4 exercises to test understanding
4. References the provided resources for further learning

OUTPUT FORMAT (JSON only):
{
  "title": "Lesson title based on topic",
  "estimatedTime": 15,
  "sections": [
    {
      "id": "section_1",
      "title": "Section title",
      "content": "Detailed explanation",
      "codeExample": {
        "language": "javascript",
        "code": "// Runnable code example",
        "explanation": "What this code does"
      },
      "tips": ["Practical tip 1", "Practical tip 2"]
    }
  ],
  "exercises": [
    {
      "id": "ex_1",
      "type": "multiple_choice",
      "question": "Question about the topic",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "hint": "Think about...",
      "explanation": "The correct answer is... because...",
      "xpReward": 10
    }
  ]
}`;

export async function generateLessonFromCurriculum(
  roadmapId: string,
  lessonId: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  userId?: string
): Promise<LessonContent> {
  const curriculumData = await getCurriculumLesson(roadmapId, lessonId);
  
  if (!curriculumData) {
    throw new Error(`Lesson not found: ${lessonId} in roadmap ${roadmapId}`);
  }

  const { lesson, module } = curriculumData;
  
  let adaptiveInstructions = '';
  if (userId) {
    try {
      const learnerProfile = await getLearnerProfile(userId);
      adaptiveInstructions = buildAdaptiveSystemPrompt(learnerProfile);
    } catch (error:unknown) {
      console.warn('Could not load learner profile, using default teaching style', error);
    }
  }
  
  const resourcesText = lesson.resources
    .map(r => `- [${r.type}] ${r.title}: ${r.url}`)
    .join('\n');

  const prompt = CURRICULUM_LESSON_PROMPT
    .replace('{topic}', lesson.title)
    .replace('{description}', lesson.description || 'No description provided')
    .replace('{resources}', resourcesText || 'No external resources')
    .replace('{adaptiveInstructions}', adaptiveInstructions);

  try {
    const raw = await callGroq([
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: 4096 });
    
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const lessonData = JSON.parse(jsonMatch[0]);
    
    return {
      id: lessonId,
      topic: lesson.title,
      category: 'technology',
      difficulty,
      resources: lesson.resources,
      roadmapId,
      moduleId: module.id,
      moduleName: module.name,
      createdAt: new Date().toISOString(),
      ...lessonData,
    };
  } catch (error) {
    console.error('Error generating lesson from curriculum:', error);
    return createFallbackLesson(lesson, module, roadmapId, difficulty);
  }
}

function createFallbackLesson(
  lesson: Lesson,
  module: Module,
  roadmapId: string,
  difficulty: string
): LessonContent {
  return {
    id: lesson.id,
    title: lesson.title,
    topic: lesson.title,
    category: 'technology',
    difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
    estimatedTime: 15,
    roadmapId,
    moduleId: module.id,
    moduleName: module.name,
    resources: lesson.resources,
    createdAt: new Date().toISOString(),
    sections: [
      {
        id: 'section_1',
        title: `Introduction to ${lesson.title}`,
        content: lesson.description || `Let's learn about ${lesson.title}. This is an important concept in ${module.name}.`,
        tips: ['Take your time to understand each concept', 'Practice with the exercises below'],
      },
      {
        id: 'section_2',
        title: 'Learning Resources',
        content: `Here are some great resources to learn more about ${lesson.title}:\n\n${lesson.resources.map(r => `• **${r.title}** (${r.type}): ${r.url}`).join('\n')}`,
      },
    ],
    exercises: [
      {
        id: 'ex_1',
        type: 'multiple_choice',
        question: `What is ${lesson.title} primarily used for?`,
        options: [
          'Building user interfaces',
          'Managing application state',
          'Handling data operations',
          'All of the above, depending on context',
        ],
        correctAnswer: 3,
        hint: 'Think about the various use cases',
        explanation: `${lesson.title} can be used in multiple contexts depending on your needs.`,
        xpReward: lesson.xpReward,
      },
    ],
  };
}

export async function generateLesson(
  topic: string,
  category: 'field' | 'technology',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  specificFocus?: string,
  roadmapId?: string,
  lessonId?: string,
  userId?: string
): Promise<LessonContent> {
  if (roadmapId) {
    try {
      const roadmap = await loadRoadmap(roadmapId);
      
      if (roadmap && roadmap.modules.length > 0) {
        const targetLessonId = lessonId || roadmap.modules[0]?.lessons[0]?.id;
        
        if (targetLessonId) {
          return generateLessonFromCurriculum(roadmapId, targetLessonId, difficulty, userId);
        }
      }
    } catch (error) {
      console.warn('Could not load curriculum, falling back to AI generation:', error);
    }
  }
  
  return generateLessonPureAI(topic, category, difficulty, specificFocus, userId);
}

async function generateLessonPureAI(
  topic: string,
  category: 'field' | 'technology',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  specificFocus?: string,
  userId?: string
): Promise<LessonContent> {
  let adaptiveInstructions = '';
  if (userId) {
    try {
      const learnerProfile = await getLearnerProfile(userId);
      adaptiveInstructions = buildAdaptiveSystemPrompt(learnerProfile);
    } catch (error) {
      console.warn('Could not load learner profile', error);
    }
  }

  const prompt = `Generate a ${difficulty} level coding lesson about "${topic}" ${category === 'field' ? 'in the field of' : 'using'} ${topic}.
${specificFocus ? `Focus specifically on: ${specificFocus}` : ''}

${adaptiveInstructions}

The lesson should:
- Have 3-4 sections with clear explanations
- Include 2-3 practical code examples
- Have 3-4 exercises of varying difficulty
- Be suitable for ${difficulty} level learners

Return ONLY valid JSON with this structure:
{
  "title": "Lesson title",
  "estimatedTime": 15,
  "sections": [{ "id": "section_1", "title": "...", "content": "...", "codeExample": { "language": "javascript", "code": "...", "explanation": "..." }, "tips": ["..."] }],
  "exercises": [{ "id": "ex_1", "type": "multiple_choice", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "hint": "...", "explanation": "...", "xpReward": 10 }]
}`;

  try {
    const raw = await callGroq([
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: 4096 });
    
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const lessonData = JSON.parse(jsonMatch[0]);
    
    return {
      id: `lesson_${Date.now()}`,
      topic,
      category,
      difficulty,
      resources: [],
      createdAt: new Date().toISOString(),
      ...lessonData,
    };
  } catch (error) {
    console.error('Error generating lesson:', error);
    throw error;
  }
}

const COLLECTIONS = {
  LESSONS: 'tutorLessons',
  USER_LESSONS: 'userLessons',
} as const;

export async function saveLessonProgress(
  userId: string,
  lessonId: string,
  progress: number,
  currentSection: number,
  completedExercises: string[],
  xpEarned: number,
  lessonMeta?: { topic: string; title: string; category: 'field' | 'technology'; difficulty: string; totalSections: number; totalExercises: number }
): Promise<void> {
  const lessonRef = doc(db, COLLECTIONS.USER_LESSONS, `${userId}_${lessonId}`);
  
  const existingDoc = await getDoc(lessonRef);
  const isNewCompletion = !existingDoc.exists() || existingDoc.data()?.progress < 100;
  
  await setDoc(lessonRef, {
    lessonId,
    userId,
    progress,
    currentSection,
    completedExercises,
    xpEarned,
    updatedAt: serverTimestamp(),
    ...(lessonMeta && {
      topic: lessonMeta.topic,
      title: lessonMeta.title,
      category: lessonMeta.category,
      difficulty: lessonMeta.difficulty,
      totalSections: lessonMeta.totalSections,
      totalExercises: lessonMeta.totalExercises,
    }),
  }, { merge: true });

  if (progress === 100 && xpEarned > 0 && isNewCompletion) {
    const { addXP } = await import('./userProgressService');
    await addXP(userId, xpEarned);
  }
}

export async function getUserLessonProgress(
  userId: string,
  lessonId: string
): Promise<{ progress: number; currentSection: number; completedExercises: string[]; xpEarned: number } | null> {
  try {
    const lessonRef = doc(db, COLLECTIONS.USER_LESSONS, `${userId}_${lessonId}`);
    const docSnap = await getDoc(lessonRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      progress: data.progress || 0,
      currentSection: data.currentSection || 0,
      completedExercises: data.completedExercises || [],
      xpEarned: data.xpEarned || 0,
    };
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    return null;
  }
}

export async function getUserLessons(userId: string, limitCount: number = 10): Promise<TutorLesson[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_LESSONS),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as TutorLesson);
  } catch (error) {
    console.error('Error getting user lessons:', error);
    return [];
  }
}

export interface RecentLesson {
  lessonId: string;
  topic: string;
  title: string;
  category: 'field' | 'technology';
  difficulty: string;
  progress: number;
  currentSection: number;
  totalSections: number;
  totalExercises: number;
  completedExercises: string[];
  xpEarned: number;
  updatedAt: Date;
}

export async function getMostRecentLesson(userId: string): Promise<RecentLesson | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_LESSONS),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data();
    return {
      lessonId: data.lessonId,
      topic: data.topic || 'Unknown Topic',
      title: data.title || 'Continue Learning',
      category: data.category || 'technology',
      difficulty: data.difficulty || 'beginner',
      progress: data.progress || 0,
      currentSection: data.currentSection || 0,
      totalSections: data.totalSections || 1,
      totalExercises: data.totalExercises || 1,
      completedExercises: data.completedExercises || [],
      xpEarned: data.xpEarned || 0,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting most recent lesson:', error);
    return null;
  }
}

export async function generateQuizExplanation(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  topic: string,
  isCorrect: boolean
): Promise<{ explanation: string; furtherReading?: string; practiceExercise?: Exercise }> {
  const prompt = `The user ${isCorrect ? 'correctly answered' : 'incorrectly answered'} a quiz question.

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Topic: ${topic}

Provide:
1. A clear explanation of why the correct answer is right
2. ${!isCorrect ? 'Why the user\'s answer was wrong' : 'Additional context to reinforce learning'}
3. A brief suggestion for further reading or practice

Return JSON:
{
  "explanation": "Clear explanation...",
  "furtherReading": "Suggested topic or resource...",
  "practiceExercise": {
    "id": "practice_1",
    "type": "code_completion",
    "question": "Practice question...",
    "correctAnswer": "answer",
    "explanation": "Why this is correct...",
    "xpReward": 5
  }
}`;

  try {
    const raw = await callGroq([
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: 1024 });
    
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { explanation: 'Unable to generate explanation. Please try again.' };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating explanation:', error);
    return { explanation: 'Unable to generate explanation. Please try again.' };
  }
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  field: string;
  technologies: string[];
  lessons: { topic: string; difficulty: string; order: number }[];
  estimatedHours: number;
}

export async function generateLearningPath(
  field: string,
  currentSkillLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<LearningPath> {
  const prompt = `Create a structured learning path for someone wanting to learn ${field} at the ${currentSkillLevel} level.

Include:
- 5-8 progressive lessons
- Mix of concepts and practical skills
- Relevant technologies to learn
- Estimated time for each lesson

Return JSON:
{
  "name": "Path name",
  "description": "What you'll learn...",
  "technologies": ["tech1", "tech2"],
  "lessons": [
    { "topic": "Topic name", "difficulty": "beginner", "order": 1 }
  ],
  "estimatedHours": 10
}`;

  try {
    const raw = await callGroq([
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: 2048 });
    
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const pathData = JSON.parse(jsonMatch[0]);
    
    return {
      id: `path_${Date.now()}`,
      field,
      ...pathData,
    };
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw error;
  }
}

const LESSON_CACHE_KEY = 'codora_cached_lessons';

export function cacheLessons(lessons: LessonContent[]): void {
  try {
    const existing = getCachedLessons();
    const merged = [...existing, ...lessons].slice(-20);
    localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Error caching lessons:', error);
  }
}

export function getCachedLessons(): LessonContent[] {
  try {
    const cached = localStorage.getItem(LESSON_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error getting cached lessons:', error);
    return [];
  }
}

export function getCachedLesson(topic: string, difficulty: string): LessonContent | null {
  const lessons = getCachedLessons();
  return lessons.find(l => l.topic.toLowerCase() === topic.toLowerCase() && l.difficulty === difficulty) || null;
}