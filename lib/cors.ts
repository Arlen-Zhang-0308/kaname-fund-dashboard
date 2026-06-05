const DEFAULT_ALLOWED_ORIGINS = ['https://trymuseai.im'];

function getAllowedOrigins() {
  const configured = process.env.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
}

export function corsHeaders(origin: string | null) {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
}

export function corsPreflightResponse(origin: string | null) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}
