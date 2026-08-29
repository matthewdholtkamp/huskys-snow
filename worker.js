const ALLOWED_ORIGINS = [
  'https://matthewdholtkamp.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_REFERER = 'https://matthewdholtkamp.github.io/husky-snow/';
const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const MAX_REQUEST_BYTES = 200_000;
const ALLOWED_MODELS = new Set([
  'gemini-3.5-flash-lite',
]);

const getCorsHeaders = (request) => {
  const origin = request.headers.get('Origin') || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
};

const jsonResponse = (request, body, status = 200, extraHeaders = {}) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
};

const extractGeminiText = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || '').join('');
};

const extractErrorDetail = (text) => {
  try {
    const data = JSON.parse(text);
    return data?.error?.message || data?.message || text;
  } catch {
    return text;
  }
};

const callGemini = async (env, model, body) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${env.GEMINI_API_KEY}`;
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': GEMINI_REFERER,
    },
    body: JSON.stringify({
      systemInstruction: body.systemInstruction,
      contents: body.contents,
      generationConfig: body.generationConfig,
      safetySettings: body.safetySettings,
    }),
  });
};

const handleGenerate = async (request, env) => {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse(request, { error: 'GEMINI_API_KEY is not configured on the Worker.' }, 500);
  }

  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse(request, { error: 'Request body is too large.' }, 413);
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (contentType && !contentType.includes('application/json')) {
    return jsonResponse(request, { error: 'Content-Type must be application/json.' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, { error: 'Invalid JSON body.' }, 400);
  }

  if (!Array.isArray(body.contents)) {
    return jsonResponse(request, { error: 'Request body must include a contents array.' }, 400);
  }

  const primaryModel = body.model || DEFAULT_MODEL;
  const fallbackModel = body.fallbackModel || DEFAULT_FALLBACK_MODEL;
  if (!ALLOWED_MODELS.has(primaryModel) || !ALLOWED_MODELS.has(fallbackModel)) {
    return jsonResponse(request, {
      error: 'Unsupported model requested.',
      allowedModels: Array.from(ALLOWED_MODELS),
    }, 400);
  }

  let usedModel = primaryModel;
  let upstream = await callGemini(env, primaryModel, body);

  if (fallbackModel && fallbackModel !== primaryModel && RETRYABLE_STATUSES.has(upstream.status)) {
    usedModel = fallbackModel;
    upstream = await callGemini(env, fallbackModel, body);
  }

  const rawText = await upstream.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!upstream.ok) {
    return jsonResponse(
      request,
      {
        error: 'Gemini request failed.',
        details: extractErrorDetail(rawText),
        model: usedModel,
      },
      upstream.status,
      { 'X-Model-Used': usedModel }
    );
  }

  const text = extractGeminiText(data);
  const finishReason = data?.candidates?.[0]?.finishReason || null;

  return jsonResponse(
    request,
    {
      text,
      finishReason,
      model: usedModel,
    },
    200,
    { 'X-Model-Used': usedModel }
  );
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: getCorsHeaders(request) });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(request, {
        ok: true,
        service: 'husky-snow-ai',
        hasGeminiKey: Boolean(env.GEMINI_API_KEY),
      });
    }

    if (request.method === 'POST' && url.pathname === '/generate') {
      return handleGenerate(request, env);
    }

    return jsonResponse(request, { error: 'Not found.' }, 404);
  },
};
