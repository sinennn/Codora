import curriculumIndex from '../Data/Curriculum/index.json';
import projectsData from '../Data/Curriculum/projects.json';

export interface LessonResource {
  type: string;
  title: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  resources: LessonResource[];
  xpReward: number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  lessons: Lesson[];
}

export interface Roadmap {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  modules: Module[];
  relatedRoadmaps: string[];
}

export interface RoadmapSummary {
  id: string;
  name: string;
  description: string;
  moduleCount: number;
  lessonCount: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  skills: string[];
  roadmapIds: string[];
  content: string;
}

const roadmapCache: Map<string, Roadmap> = new Map();

export function getRoadmapIndex(): RoadmapSummary[] {
  return curriculumIndex as RoadmapSummary[];
}

export async function loadRoadmap(roadmapId: string): Promise<Roadmap | null> {
  if (roadmapCache.has(roadmapId)) {
    return roadmapCache.get(roadmapId)!;
  }

  try {
    const roadmapModule = await import(`../Data/Curriculum/${roadmapId}.json`);
    const roadmap = roadmapModule.default as Roadmap;
    roadmapCache.set(roadmapId, roadmap);
    return roadmap;
  } catch (error) {
    console.error(`Failed to load roadmap: ${roadmapId}`, error);
    return null;
  }
}

export async function getModule(roadmapId: string, moduleId: string): Promise<Module | null> {
  const roadmap = await loadRoadmap(roadmapId);
  if (!roadmap) return null;
  return roadmap.modules.find(m => m.id === moduleId) || null;
}

export async function getLesson(roadmapId: string, lessonId: string): Promise<{ lesson: Lesson; module: Module } | null> {
  const roadmap = await loadRoadmap(roadmapId);
  if (!roadmap) return null;
  
  for (const module of roadmap.modules) {
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (lesson) {
      return { lesson, module };
    }
  }
  return null;
}

export async function getNextLesson(
  roadmapId: string, 
  currentLessonId: string
): Promise<{ lesson: Lesson; module: Module } | null> {
  const roadmap = await loadRoadmap(roadmapId);
  if (!roadmap) return null;
  
  let foundCurrent = false;
  
  for (const module of roadmap.modules) {
    for (let i = 0; i < module.lessons.length; i++) {
      if (foundCurrent) {
        return { lesson: module.lessons[i], module };
      }
      if (module.lessons[i].id === currentLessonId) {
        foundCurrent = true;
        if (i + 1 < module.lessons.length) {
          return { lesson: module.lessons[i + 1], module };
        }
      }
    }
  }
  return null;
}

export function getProjects(): Project[] {
  return projectsData as Project[];
}

export function getProjectsForRoadmap(roadmapId: string): Project[] {
  return (projectsData as Project[]).filter(p => 
    p.roadmapIds.some(id => id.toLowerCase().includes(roadmapId.toLowerCase()))
  );
}

export function getProjectsByDifficulty(difficulty: string): Project[] {
  return (projectsData as Project[]).filter(p => 
    p.difficulty.toLowerCase() === difficulty.toLowerCase()
  );
}

export async function searchLessons(query: string): Promise<Array<{
  roadmapId: string;
  roadmapName: string;
  module: Module;
  lesson: Lesson;
}>> {
  const results: Array<{
    roadmapId: string;
    roadmapName: string;
    module: Module;
    lesson: Lesson;
  }> = [];
  
  const lowerQuery = query.toLowerCase();
  
  for (const summary of curriculumIndex) {
    const roadmap = await loadRoadmap(summary.id);
    if (!roadmap) continue;
    
    for (const module of roadmap.modules) {
      for (const lesson of module.lessons) {
        if (
          lesson.title.toLowerCase().includes(lowerQuery) ||
          lesson.description.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            roadmapId: roadmap.id,
            roadmapName: roadmap.name,
            module,
            lesson,
          });
        }
      }
    }
  }
  return results;
}

export async function getRoadmapTotalXP(roadmapId: string): Promise<number> {
  const roadmap = await loadRoadmap(roadmapId);
  if (!roadmap) return 0;
  
  return roadmap.modules.reduce((total, module) => 
    total + module.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0), 0
  );
}

export function calculateRoadmapProgress(
  roadmap: Roadmap,
  completedLessonIds: string[]
): {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  totalXP: number;
  earnedXP: number;
} {
  let totalLessons = 0;
  let completedLessons = 0;
  let totalXP = 0;
  let earnedXP = 0;
  
  for (const module of roadmap.modules) {
    for (const lesson of module.lessons) {
      totalLessons++;
      totalXP += lesson.xpReward;
      
      if (completedLessonIds.includes(lesson.id)) {
        completedLessons++;
        earnedXP += lesson.xpReward;
      }
    }
  }
  
  return {
    totalLessons,
    completedLessons,
    progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    totalXP,
    earnedXP,
  };
}