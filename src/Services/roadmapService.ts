// ============================================
// ROADMAP SERVICE
// Fetches roadmap data from roadmap.sh and generates curricula
// ============================================

import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Roadmap, Module, Lesson } from '../Types/curriculum';

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master';

const COLLECTIONS = {
  ROADMAPS: 'roadmaps',
} as const;

// ============================================
// AVAILABLE ROADMAPS FROM ROADMAP.SH
// ============================================

export const AVAILABLE_ROADMAPS = [
  { id: 'frontend', name: 'Frontend Development', type: 'field' as const },
  { id: 'backend', name: 'Backend Development', type: 'field' as const },
  { id: 'devops', name: 'DevOps', type: 'field' as const },
  { id: 'full-stack', name: 'Full Stack Development', type: 'field' as const },
  { id: 'ai-data-scientist', name: 'AI & Data Science', type: 'field' as const },
  { id: 'android', name: 'Android Development', type: 'technology' as const },
  { id: 'ios', name: 'iOS Development', type: 'technology' as const },
  { id: 'react', name: 'React', type: 'technology' as const },
  { id: 'vue', name: 'Vue.js', type: 'technology' as const },
  { id: 'angular', name: 'Angular', type: 'technology' as const },
  { id: 'javascript', name: 'JavaScript', type: 'technology' as const },
  { id: 'typescript', name: 'TypeScript', type: 'technology' as const },
  { id: 'nodejs', name: 'Node.js', type: 'technology' as const },
  { id: 'python', name: 'Python', type: 'technology' as const },
  { id: 'java', name: 'Java', type: 'technology' as const },
  { id: 'golang', name: 'Go', type: 'technology' as const },
  { id: 'rust', name: 'Rust', type: 'technology' as const },
  { id: 'sql', name: 'SQL', type: 'technology' as const },
  { id: 'postgresql-dba', name: 'PostgreSQL DBA', type: 'technology' as const },
  { id: 'docker', name: 'Docker', type: 'technology' as const },
  { id: 'kubernetes', name: 'Kubernetes', type: 'technology' as const },
  { id: 'aws', name: 'AWS', type: 'technology' as const },
  { id: 'cyber-security', name: 'Cyber Security', type: 'field' as const },
  { id: 'mlops', name: 'MLOps', type: 'field' as const },
  { id: 'blockchain', name: 'Blockchain', type: 'technology' as const },
  { id: 'graphql', name: 'GraphQL', type: 'technology' as const },
  { id: 'system-design', name: 'System Design', type: 'field' as const },
  { id: 'software-architect', name: 'Software Architecture', type: 'field' as const },
] as const;

export type RoadmapId = typeof AVAILABLE_ROADMAPS[number]['id'];


// ============================================
// ROADMAP.SH DATA TYPES
// ============================================

export interface RoadmapTopic {
  id: string;
  title: string;
  description?: string;
  children?: RoadmapTopic[];
  resources?: string[];
  order: number;
}

export interface RoadmapShData {
  id: string;
  title: string;
  description: string;
  topics: RoadmapTopic[];
  fetchedAt: string;
}

// ============================================
// FETCH ROADMAP CONTENT FROM GITHUB
// ============================================

