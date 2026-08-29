import { db } from '../../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import type {
  Roadmap,
  UserEnrollment,
  UserCurriculumProgress,
  ModuleProgress,
  LessonProgress,
  ExerciseAttempt,
  LearningSession,
  MentorFeedback,
} from '../Types/curriculum';

// ============================================
// COLLECTIONS
// ============================================

const COLLECTIONS = {
  ROADMAPS: 'roadmaps',
  ENROLLMENTS: 'userEnrollments',
  PROGRESS: 'curriculumProgress',
  SESSIONS: 'learningSessions',
} as const;

// ============================================
// ENROLLMENT MANAGEMENT
// ============================================

export async function canEnrollInRoadmap(userId: string): Promise<{
  allowed: boolean;
  message?: string;
  currentEnrollment?: UserEnrollment;
}> {
  try {
    const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
    const q = query(
      enrollmentsRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { allowed: true };
    }

    const enrollment = snapshot.docs[0].data() as UserEnrollment;
    const lockedUntil = new Date(enrollment.lockedUntil);
    const now = new Date();

    if (now < lockedUntil) {
      const daysRemaining = Math.ceil(
        (lockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        allowed: false,
        message: `You're committed to ${enrollment.roadmapName} for ${daysRemaining} more day${daysRemaining > 1 ? 's' : ''}. Stay focused!`,
        currentEnrollment: enrollment,
      };
    }

    return { allowed: true, currentEnrollment: enrollment };
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return { allowed: false, message: 'Unable to check enrollment status' };
  }
}


export async function enrollInRoadmap(
  userId: string,
  roadmap: Roadmap
): Promise<{ success: boolean; enrollment?: UserEnrollment; error?: string }> {
  try {
    const canEnroll = await canEnrollInRoadmap(userId);
    if (!canEnroll.allowed) {
      return { success: false, error: canEnroll.message };
    }

    const now = new Date();
    const lockedUntil = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const enrollment: UserEnrollment = {
      id: `${userId}_${roadmap.id}`,
      userId,
      roadmapId: roadmap.id,
      roadmapName: roadmap.name,
      roadmapType: roadmap.type,
      enrolledAt: now.toISOString(),
      lockedUntil: lockedUntil.toISOString(),
      status: 'active',
    };

    await setDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollment.id), enrollment);
    await initializeProgress(userId, roadmap);

    return { success: true, enrollment };
  } catch (error) {
    console.error('Error enrolling in roadmap:', error);
    return { success: false, error: 'Failed to enroll in roadmap' };
  }
}

export async function getActiveEnrollment(userId: string): Promise<UserEnrollment | null> {
  try {
    const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
    const q = query(
      enrollmentsRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return snapshot.docs[0].data() as UserEnrollment;
  } catch (error) {
    console.error('Error getting active enrollment:', error);
    return null;
  }
}

// ============================================
// PROGRESS INITIALIZATION & TRACKING
// ============================================

async function initializeProgress(userId: string, roadmap: Roadmap): Promise<void> {
  const now = new Date().toISOString();

  const moduleProgress: ModuleProgress[] = roadmap.modules.map((module, index) => ({
    moduleId: module.id,
    moduleName: module.name,
    status: index === 0 ? 'available' : 'locked',
    progress: 0,
    lessonsProgress: module.lessons.map((lesson, lessonIndex) => ({
      lessonId: lesson.id,
      lessonName: lesson.name,
      status: index === 0 && lessonIndex === 0 ? 'available' : 'locked',
      progress: 0,
      sectionsCompleted: [],
      exerciseAttempts: [],
      timeSpent: 0,
    })),
  }));

  const progress: UserCurriculumProgress = {
    id: `${userId}_${roadmap.id}`,
    userId,
    roadmapId: roadmap.id,
    overallProgress: 0,
    currentModuleId: roadmap.modules[0]?.id || '',
    currentLessonId: roadmap.modules[0]?.lessons[0]?.id || '',
    moduleProgress,
    totalXpEarned: 0,
    totalTimeSpent: 0,
    lessonsCompleted: 0,
    exercisesCompleted: 0,
    exercisesAttempted: 0,
    startedAt: now,
    lastActivityAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.PROGRESS, progress.id), progress);
}

export async function getCurriculumProgress(
  userId: string,
  roadmapId: string
): Promise<UserCurriculumProgress | null> {
  try {
    const progressRef = doc(db, COLLECTIONS.PROGRESS, `${userId}_${roadmapId}`);
    const snapshot = await getDoc(progressRef);

    if (!snapshot.exists()) return null;
    return snapshot.data() as UserCurriculumProgress;
  } catch (error) {
    console.error('Error getting curriculum progress:', error);
    return null;
  }
}

