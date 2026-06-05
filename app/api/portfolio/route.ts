import { NextResponse } from 'next/server';
import { getPortfolioState } from '@/lib/portfolio';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getPortfolioState(), {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  });
}
