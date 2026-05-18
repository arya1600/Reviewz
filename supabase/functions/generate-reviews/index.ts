/**
 * Supabase Edge Function — generate-reviews
 *
 * Security model
 * ──────────────
 * Supabase's API gateway already validates the anon/user JWT before the
 * request reaches this function, so no manual JWT verification is needed here.
 *
 * Per-IP rate limiting (10 req/min) is the extra layer that keeps OpenAI
 * costs bounded even if the anon key is public.
 *
 * Deploy:
 *   supabase functions deploy generate-reviews
 *
 * Set the secret (one-time):
 *   supabase secrets set OPENAI_API_KEY=sk-...
 */

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Per-IP in-memory rate limiter ─────────────────────────────
const ipBuckets = new Map<string, { count: number; windowStart: number }>();
const MAX_PER_MINUTE = 10;
const WINDOW_MS      = 60_000;

function checkRateLimit(ip: string): boolean {
  const now    = Date.now();
  const bucket = ipBuckets.get(ip) ?? { count: 0, windowStart: now };

  if (now - bucket.windowStart > WINDOW_MS) {
    ipBuckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= MAX_PER_MINUTE) return false;

  bucket.count++;
  ipBuckets.set(ip, bucket);
  return true;
}

// ── Handler ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── 1. IP rate limit ──────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    // ── 2. Prompt validation ─────────────────────────────────────
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ reviews: null, fallbackReason: 'missing_prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (prompt.length > 8000) {
      return new Response(JSON.stringify({ reviews: null, fallbackReason: 'prompt_too_large' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. OpenAI call ───────────────────────────────────────────
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      // 503 Service Unavailable — key not configured server-side.
      // Client falls back to templates; ops can detect this in logs/monitors.
      return new Response(
        JSON.stringify({ reviews: null, fallbackReason: 'no_api_key' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:             'gpt-4o-mini',
        messages: [
          {
            role:    'system',
            content: 'You write realistic, human-sounding Google reviews. You never sound like a marketing bot. Every review could plausibly have been written by a real customer on their phone.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens:        700,
        temperature:       0.95,
        presence_penalty:  0.6,
        frequency_penalty: 0.4,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      console.error('[generate-reviews] OpenAI error', openaiRes.status, errText);
      // 502 Bad Gateway — upstream (OpenAI) returned an error.
      return new Response(
        JSON.stringify({ reviews: null, fallbackReason: 'openai_error', upstreamStatus: openaiRes.status }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const json    = await openaiRes.json();
    const content = json.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return new Response(
        JSON.stringify({ reviews: null, fallbackReason: 'empty_response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const parts   = content.split('|||').map((s: string) => s.trim()).filter(Boolean);
    const reviews = parts.length >= 3 ? parts.slice(0, 3) : null;

    if (!reviews) {
      return new Response(
        JSON.stringify({ reviews: null, fallbackReason: 'parse_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ reviews, source: 'ai' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('[generate-reviews] unexpected error', err);
    return new Response(
      JSON.stringify({ reviews: null, fallbackReason: 'exception' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
