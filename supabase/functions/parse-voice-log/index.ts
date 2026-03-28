// supabase/functions/parse-voice-log/index.ts
// Parses natural language food descriptions into structured food entries
//
// Deploy with: supabase functions deploy parse-voice-log

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'No transcript provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            content: `Parse this food description into structured food entries. The user said: "${transcript}"

Return ONLY a JSON array:
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

Infer meal_type from context (morning = breakfast, etc). If unclear, use "snack".
Be conservative with calorie estimates. Round to whole numbers.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let entries;
    try {
      entries = JSON.parse(cleaned);
    } catch {
      entries = [];
    }

    return new Response(
      JSON.stringify({ entries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
