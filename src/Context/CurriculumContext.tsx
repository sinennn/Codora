import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type {
  Roadmap,
  UserEnrollment,
  UserCurriculumProgress,
  MentorFeedback,
} from '../Types/curriculum';
import {
  canEnrollInRoadmap,
  enrollInRoadmap,
  getCurriculumProgress,
  getNextLesson,
  updateLessonProgress,
  recordExerciseAttempt,
  getResumePoint,
  generateMentorFeedback,
} from '../Services/curriculumService';
import type { ExerciseAttempt } from '../Types/curriculum';
import { getOrCreateRoadmap, getRoadmap } from '../Services/roadmapService';
import { toast } from 'sonner';

interface CurriculumContextType {
  enrollment: UserEnrollment | null;
  roadmap: Roadmap | null;
  progress: UserCurriculumProgress | null;
  nextLesson: { moduleId: string; lessonId: string; moduleName: string; lessonName: string } | null;
  mentorFeedback: MentorFeedback | null;
  loading: boolean;
  error: string | null;

  checkCanEnroll: () => Promise<{ allowed: boolean; message?: string }>;
  enroll: (topic: string, type: 'field' | 'technology', difficulty: 'beginner' | 'intermediate' | 'advanced') => Promise<boolean>;
  refreshProgress: () => Promise<void>;
  completeLesson: (moduleId: string, lessonId: string) => Promise<void>;
  submitExercise: (moduleId: string, lessonId: string, attempt: Omit<ExerciseAttempt, 'attemptedAt'>) => Promise<void>;
  getMentorFeedback: (type: 'exercise_correct' | 'exercise_incorrect' | 'lesson_complete' | 'stuck', context?: Record<string, unknown>) => MentorFeedback;

