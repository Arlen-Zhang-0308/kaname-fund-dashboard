import { NextResponse } from 'next/server';
import { corsHeaders, corsPreflightResponse } from '@/lib/cors';
import { getPortfolioState } from '@/lib/portfolio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return NextResponse.json(getPortfolioState(), {
    headers: {
      ...corsHeaders(request.headers.get('origin')),
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  });
}

export async function OPTIONS(request: Request) {
  return corsPreflightResponse(request.headers.get('origin'));
}
