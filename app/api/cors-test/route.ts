import { NextResponse } from 'next/server';
import { corsHeaders, corsPreflightResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = request.headers.get('origin');

  return NextResponse.json(
    {
      ok: true,
      service: 'kaname-fund-dashboard',
      endpoint: '/api/cors-test',
      method: 'GET',
      origin: origin ?? null,
      cors: {
        enabled: true,
        allowed_origin: corsHeaders(origin)['Access-Control-Allow-Origin'],
        allowed_methods: 'GET, OPTIONS',
        allowed_headers: 'Content-Type, Authorization'
      },
      message: 'Backend test endpoint is reachable. If this JSON is visible in the browser, direct GET works.',
      checked_at: new Date().toISOString()
    },
    {
      headers: {
        ...corsHeaders(origin),
        'Cache-Control': 'no-store'
      }
    }
  );
}

export async function OPTIONS(request: Request) {
  return corsPreflightResponse(request.headers.get('origin'));
}
