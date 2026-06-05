import { NextResponse } from 'next/server';
import { getPortfolioSummary } from '@/lib/portfolio';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getPortfolioSummary(), {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  });
}