export async function getNextLesson(
  userId: string,
  roadmapId: string
): Promise<{ moduleId: string; lessonId: string; moduleName: string; lessonName: string } | null> {
  try {
    const progress = await getCurriculumProgress(userId, roadmapId);
    if (!progress) return null;

    for (const module of progress.moduleProgress) {
      if (module.status === 'completed') continue;

      for (const lesson of module.lessonsProgress) {
        if (lesson.status !== 'completed') {
          return {
            moduleId: module.moduleId,
            lessonId: lesson.lessonId,
            moduleName: module.moduleName,
            lessonName: lesson.lessonName,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting next lesson:', error);
    return null;
  }
}


export async function updateLessonProgress(
  userId: string,
  roadmapId: string,
  moduleId: string,
  lessonId: string,
  updates: Partial<LessonProgress>
): Promise<void> {
  try {
    const progressRef = doc(db, COLLECTIONS.PROGRESS, `${userId}_${roadmapId}`);
    const snapshot = await getDoc(progressRef);

    if (!snapshot.exists()) return;

    const progress = snapshot.data() as UserCurriculumProgress;
    const now = new Date().toISOString();

    const moduleIndex = progress.moduleProgress.findIndex((m) => m.moduleId === moduleId);
    if (moduleIndex === -1) return;

    const lessonIndex = progress.moduleProgress[moduleIndex].lessonsProgress.findIndex(
      (l) => l.lessonId === lessonId
    );
    if (lessonIndex === -1) return;

    const lessonProgress = progress.moduleProgress[moduleIndex].lessonsProgress[lessonIndex];
    Object.assign(lessonProgress, updates, { lastAccessedAt: now });

    if (updates.status === 'completed') {
      lessonProgress.completedAt = now;
      progress.lessonsCompleted += 1;

      const allLessonsComplete = progress.moduleProgress[moduleIndex].lessonsProgress.every(
        (l) => l.status === 'completed'
      );

      if (allLessonsComplete) {
        progress.moduleProgress[moduleIndex].status = 'completed';
        progress.moduleProgress[moduleIndex].completedAt = now;

        if (moduleIndex + 1 < progress.moduleProgress.length) {
          progress.moduleProgress[moduleIndex + 1].status = 'available';
          progress.moduleProgress[moduleIndex + 1].lessonsProgress[0].status = 'available';
        }
      } else {
        if (lessonIndex + 1 < progress.moduleProgress[moduleIndex].lessonsProgress.length) {
          progress.moduleProgress[moduleIndex].lessonsProgress[lessonIndex + 1].status = 'available';
        }
      }
    }

    const totalLessons = progress.moduleProgress.reduce(
      (sum, m) => sum + m.lessonsProgress.length,
      0
    );
    progress.overallProgress = Math.round((progress.lessonsCompleted / totalLessons) * 100);
    progress.lastActivityAt = now;

    await updateDoc(progressRef, { ...progress });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
  }
}

export async function recordExerciseAttempt(
  userId: string,
  roadmapId: string,
  moduleId: string,
  lessonId: string,
  attempt: ExerciseAttempt
): Promise<void> {
  try {
    const progressRef = doc(db, COLLECTIONS.PROGRESS, `${userId}_${roadmapId}`);
    const snapshot = await getDoc(progressRef);

    if (!snapshot.exists()) return;

    const progress = snapshot.data() as UserCurriculumProgress;

    const moduleIndex = progress.moduleProgress.findIndex((m) => m.moduleId === moduleId);
    if (moduleIndex === -1) return;

    const lessonIndex = progress.moduleProgress[moduleIndex].lessonsProgress.findIndex(
      (l) => l.lessonId === lessonId
    );
    if (lessonIndex === -1) return;

    const lessonProgress = progress.moduleProgress[moduleIndex].lessonsProgress[lessonIndex];

    const existingAttemptIndex = lessonProgress.exerciseAttempts.findIndex(
      (a) => a.exerciseId === attempt.exerciseId
    );

    if (existingAttemptIndex >= 0) {
      lessonProgress.exerciseAttempts[existingAttemptIndex] = {
        ...lessonProgress.exerciseAttempts[existingAttemptIndex],
        attempts: lessonProgress.exerciseAttempts[existingAttemptIndex].attempts + 1,
        isCorrect: attempt.isCorrect,
        userAnswer: attempt.userAnswer,
        hintsUsed: attempt.hintsUsed,
        timeSpent:
          lessonProgress.exerciseAttempts[existingAttemptIndex].timeSpent + attempt.timeSpent,
        completedAt: attempt.isCorrect ? attempt.attemptedAt : undefined,
      };
    } else {
      lessonProgress.exerciseAttempts.push(attempt);
      progress.exercisesAttempted += 1;
    }

    if (attempt.isCorrect) {
      progress.exercisesCompleted += 1;
    }

    progress.lastActivityAt = new Date().toISOString();

    await updateDoc(progressRef, { ...progress });
  } catch (error) {
    console.error('Error recording exercise attempt:', error);
  }
}


// ============================================
// LEARNING SESSION TRACKING
// ============================================

export async function startLearningSession(
  userId: string,
  roadmapId: string,
  moduleId: string,
  lessonId: string
): Promise<string> {
  const sessionId = `${userId}_${Date.now()}`;
  const session: LearningSession = {
    id: sessionId,
    userId,
    roadmapId,
    moduleId,
    lessonId,
    startedAt: new Date().toISOString(),
    duration: 0,
    sectionsViewed: [],
    exercisesAttempted: [],
    exercisesCompleted: [],
    xpEarned: 0,
  };

  await setDoc(doc(db, COLLECTIONS.SESSIONS, sessionId), session);
  return sessionId;
}

export async function endLearningSession(
  sessionId: string,
  updates: Partial<LearningSession>
): Promise<void> {
  try {
    const sessionRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
    const now = new Date().toISOString();

    await updateDoc(sessionRef, {
      ...updates,
      endedAt: now,
    });
  } catch (error) {
    console.error('Error ending learning session:', error);
  }
}

// ============================================
// MENTOR FEEDBACK
// ============================================

export function generateMentorFeedback(context: {
  type: 'exercise_correct' | 'exercise_incorrect' | 'lesson_complete' | 'module_complete' | 'stuck' | 'returning';
  attempts?: number;
  streak?: number;
  lessonName?: string;
  moduleName?: string;
  daysAway?: number;
}): MentorFeedback {
  switch (context.type) {
    case 'exercise_correct':
      if (context.attempts === 1) {
        return { type: 'celebration', message: "Perfect on the first try! You're really getting this. 🎯" };
      }
      return { type: 'encouragement', message: 'You got it! Persistence pays off.' };

    case 'exercise_incorrect':
      if ((context.attempts || 0) >= 3) {
        return { type: 'hint', message: "Take a breath. Let's break this down step by step." };
      }
      return { type: 'correction', message: "Not quite, but you're on the right track. Try again!" };

    case 'lesson_complete':
      return {
        type: 'celebration',
        message: `Lesson complete! You've mastered "${context.lessonName}". Ready for the next challenge?`,
      };

    case 'module_complete':
      return {
        type: 'celebration',
        message: `🏆 Module "${context.moduleName}" complete! Incredible progress.`,
      };

    case 'stuck':
      return {
        type: 'guidance',
        message: "Feeling stuck is part of learning. Let's revisit the concept together.",
      };

    case 'returning':
      if ((context.daysAway || 0) > 3) {
        return {
          type: 'encouragement',
          message: `Welcome back! It's been ${context.daysAway} days. Let's do a quick review.`,
        };
      }
      return { type: 'encouragement', message: "Good to see you! Let's pick up where you left off." };

    default:
      return { type: 'guidance', message: "Let's keep learning together." };
  }
}

// ============================================
// RESUME LEARNING
// ============================================

export async function getResumePoint(userId: string): Promise<{
  enrollment: UserEnrollment | null;
  progress: UserCurriculumProgress | null;
  nextLesson: { moduleId: string; lessonId: string; moduleName: string; lessonName: string } | null;
  feedback: MentorFeedback;
}> {
  try {
    const enrollment = await getActiveEnrollment(userId);
    if (!enrollment) {
      return {
        enrollment: null,
        progress: null,
        nextLesson: null,
        feedback: {
          type: 'guidance',
          message: 'Ready to start your learning journey? Pick a field or technology to master!',
        },
      };
    }

    const progress = await getCurriculumProgress(userId, enrollment.roadmapId);
    const nextLesson = await getNextLesson(userId, enrollment.roadmapId);

    const lastActivity = progress?.lastActivityAt ? new Date(progress.lastActivityAt) : new Date();
    const daysAway = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    const feedback = generateMentorFeedback({
      type: 'returning',
      daysAway,
      lessonName: nextLesson?.lessonName,
    });

    return { enrollment, progress, nextLesson, feedback };
  } catch (error) {
    console.error('Error getting resume point:', error);
    return {
      enrollment: null,
      progress: null,
      nextLesson: null,
      feedback: { type: 'guidance', message: 'Something went wrong. Please try again.' },
    };
  }
}
