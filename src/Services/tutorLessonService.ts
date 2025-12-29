// ============================================
// AI TUTOR LESSON SERVICE
// Generates dynamic coding lessons based on selected field/technology
// ============================================

import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;

// ============================================
// TYPES
// ============================================

export interface LessonContent {
  id: string;
  title: string;
  topic: string;
  category: 'field' | 'technology';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  sections: LessonSection[];
  exercises: Exercise[];
  createdAt: string;
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
  progress: number; // 0-100
  currentSection: number;
  completedExercises: string[];
  xpEarned: number;
  startedAt: string;
  completedAt?: string;
}

// ============================================
// LESSON GENERATION PROMPTS
// ============================================

const LESSON_SYSTEM_PROMPT = `You are an expert coding instructor creating structured lessons. Generate comprehensive, practical lessons that teach real coding skills.

RULES:
1. Content must be accurate and up-to-date
2. Include practical, runnable code examples
3. Explain concepts clearly with real-world analogies
4. Progress from simple to complex
5. Include common pitfalls and best practices
6. Make exercises progressively challenging

OUTPUT FORMAT (JSON only):
{
  "title": "Lesson title",
  "estimatedTime": 15,
  "sections": [
    {
      "id": "section_1",
      "title": "Section title",
      "content": "Detailed explanation with markdown formatting",
      "codeExample": {
        "language": "javascript",
        "code": "// Actual runnable code",
        "explanation": "Line-by-line explanation"
      },
      "tips": ["Practical tip 1", "Practical tip 2"]
    }
  ],
  "exercises": [
    {
      "id": "ex_1",
      "type": "code_completion",
      "question": "Complete the function to...",
      "codeSnippet": "function example() {\\n  // Your code here\\n}",
      "correctAnswer": "return value;",
      "hint": "Think about...",
      "explanation": "The correct answer is... because...",
      "xpReward": 10
    }
  ]
}`;

// ============================================
// LESSON GENERATION
// ============================================

export async function generateLesson(
  topic: string,
  category: 'field' | 'technology',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  specificFocus?: string
): Promise<LessonContent> {
  const prompt = `Generate a ${difficulty} level coding lesson about "${topic}" ${category === 'field' ? 'in the field of' : 'using'} ${topic}.
${specificFocus ? `Focus specifically on: ${specificFocus}` : ''}

The lesson should:
- Have 3-4 sections with clear explanations
- Include 2-3 practical code examples
- Have 3-4 exercises of varying difficulty
- Be suitable for ${difficulty} level learners

Return ONLY valid JSON matching the specified format.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': AI_API_KEY as string,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${LESSON_SYSTEM_PROMPT}\n\n${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const lessonData = JSON.parse(jsonMatch[0]);
    
    return {
      id: `lesson_${Date.now()}`,
      topic,
      category,
      difficulty,
      createdAt: new Date().toISOString(),
      ...lessonData,
    };
  } catch (error) {
    console.error('Error generating lesson:', error);
    throw error;
  }
}


// ============================================
// LESSON PERSISTENCE
// ============================================

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

// Get the most recent lesson for "Continue Learning" feature
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

// ============================================
// QUIZ EXPLANATION GENERATION
// ============================================

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
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': AI_API_KEY as string,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { explanation: 'Unable to generate explanation. Please try again.' };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating explanation:', error);
    return { explanation: 'Unable to generate explanation. Please try again.' };
  }
}

// ============================================
// LEARNING PATH GENERATION
// ============================================

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
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': AI_API_KEY as string,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
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

// ============================================
// OFFLINE CACHE FOR LESSONS
// ============================================

const LESSON_CACHE_KEY = 'codora_cached_lessons';

export function cacheLessons(lessons: LessonContent[]): void {
  try {
    const existing = getCachedLessons();
    const merged = [...existing, ...lessons].slice(-20); // Keep last 20
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
