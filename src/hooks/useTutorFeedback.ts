import { useState, useCallback } from 'react';
import type {
  TutorFeedback,
  NimeInput,
  NimeResponse,
  NestoResponse,
  UserStats,
  Difficulty,
} from '../Types/tutor';
import {
  getNimeFeedback,
  getNestoFeedback,
  getTutorFeedback,
} from '../Services/tutorService';

interface UseTutorFeedbackReturn {
  feedback: TutorFeedback | null;
  isLoading: boolean;
  error: string | null;
  
  // Get feedback from both tutors
  getFeedback: (
    question: string,
    userAnswer: string,
    correctAnswer: string,
    isCorrect: boolean,
    topic: string,
    difficulty: Difficulty,
    userStats: UserStats
  ) => Promise<void>;
  
  // Get feedback from Nime only
  getNimeOnly: (input: NimeInput) => Promise<NimeResponse | null>;
  
  // Get feedback from Nesto only
  getNestoOnly: (userStats: UserStats, isCorrect: boolean, topic?: string) => Promise<NestoResponse | null>;
  
  // Clear feedback
  clearFeedback: () => void;
}

export function useTutorFeedback(): UseTutorFeedbackReturn {
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFeedback = useCallback(async (
    question: string,
    userAnswer: string,
    correctAnswer: string,
    isCorrect: boolean,
    topic: string,
    difficulty: Difficulty,
    userStats: UserStats
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const nimeInput: NimeInput = {
        question,
        userAnswer,
        correctAnswer,
        topic,
        difficulty,
        isCorrect,
      };

      const result = await getTutorFeedback(nimeInput, userStats);
      setFeedback(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get feedback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNimeOnly = useCallback(async (input: NimeInput): Promise<NimeResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getNimeFeedback(input);
      setFeedback(prev => ({
        nime: result,
        nesto: prev?.nesto,
        timestamp: Date.now(),
      }));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get Nime feedback');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNestoOnly = useCallback(async (
    userStats: UserStats,
    isCorrect: boolean,
    topic?: string
  ): Promise<NestoResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getNestoFeedback({
        userStats,
        recentResult: isCorrect ? 'correct' : 'incorrect',
        currentTopic: topic,
      });
      setFeedback(prev => ({
        nime: prev?.nime,
        nesto: result,
        timestamp: Date.now(),
      }));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get Nesto feedback');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
    setError(null);
  }, []);

  return {
    feedback,
    isLoading,
    error,
    getFeedback,
    getNimeOnly,
    getNestoOnly,
    clearFeedback,
  };
}

export default useTutorFeedback;
