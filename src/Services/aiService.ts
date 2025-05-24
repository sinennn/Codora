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
- 10x Engineer: Advanced concepts and system design

Output Format:
Return questions in JSON format with the following structure:
{
  questions: [
    {
      question: "Question text",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0 // index of correct answer (0-3)
    }
  ]
}
`;

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizParams {
  topic: string;
  optionType: 'field' | 'technology';
  difficulty: string;
  numberOfQuestions: number;
}

export const generateQuizQuestions = async (params: QuizParams): Promise<{questions: Question[], rawResponse: string}> => {
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
        model: "deepseek/deepseek-prover-v2:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { 
            role: "user", 
            content: `Generate ${params.numberOfQuestions} questions about ${params.topic} in the ${params.optionType} category at ${params.difficulty} difficulty level.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate quiz questions: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data)
    const rawResponse = data.choices[0].message.content;
    console.log(rawResponse)
    if (!rawResponse) {
      throw new Error('No questions generated in the response');
    }

    // Try to extract JSON content from the formatted string with code blocks
    let parsedQuestions;
    const jsonMatch = rawResponse.match(/```json\n(.*?)\n```/s);
    
    if (jsonMatch && jsonMatch[1]) {
      // If JSON is wrapped in code blocks, extract it
      const jsonContent = jsonMatch[1].trim();
      parsedQuestions = JSON.parse(jsonContent);
    } else {
      // If no code blocks, try to parse the entire response as JSON
      try {
        parsedQuestions = JSON.parse(rawResponse);
      } catch {
        // If direct parsing fails, look for any JSON-like structure
        const possibleJson = rawResponse.match(/\{.*\}/s);
        if (possibleJson) {
          parsedQuestions = JSON.parse(possibleJson[0]);
        } else {
          throw new Error('Could not extract valid JSON from the response');
        }
      }
    }
    
    if (!parsedQuestions || !Array.isArray(parsedQuestions.questions)) {
      throw new Error('Invalid response format: questions array not found');
    }

    return {
      questions: parsedQuestions.questions,
      rawResponse: rawResponse
    };
  } catch (error) {
    console.error('Error generating questions:', error);
    toast.error('Failed to generate quiz questions. Please try again.');
    throw error;
  }
};

// Mock implementation for development
export const mockGenerateQuizQuestions = async (params: QuizParams): Promise<{questions: Question[], rawResponse: string}> => {
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
          correctAnswer: 1
        },
        {
          question: "Which data structure uses LIFO principle?",
          options: [
            "A. Queue",
            "B. Stack",
            "C. Array",
            "D. Linked List"
          ],
          correctAnswer: 1
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