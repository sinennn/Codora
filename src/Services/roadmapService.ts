import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Roadmap, Module, Lesson } from '../Types/curriculum';
import { 
  getRoadmapIndex, 
  loadRoadmap as loadCurriculumRoadmap,
  type Roadmap as CurriculumRoadmap
} from './curriculumDataService';
import { callGroq } from '../lib/groqClient';

const COLLECTIONS = {
  ROADMAPS: 'roadmaps',
} as const;

export function getAvailableRoadmaps() {
  return getRoadmapIndex();
}

function convertCurriculumToRoadmap(
  curriculumRoadmap: CurriculumRoadmap,
  type: 'field' | 'technology',
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Roadmap {
  const now = new Date().toISOString();
  
  const modules: Module[] = curriculumRoadmap.modules.map((module, moduleIndex) => ({
    id: module.id,
    roadmapId: curriculumRoadmap.id,
    name: module.name,
    description: module.description || `Learn ${module.name}`,
    order: moduleIndex + 1,
    estimatedHours: Math.ceil(module.lessons.length * 0.5),
    isOptional: false,
    prerequisites: moduleIndex > 0 ? [curriculumRoadmap.modules[moduleIndex - 1].id] : [],
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      id: lesson.id,
      moduleId: module.id,
      name: lesson.title,
      description: lesson.description || `Learn about ${lesson.title}`,
      order: lessonIndex + 1,
      estimatedMinutes: 30,
      type: 'concept' as const,
      content: {
        sections: [],
        codeExamples: [],
        resources: lesson.resources.map((r, i) => ({
          id: `resource_${i}`,
          title: r.title,
          url: r.url,
          type: r.type as 'documentation' | 'article' | 'video' | 'tool',
        })),
      },
      exercises: [],
    })),
  }));

  return {
    id: curriculumRoadmap.id,
    name: curriculumRoadmap.name,
    description: curriculumRoadmap.description,
    type,
    difficulty,
    estimatedWeeks: Math.ceil(curriculumRoadmap.estimatedHours / 10),
    prerequisites: [],
    modules,
    createdAt: now,
    updatedAt: now,
  };
}

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

export async function getOrCreateRoadmap(
  topic: string,
  type: 'field' | 'technology',
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Roadmap> {
  const existing = await getRoadmapByTopic(topic, type);
  if (existing) return existing;

  const availableRoadmaps = getRoadmapIndex();
  const matchingCurriculum = availableRoadmaps.find(
    r => r.name.toLowerCase() === topic.toLowerCase() || 
         r.id === topic.toLowerCase() ||
         topic.toLowerCase().includes(r.name.toLowerCase()) ||
         r.name.toLowerCase().includes(topic.toLowerCase())
  );

  if (matchingCurriculum) {
    const curriculumData = await loadCurriculumRoadmap(matchingCurriculum.id);
    if (curriculumData) {
      const roadmap = convertCurriculumToRoadmap(curriculumData, type, difficulty);
      await saveRoadmap(roadmap);
      return roadmap;
    }
  }

  const roadmap = await generateCustomRoadmapWithAI(topic, type, difficulty);
  await saveRoadmap(roadmap);
  return roadmap;
}

const ROADMAP_SYSTEM_PROMPT = `You are an expert curriculum designer creating structured learning roadmaps for developers.

RULES:
1. Create logical, dependency-aware learning paths
2. Start with fundamentals before advanced topics
3. Each module should build on previous knowledge
4. Include practical exercises at every step
5. Estimate realistic time requirements

OUTPUT FORMAT (JSON only):
{
  "name": "Technology/Field Name",
  "description": "What the learner will master",
  "estimatedWeeks": 8,
  "modules": [
    {
      "id": "module_1",
      "name": "Module Name",
      "description": "What this module covers",
      "order": 1,
      "estimatedHours": 4,
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
  const prompt = `Create a learning roadmap for "${topic}" (${type}) at the ${difficulty} level.
Include 5-8 modules with 3-5 lessons each, progressing from fundamentals to advanced topics.`;

  const raw = await callGroq([
    { role: 'system', content: ROADMAP_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ], { temperature: 0.7, maxTokens: 4096 });
  
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) throw new Error('No valid JSON in response');

  const roadmapData = JSON.parse(jsonMatch[0]);
  const now = new Date().toISOString();

  const roadmap: Roadmap = {
    id: `roadmap_${topic.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    type,
    difficulty,
    createdAt: now,
    updatedAt: now,
    prerequisites: [],
    ...roadmapData,
    modules: roadmapData.modules.map((m: Module, i: number) => ({
      ...m,
      id: m.id || `module_${i + 1}`,
      roadmapId: '',
      isOptional: false,
      prerequisites: i > 0 ? [`module_${i}`] : [],
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