  isEnrolled: boolean;
  canSwitchRoadmap: boolean;
  daysUntilUnlock: number;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

interface CurriculumProviderProps {
  children: ReactNode;
}

export function CurriculumProvider({ children }: CurriculumProviderProps) {
  const { currentUser } = useAuth();
  const [enrollment, setEnrollment] = useState<UserEnrollment | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<UserCurriculumProgress | null>(null);
  const [nextLesson, setNextLesson] = useState<{
    moduleId: string;
    lessonId: string;
    moduleName: string;
    lessonName: string;
  } | null>(null);
  const [mentorFeedback, setMentorFeedback] = useState<MentorFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurriculum() {
      if (!currentUser) {
        setEnrollment(null);
        setRoadmap(null);
        setProgress(null);
        setNextLesson(null);
        setLoading(false);
        return;
      }

      try {
        const resumeData = await getResumePoint(currentUser.uid);
        setEnrollment(resumeData.enrollment);
        setProgress(resumeData.progress);
        setNextLesson(resumeData.nextLesson);
        setMentorFeedback(resumeData.feedback);

        if (resumeData.enrollment) {
          const roadmapData = await getRoadmap(resumeData.enrollment.roadmapId);
          setRoadmap(roadmapData);
        }
      } catch (err) {
        console.error('Error loading curriculum:', err);
        setError('Failed to load your learning progress');
      } finally {
        setLoading(false);
      }
    }

    loadCurriculum();
  }, [currentUser]);

  const checkCanEnroll = useCallback(async () => {
    if (!currentUser) return { allowed: false, message: 'Please log in first' };
    return canEnrollInRoadmap(currentUser.uid);
  }, [currentUser]);

  const enroll = useCallback(
    async (
      topic: string,
      type: 'field' | 'technology',
      difficulty: 'beginner' | 'intermediate' | 'advanced'
    ): Promise<boolean> => {
      if (!currentUser) {
        toast.error('Please log in first');
        return false;
      }

      try {
        setLoading(true);

        const canEnroll = await canEnrollInRoadmap(currentUser.uid);
        if (!canEnroll.allowed) {
          toast.error(canEnroll.message || 'Cannot enroll at this time');
          return false;
        }

        const roadmapData = await getOrCreateRoadmap(topic, type, difficulty);

        const result = await enrollInRoadmap(currentUser.uid, roadmapData);
        if (!result.success) {
          toast.error(result.error || 'Failed to enroll');
          return false;
        }

        setEnrollment(result.enrollment!);
        setRoadmap(roadmapData);

        const progressData = await getCurriculumProgress(currentUser.uid, roadmapData.id);
        setProgress(progressData);

        const next = await getNextLesson(currentUser.uid, roadmapData.id);
        setNextLesson(next);

        setMentorFeedback({
          type: 'celebration',
          message: `Welcome to your ${topic} journey! You're committed for the next 2 weeks. Let's make every day count!`,
        });

        toast.success(`Enrolled in ${topic}! Your learning journey begins now.`);
        return true;
      } catch (err) {
        console.error('Error enrolling:', err);
        toast.error('Failed to enroll. Please try again.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  const refreshProgress = useCallback(async () => {
    if (!currentUser || !enrollment) return;

    try {
      const progressData = await getCurriculumProgress(currentUser.uid, enrollment.roadmapId);
      setProgress(progressData);

      const next = await getNextLesson(currentUser.uid, enrollment.roadmapId);
      setNextLesson(next);
    } catch (err) {
      console.error('Error refreshing progress:', err);
    }
  }, [currentUser, enrollment]);

  const completeLesson = useCallback(
    async (moduleId: string, lessonId: string) => {
      if (!currentUser || !enrollment) return;

      try {
        await updateLessonProgress(currentUser.uid, enrollment.roadmapId, moduleId, lessonId, {
          status: 'completed',
          progress: 100,
        });

        await refreshProgress();

        const updatedProgress = await getCurriculumProgress(currentUser.uid, enrollment.roadmapId);
        const module = updatedProgress?.moduleProgress.find((m) => m.moduleId === moduleId);

        if (module?.status === 'completed') {
          setMentorFeedback(
            generateMentorFeedback({ type: 'module_complete', moduleName: module.moduleName })
          );
        } else {
          const lesson = module?.lessonsProgress.find((l) => l.lessonId === lessonId);
          setMentorFeedback(
            generateMentorFeedback({ type: 'lesson_complete', lessonName: lesson?.lessonName })
          );
        }
      } catch (err) {
        console.error('Error completing lesson:', err);
      }
    },
    [currentUser, enrollment, refreshProgress]
  );

  const submitExercise = useCallback(
    async (moduleId: string, lessonId: string, attempt: Omit<ExerciseAttempt, 'attemptedAt'>) => {
      if (!currentUser || !enrollment) return;

      const fullAttempt: ExerciseAttempt = {
        ...attempt,
        attemptedAt: new Date().toISOString(),
      };

      try {
        await recordExerciseAttempt(
          currentUser.uid,
          enrollment.roadmapId,
          moduleId,
          lessonId,
          fullAttempt
        );

        await refreshProgress();

        setMentorFeedback(
          generateMentorFeedback({
            type: attempt.isCorrect ? 'exercise_correct' : 'exercise_incorrect',
            attempts: attempt.attempts,
          })
        );
      } catch (err) {
        console.error('Error submitting exercise:', err);
      }
    },
    [currentUser, enrollment, refreshProgress]
  );

  const getMentorFeedback = useCallback(
    (
      type: 'exercise_correct' | 'exercise_incorrect' | 'lesson_complete' | 'stuck',
      context?: Record<string, unknown>
    ): MentorFeedback => {
      return generateMentorFeedback({ type, ...context });
    },
    []
  );

  const isEnrolled = !!enrollment;

  const canSwitchRoadmap = enrollment
    ? new Date() >= new Date(enrollment.lockedUntil)
    : true;

  const daysUntilUnlock = enrollment
    ? Math.max(
        0,
        Math.ceil(
          (new Date(enrollment.lockedUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const value: CurriculumContextType = {
    enrollment,
    roadmap,
    progress,
    nextLesson,
    mentorFeedback,
    loading,
    error,
    checkCanEnroll,
    enroll,
    refreshProgress,
    completeLesson,
    submitExercise,
    getMentorFeedback,
    isEnrolled,
    canSwitchRoadmap,
    daysUntilUnlock,
  };

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
}

export function useCurriculum() {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error('useCurriculum must be used within a CurriculumProvider');
  }
  return context;
}