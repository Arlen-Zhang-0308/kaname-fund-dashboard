import { NextResponse } from 'next/server';
import { corsHeaders, corsPreflightResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

type LikeState = {
  count: number;
  liked: boolean;
};

const globalStore = globalThis as typeof globalThis & {
  __thumbnailLikeStore?: Map<string, LikeState>;
};

function getStore() {
  if (!globalStore.__thumbnailLikeStore) {
    globalStore.__thumbnailLikeStore = new Map<string, LikeState>();
  }
  return globalStore.__thumbnailLikeStore;
}

function normalizeTargetId(value: unknown) {
  if (typeof value !== 'string') return 'default';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 100) : 'default';
}

function getState(targetId: string) {
  const store = getStore();
  const existing = store.get(targetId);
  if (existing) return existing;

  const initial = { count: 0, liked: false };
  store.set(targetId, initial);
  return initial;
}

function responseBody(targetId: string, state: LikeState) {
  return {
    ok: true,
    targetId,
    liked: state.liked,
    count: state.count,
    storage: 'memory',
    updatedAt: new Date().toISOString()
  };
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  const targetId = normalizeTargetId(url.searchParams.get('targetId'));
  const state = getState(targetId);

  return NextResponse.json(responseBody(targetId, state), {
    headers: {
      ...corsHeaders(origin),
      'Cache-Control': 'no-store'
    }
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const targetId = normalizeTargetId(
    body && typeof body === 'object' && 'targetId' in body ? (body as { targetId?: unknown }).targetId : undefined
  );
  const state = getState(targetId);
  state.count += 1;
  state.liked = true;
  getStore().set(targetId, state);

  return NextResponse.json(responseBody(targetId, state), {
    headers: {
      ...corsHeaders(origin),
      'Cache-Control': 'no-store'
    }
  });
}

export async function OPTIONS(request: Request) {
  return corsPreflightResponse(request.headers.get('origin'));
}
