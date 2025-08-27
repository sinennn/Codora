import { toast } from "sonner";
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;

const SYSTEM_PROMPT = `
You are a professional quiz question generator. Your task is to create multiple-choice questions for technical assessments.

Rules:
1. Each question must have exactly 4 options (A, B, C, D)
2. Questions must be clear and unambiguous
3. Include only one correct answer per question
4. Questions should test practical knowledge and understanding
5. You may use trick questions or overly complex wording
6. Ensure options are plausible but clearly differentiable
7. Maintain consistent difficulty across questions
8.The quesions must be written only in the english language, nothing else
9.Only a JSON must be returned; exclude thinking process from response

Question Structure:
- Question text should be concise and direct, trick questions permitted
- Options should be formatted as: A) Option text, B) Option text, etc.
- Include a clear indication of the correct answer

For technology questions:
- Focus on practical implementation and best practices
- Include real-world scenarios where applicable
- Avoid overly theoretical questions unless necessary for understanding

For field questions:
- Cover fundamental concepts and principles
- Include application-based questions
- Relate to real-world use cases in the field

Difficulty Levels:
- Starter: Basic concepts and fundamental understanding
- Intermediate Dev: Practical implementation and problem-solving
- 10x Engineer: Advanced concepts and system design, you may use trick questions

Output Format:
Return questions in JSON format with the following structure:
{
  questions: [
    {
      question: "Question text",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0 // index of correct answer (0-3),
      explanation: Within the output, provide a minimal but crystal clear explanation of the answer
    }
  ]

}
`;

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizParams {
  topic: string;
  optionType: 'field' | 'technology';
  difficulty: string;
  numberOfQuestions: number;
}

export const generateQuizQuestions = async (params: QuizParams): Promise<{ questions: Question[], rawResponse: string }> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'HTTP-Referer': import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
        'X-Title': import.meta.env.VITE_SITE_NAME || 'Codora',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Generate exactly ${params.numberOfQuestions} questions about ${params.topic} in the ${params.optionType} category at ${params.difficulty} difficulty level.
            
            IMPORTANT: Return ONLY a valid JSON array of question objects with this exact structure:
            [
              {
                "question": "Question text here",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correctAnswer": 0
                "explanation":"minimal and short but crystal clear explanation of the question's correct answer"
              }
            ]
            
            - Each question must have exactly 4 options
            - correctAnswer must be the index of the correct option (0-3)
            - Within the output, provide a minimal but crystal clear explanation of the answer`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Failed to generate quiz questions: ${response.statusText}`);
    }

    const data = await response.json();
    const rawResponse = data.choices[0]?.message?.content;

    if (!rawResponse) {
      throw new Error('No questions generated in the response');
    }

    let jsonString = rawResponse.trim();
    console.log(jsonString)

    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n|\n```$/g, '');
    }

    let questions;
    try {
      questions = JSON.parse(jsonString);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.log('Raw response:', rawResponse);
      throw new Error('Could not parse the response as valid JSON');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Invalid response format - expected an array of questions');
      console.log('Raw response:', rawResponse);
      throw new Error('Invalid response format: expected an array of questions');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const validatedQuestions = questions.map((q: any, index: number) => {
     
      console.log(`Processing question ${index}:`, JSON.stringify(q, null, 2));
      
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctAnswer !== 'number') {
        console.error(`Invalid question format at index ${index}:`, q);
        throw new Error(`Invalid question format at index ${index}`);
      }

      // Ensure explanation exists and is a non-empty string
      if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim() === '') {
        console.warn(`Missing or invalid explanation for question ${index}, generating default`);
        q.explanation = `The correct answer is option ${String.fromCharCode(65 + q.correctAnswer)} because it best matches the question requirements.`;
      }

      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      } as Question;
    });

    return {
      questions: validatedQuestions,
      rawResponse: JSON.stringify(questions, null, 2)
    };
  } catch (error) {
    console.error('Error in generateQuizQuestions:', error);
    toast.error('Failed to generate quiz questions. Please try again.');
    throw error;
  }
};

// Mock implementation for development
export const mockGenerateQuizQuestions = async (params: QuizParams): Promise<{ questions: Question[], rawResponse: string }> => {
  console.log(params)
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockQuestions: Question[] = [
        {
          question: "What is the primary function of a CPU?",
          options: [
            "A. Store data",
            "B. Process instructions",
            "C. Display graphics",
            "D. Connect to internet"
          ],
          correctAnswer: 1,
          explanation: "The CPU is the “brain” of the computer. Its main job is to fetch, decode, and execute instructions. In other words, it processes instructions."
        },
        {
          question: "Which data structure uses LIFO principle?",
          options: [
            "A. Queue",
            "B. Stack",
            "C. Array",
            "D. Linked List"
          ],
          correctAnswer: 1,
          explanation: "A stack follows the Last In, First Out (LIFO) principle where the last item added is the first one removed (like a stack of plates)."
        }
      ];
      const mockRawResponse = "This is a mock raw response from the AI";
      resolve({
        questions: mockQuestions,
        rawResponse: mockRawResponse
      });
    }, 1000);
  });
};