async function fetchRoadmapContent(roadmapId: string): Promise<string | null> {
  try {
    // Try to fetch the roadmap content JSON
    const contentUrl = `${GITHUB_RAW_BASE}/src/data/roadmaps/${roadmapId}/content.json`;
    const response = await fetch(contentUrl);
    
    if (!response.ok) {
      console.warn(`Could not fetch content.json for ${roadmapId}`);
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error fetching roadmap content for ${roadmapId}:`, error);
    return null;
  }
}

// ============================================
// PARSE ROADMAP TOPICS FROM CONTENT
// ============================================

function parseRoadmapTopics(contentJson: string, roadmapId: string): RoadmapTopic[] {
  try {
    const content = JSON.parse(contentJson);
    const topics: RoadmapTopic[] = [];
    
    // The structure varies by roadmap, but generally has groups/topics
    if (content.groups) {
      Object.entries(content.groups).forEach(([groupId, group]: [string, any], index) => {
        topics.push({
          id: groupId,
          title: group.title || groupId,
          description: group.description,
          order: index,
          children: group.items?.map((item: any, itemIndex: number) => ({
            id: item.id || `${groupId}-${itemIndex}`,
            title: item.title || item.label,
            description: item.description,
            order: itemIndex,
          })) || [],
        });
      });
    }
    
    return topics;
  } catch (error) {
    console.error(`Error parsing roadmap topics for ${roadmapId}:`, error);
    return [];
  }
}


// ============================================
// FETCH ROADMAP.SH DATA
// ============================================

export async function fetchRoadmapShData(roadmapId: RoadmapId): Promise<RoadmapShData | null> {
  const roadmapInfo = AVAILABLE_ROADMAPS.find(r => r.id === roadmapId);
  if (!roadmapInfo) {
    console.error(`Unknown roadmap: ${roadmapId}`);
    return null;
  }

  // Try to fetch from GitHub
  const content = await fetchRoadmapContent(roadmapId);
  
  if (content) {
    const topics = parseRoadmapTopics(content, roadmapId);
    return {
      id: roadmapId,
      title: roadmapInfo.name,
      description: `Learn ${roadmapInfo.name} with a structured curriculum based on roadmap.sh`,
      topics,
      fetchedAt: new Date().toISOString(),
    };
  }

  // Fallback: Use AI to generate topics based on roadmap.sh structure
  return await generateRoadmapTopicsWithAI(roadmapId, roadmapInfo.name);
}

// ============================================
// AI FALLBACK FOR TOPIC GENERATION
// ============================================

async function generateRoadmapTopicsWithAI(
  roadmapId: string,
  roadmapName: string
): Promise<RoadmapShData | null> {
  const prompt = `Based on roadmap.sh's ${roadmapName} roadmap, list the main topics and subtopics in order.
  
Return JSON in this exact format:
{
  "topics": [
    {
      "id": "topic-id",
      "title": "Topic Name",
      "description": "Brief description",
      "order": 0,
      "children": [
        { "id": "subtopic-id", "title": "Subtopic Name", "order": 0 }
      ]
    }
  ]
}

Include all major sections from the roadmap.sh ${roadmapName} roadmap in the correct learning order.`;

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
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('No valid JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      id: roadmapId,
      title: roadmapName,
      description: `Learn ${roadmapName} with a structured curriculum based on roadmap.sh`,
      topics: parsed.topics || [],
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating roadmap topics with AI:', error);
    return null;
  }
}


// ============================================
// CONVERT ROADMAP.SH DATA TO CURRICULUM
// ============================================

const CURRICULUM_SYSTEM_PROMPT = `You are an expert curriculum designer. Given a topic from roadmap.sh, create detailed lesson content.

OUTPUT FORMAT (JSON only):
{
  "lessons": [
    {
      "id": "lesson_id",
      "name": "Lesson Name",
      "description": "What the learner will understand",
      "order": 1,
      "estimatedMinutes": 30,
      "type": "concept",
      "keyPoints": ["point1", "point2"],
      "practicePrompts": ["Try this...", "Build a..."]
    }
  ]
}`;

export async function convertTopicToLessons(
  topic: RoadmapTopic,
  roadmapName: string
): Promise<Lesson[]> {
  const prompt = `Create 3-5 detailed lessons for the topic "${topic.title}" from the ${roadmapName} roadmap.
  
Topic description: ${topic.description || 'N/A'}
Subtopics to cover: ${topic.children?.map(c => c.title).join(', ') || 'General overview'}

Each lesson should:
- Build on the previous one
- Include practical exercises
- Be completable in 20-45 minutes`;

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
          contents: [{ role: 'user', parts: [{ text: `${CURRICULUM_SYSTEM_PROMPT}\n\n${prompt}` }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.lessons || []).map((l: any, i: number) => ({
      ...l,
      id: l.id || `${topic.id}_lesson_${i + 1}`,
      moduleId: topic.id,
      content: { sections: [], codeExamples: [], resources: [] },
      exercises: [],
    }));
  } catch (error) {
    console.error('Error converting topic to lessons:', error);
    return [];
  }
}


// ============================================
// GENERATE CURRICULUM FROM ROADMAP.SH
// ============================================

export async function generateCurriculumFromRoadmapSh(
  roadmapId: RoadmapId,
  selectedTopics?: string[], // Optional: only generate for specific topics
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<Roadmap | null> {
  const roadmapData = await fetchRoadmapShData(roadmapId);
  if (!roadmapData) return null;

  const roadmapInfo = AVAILABLE_ROADMAPS.find(r => r.id === roadmapId)!;
  const now = new Date().toISOString();

  // Filter topics if specific ones were selected
  const topicsToProcess = selectedTopics
    ? roadmapData.topics.filter(t => selectedTopics.includes(t.id))
    : roadmapData.topics;

  // Convert topics to modules with lessons
  const modules: Module[] = await Promise.all(
    topicsToProcess.map(async (topic, index) => {
      const lessons = await convertTopicToLessons(topic, roadmapData.title);
      
      return {
        id: `module_${topic.id}`,
        roadmapId: `roadmap_${roadmapId}_${Date.now()}`,
        name: topic.title,
        description: topic.description || `Learn ${topic.title}`,
        order: index + 1,
        estimatedHours: Math.ceil(lessons.reduce((acc, l) => acc + (l.estimatedMinutes || 30), 0) / 60),
        isOptional: false,
        prerequisites: index > 0 ? [`module_${topicsToProcess[index - 1].id}`] : [],
        lessons,
      };
    })
  );

  const roadmap: Roadmap = {
    id: `roadmap_${roadmapId}_${Date.now()}`,
    name: roadmapData.title,
    description: roadmapData.description,
    type: roadmapInfo.type,
    difficulty,
    estimatedWeeks: Math.ceil(modules.length * 1.5),
    prerequisites: [],
    modules,
    createdAt: now,
    updatedAt: now,
  };

  return roadmap;
}


// ============================================
// ROADMAP PERSISTENCE
// ============================================

export async function saveRoadmap(roadmap: Roadmap): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.ROADMAPS, roadmap.id), roadmap);
}

export async function getRoadmap(roadmapId: string): Promise<Roadmap | null> {
  try {
    const roadmapRef = doc(db, COLLECTIONS.ROADMAPS, roadmapId);
    const snapshot = await getDoc(roadmapRef);

    if (!snapshot.exists()) return null;
    return snapshot.data() as Roadmap;
  } catch (error) {
    console.error('Error getting roadmap:', error);
    return null;
  }
}

export async function getRoadmapByTopic(
  topic: string,
  type: 'field' | 'technology'
): Promise<Roadmap | null> {
  try {
    const roadmapsRef = collection(db, COLLECTIONS.ROADMAPS);
    const q = query(
      roadmapsRef,
      where('name', '==', topic),
      where('type', '==', type)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return snapshot.docs[0].data() as Roadmap;
  } catch (error) {
    console.error('Error getting roadmap by topic:', error);
    return null;
  }
}

// ============================================
// GET OR CREATE ROADMAP FROM ROADMAP.SH
// ============================================

export async function getOrCreateRoadmapFromRoadmapSh(
  roadmapId: RoadmapId,
  selectedTopics?: string[],
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<Roadmap | null> {
  const roadmapInfo = AVAILABLE_ROADMAPS.find(r => r.id === roadmapId);
  if (!roadmapInfo) return null;

  // Check if roadmap exists
  const existing = await getRoadmapByTopic(roadmapInfo.name, roadmapInfo.type);
  if (existing && !selectedTopics) return existing;

  // Generate new roadmap from roadmap.sh data
  const roadmap = await generateCurriculumFromRoadmapSh(roadmapId, selectedTopics, difficulty);
  if (!roadmap) return null;

  await saveRoadmap(roadmap);
  return roadmap;
}

// ============================================
// LEGACY SUPPORT - AI-ONLY GENERATION
// ============================================

export async function generateRoadmap(
  topic: string,
  type: 'field' | 'technology',
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Roadmap> {
  // Check if this matches a roadmap.sh roadmap
  const matchingRoadmap = AVAILABLE_ROADMAPS.find(
    r => r.name.toLowerCase() === topic.toLowerCase() || r.id === topic.toLowerCase()
  );

  if (matchingRoadmap) {
    const roadmap = await generateCurriculumFromRoadmapSh(matchingRoadmap.id, undefined, difficulty);
    if (roadmap) return roadmap;
  }

  // Fallback to pure AI generation for custom topics
  return generateCustomRoadmapWithAI(topic, type, difficulty);
}


// ============================================
// CUSTOM AI ROADMAP GENERATION (FALLBACK)
// ============================================

const ROADMAP_SYSTEM_PROMPT = `You are an expert curriculum designer creating structured learning roadmaps for developers.

RULES:
1. Create logical, dependency-aware learning paths
2. Start with fundamentals before advanced topics
3. Each module should build on previous knowledge
4. Include practical exercises at every step
5. Estimate realistic time requirements
6. Mark optional/advanced content clearly

OUTPUT FORMAT (JSON only):
{
  "name": "Technology/Field Name",
  "description": "What the learner will master",
  "estimatedWeeks": 8,
  "difficulty": "beginner",
  "prerequisites": [],
  "modules": [
    {
      "id": "module_1",
      "name": "Module Name",
      "description": "What this module covers",
      "order": 1,
      "estimatedHours": 4,
      "isOptional": false,
      "prerequisites": [],
      "lessons": [
        {
          "id": "lesson_1_1",
          "name": "Lesson Name",
          "description": "Lesson objective",
          "order": 1,
          "estimatedMinutes": 30,
          "type": "concept"
        }
      ]
    }
  ]
}`;

async function generateCustomRoadmapWithAI(
  topic: string,
  type: 'field' | 'technology',
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Roadmap> {
  const prompt = `Create a comprehensive learning roadmap for "${topic}" (${type}) at the ${difficulty} level.

Requirements:
- 6-10 modules covering all essential concepts
- Each module should have 3-5 lessons
- Progress from fundamentals to advanced topics
- Include practical projects in later modules
- Mark advanced/optional content appropriately

The roadmap should ensure ZERO knowledge gaps - a learner following this path should become highly competent in ${topic}.`;

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': AI_API_KEY as string,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${ROADMAP_SYSTEM_PROMPT}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) throw new Error('No valid JSON in response');

  const roadmapData = JSON.parse(jsonMatch[0]);
  const now = new Date().toISOString();

  const roadmap: Roadmap = {
    id: `roadmap_${topic.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    type,
    createdAt: now,
    updatedAt: now,
    ...roadmapData,
    modules: roadmapData.modules.map((m: Module, i: number) => ({
      ...m,
      id: m.id || `module_${i + 1}`,
      roadmapId: '',
      lessons: m.lessons.map((l: Lesson, j: number) => ({
        ...l,
        id: l.id || `lesson_${i + 1}_${j + 1}`,
        moduleId: m.id || `module_${i + 1}`,
        content: { sections: [], codeExamples: [], resources: [] },
        exercises: [],
      })),
    })),
  };

  roadmap.modules = roadmap.modules.map((m) => ({ ...m, roadmapId: roadmap.id }));
  return roadmap;
}

// ============================================
// GET OR CREATE ROADMAP (UNIFIED)
// ============================================

export async function getOrCreateRoadmap(
  topic: string,
  type: 'field' | 'technology',
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Roadmap> {
  // Check if roadmap exists
  const existing = await getRoadmapByTopic(topic, type);
  if (existing) return existing;

  // Generate new roadmap
  const roadmap = await generateRoadmap(topic, type, difficulty);
  await saveRoadmap(roadmap);

  return roadmap;
}
