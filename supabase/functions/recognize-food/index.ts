// supabase/functions/recognize-food/index.ts
// Supabase Edge Function for AI food recognition via Claude API
//
// Deploy with: supabase functions deploy recognize-food
// Set secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image_base64, media_type = 'image/jpeg' } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Claude API with vision
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type,
                  data: image_base64,
                },
              },
              {
                type: 'text',
                text: `Analyze this food image and identify each food item. For each item, estimate the portion size and provide nutritional macros.

Return ONLY a JSON array with no additional text, in this exact format:
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
- If you can't identify a food with confidence > 0.5, still include it with your best guess
- Round all macro values to whole numbers
- Include fiber when estimable
- For mixed dishes, try to identify individual components`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Claude API error');
    }

    // Parse Claude's response
    const text = data.content?.[0]?.text || '[]';

    // Clean up response (remove markdown code fences if present)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let foods;
    try {
      foods = JSON.parse(cleaned);
    } catch {
      foods = [];
    }

    return new Response(
      JSON.stringify({ foods, raw_response: text }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
