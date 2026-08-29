import { toast } from "sonner";
import { callGroq, parseJSONResponse } from "../lib/groqClient";
import type {
  NimeInput,
  NimeResponse,
  NestoInput,
  NestoResponse,
  TutorFeedback,
  UserStats,
} from "../Types/tutor";

const NIME_SYSTEM_PROMPT = `
You are Nime, a warm, encouraging AI tutor inside Codora. Your job is to help users understand, not intimidate.

PERSONALITY:
- Friendly, calm, supportive
- Like a patient senior dev who loves teaching
- Never shames or mocks
- Explains WHY, not just what
- Celebrates small wins
- Uses light humor when appropriate

TONE:
- Conversational, human, encouraging
- Short explanations over long lectures
- Avoid jargon unless explaining it clearly
- Never condescending

BEHAVIOR RULES:
- Wrong answer → explain concept simply + reassure
- Right answer → praise and reinforce the reasoning
- Repeated struggles → break topic into smaller pieces
- Always sound like you want them to succeed

OUTPUT FORMAT (JSON only):
{
  "message": "Friendly explanation or encouragement",
  "tip": "Optional short learning tip",
  "nextSuggestion": "Optional recommendation"
}
`;

const NESTO_SYSTEM_PROMPT = `
You are Nesto, a focused, competitive performance coach. You push users to improve, call out weak spots, and keep them accountable — without being rude or toxic.

PERSONALITY:
- Direct and motivating
- Confident, sharp, concise
- Focused on improvement and consistency
- Sounds like a coach, not a teacher

TONE:
- Short, punchy sentences
- Results-driven language
- No fluff
- Constructively critical

BEHAVIOR RULES:
- Praise effort, not luck
- Highlight gaps clearly
- Encourage repetition and discipline
- Never insult or demean

OUTPUT FORMAT (JSON only):
{
  "message": "Short motivational or corrective feedback",
  "challengeSuggestion": "Optional next action"
}
`;

export async function getNimeFeedback(input: NimeInput): Promise<NimeResponse> {
  try {
    const userPrompt = `
The user just answered a question. Provide friendly feedback.

Question: ${input.question}
User's Answer: ${input.userAnswer}
Correct Answer: ${input.correctAnswer}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Was Correct: ${input.isCorrect}

Respond with JSON only.
`;

    const raw = await callGroq([
      { role: 'system', content: NIME_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ], { maxTokens: 512 });
    return parseJSONResponse<NimeResponse>(raw);
  } catch (error) {
    console.error('Nime feedback error:', error);
    return input.isCorrect
      ? { message: "Nice work! You got it right. 🎉", tip: "Keep up the momentum!" }
      : { message: "Almost there! Let's break this down together.", tip: "Review the concept and try again." };
  }
}

export async function getNestoFeedback(input: NestoInput): Promise<NestoResponse> {
  try {
    const userPrompt = `
Analyze this user's performance and provide coaching feedback.

Stats:
- Accuracy: ${input.userStats.accuracy}%
- Current Streak: ${input.userStats.streak} days
- Weak Topics: ${input.userStats.weakTopics.join(', ') || 'None identified'}
- Total Questions: ${input.userStats.totalQuestions}
- Correct Answers: ${input.userStats.correctAnswers}

Recent Result: ${input.recentResult}
${input.currentTopic ? `Current Topic: ${input.currentTopic}` : ''}
${input.sessionProgress ? `Session: ${input.sessionProgress.questionsAnswered} questions, ${input.sessionProgress.sessionAccuracy}% accuracy` : ''}

Respond with JSON only.
`;

    const raw = await callGroq([
      { role: 'system', content: NESTO_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ], { maxTokens: 512 });
    return parseJSONResponse<NestoResponse>(raw);
  } catch (error) {
    console.error('Nesto feedback error:', error);
    return input.recentResult === 'correct'
      ? { message: "Good. Keep pushing.", challengeSuggestion: "Ready for harder questions?" }
      : { message: "Missed it. Focus up. You've got this.", challengeSuggestion: "Review and retry." };
  }
}

export async function getTutorFeedback(
  nimeInput: NimeInput,
  userStats: UserStats
): Promise<TutorFeedback> {
  const nestoInput: NestoInput = {
    userStats,
    recentResult: nimeInput.isCorrect ? 'correct' : 'incorrect',
    currentTopic: nimeInput.topic,
  };

  try {
    const [nime, nesto] = await Promise.all([
      getNimeFeedback(nimeInput),
      getNestoFeedback(nestoInput),
    ]);

    return {
      nime,
      nesto,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Tutor feedback error:', error);
    toast.error('Could not get tutor feedback');
    throw error;
  }
}