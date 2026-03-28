// supabase/functions/parse-voice-log/index.ts
// Parses natural language food descriptions via Gemini
// Deploy: supabase functions deploy parse-voice-log

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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
      return new Response(JSON.stringify({ error: 'No transcript provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const hour = new Date().getHours();
    const timeCtx = hour < 11 ? 'morning (breakfast)' : hour < 15 ? 'midday (lunch)' : hour < 19 ? 'evening (dinner)' : 'night (snack)';

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Parse this food description: "${transcript}"
Current time: ${timeCtx}
Return ONLY a JSON array:
[{"name":"food","amount":"portion","meal_type":"breakfast|lunch|dinner|snack","macros":{"calories":150,"protein":12,"carbs":1,"fat":10,"fiber":0}}]
Be conservative. Round to whole numbers.`
          }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let entries;
    try { entries = JSON.parse(cleaned); } catch { entries = []; }

    return new Response(JSON.stringify({ entries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
