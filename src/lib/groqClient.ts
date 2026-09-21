const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function callGroq(
  messages: GroqMessage[],
  options: GroqRequestOptions = {}
): Promise<string> {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 4096 } = options;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Groq API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    throw new Error(`Groq API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No response from Groq AI');
  }

  return text.trim();
}

export function parseJSONResponse<T>(raw: string): T {
  let jsonString = raw;
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\n|\n```$/g, '');
  }
  return JSON.parse(jsonString);
}

export function findAndParseJSON<T>(text: string): T | null {
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  
  let jsonString = jsonMatch[0];
  
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\n|\n```$/g, '');
  }
  
  try {
    return JSON.parse(jsonString);
  } catch {
    try {
      jsonString = jsonString
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":');
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }
}
