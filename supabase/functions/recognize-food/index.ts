// supabase/functions/recognize-food/index.ts
// Supabase Edge Function for AI food recognition via Gemini API
// Deploy: supabase functions deploy recognize-food
// Secret: supabase secrets set GEMINI_API_KEY=your-key

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
    const { image_base64, media_type = 'image/jpeg' } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: media_type, data: image_base64 } },
            { text: `Analyze this food image. Identify each food item, estimate portion, provide macros.
Return ONLY a JSON array:
[{"name":"food","estimated_amount":"portion","confidence":0.85,"macros":{"calories":250,"protein":15,"carbs":30,"fat":8,"fiber":3}}]
Be conservative with portions. Round to whole numbers.` }
          ]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let foods;
    try { foods = JSON.parse(cleaned); } catch { foods = []; }

    return new Response(JSON.stringify({ foods }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
