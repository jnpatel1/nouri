// ============================================================
// Gemini AI Service
// Handles food photo recognition and voice transcript parsing
// Uses Gemini 2.0 Flash for vision + text
// ============================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface RecognizedFood {
  name: string;
  estimated_amount: string;
  confidence: number;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface VoiceParsedEntry {
  name: string;
  amount: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export function isGeminiConfigured(): boolean {
  return GEMINI_API_KEY !== '' && GEMINI_API_KEY !== 'your-gemini-api-key';
}

/**
 * Recognize foods from a photo using Gemini Vision
 */
export async function recognizeFoodFromPhoto(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<RecognizedFood[]> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: `Analyze this food image and identify each food item visible. For each item, estimate the portion size and provide nutritional information.

Return ONLY a valid JSON array with no additional text, markdown, or code fences. Use this exact format:
[
  {
    "name": "food name",
    "estimated_amount": "portion description (e.g., '1 cup', '150g', '2 slices')",
    "confidence": 0.85,
    "macros": {
      "calories": 250,
      "protein": 15,
      "carbs": 30,
      "fat": 8,
      "fiber": 3
    }
  }
]

Guidelines:
- Be conservative with portion estimates (slightly underestimate rather than overestimate)
- Use commonly recognized serving sizes
- Round all macro values to whole numbers
- Include fiber when estimable
- For mixed dishes, try to identify individual components
- If uncertain about a food, still include your best guess with a lower confidence score`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  // Clean response (strip markdown fences if present)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse Gemini response:', text);
    return [];
  }
}

/**
 * Parse a voice transcript into structured food entries
 */
export async function parseVoiceTranscript(
  transcript: string
): Promise<VoiceParsedEntry[]> {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key not configured.');
  }

  const hour = new Date().getHours();
  const timeContext = hour < 11 ? 'morning (likely breakfast)' : hour < 15 ? 'midday (likely lunch)' : hour < 19 ? 'evening (likely dinner)' : 'late evening (likely snack)';

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Parse this food description into structured entries. The user said: "${transcript}"

Current time context: ${timeContext}

Return ONLY a valid JSON array with no additional text:
[
  {
    "name": "food name",
    "amount": "portion (e.g., '2 eggs', '1 cup')",
    "meal_type": "breakfast|lunch|dinner|snack",
    "macros": {
      "calories": 150,
      "protein": 12,
      "carbs": 1,
      "fat": 10,
      "fiber": 0
    }
  }
]

Infer meal_type from context and current time. Be conservative with calorie estimates. Round all values to whole numbers.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
