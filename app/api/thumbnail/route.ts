import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { corsHeaders, corsPreflightResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

type LikeRow = {
  target_id: string;
  count: number;
  updated_at: Date;
};

type ThumbnailResponse = {
  ok: true;
  targetId: string;
  liked: boolean;
  count: number;
  storage: 'postgres';
  updatedAt: string;
};

const globalStore = globalThis as typeof globalThis & {
  __thumbnailPostgresClient?: postgres.Sql;
  __thumbnailSchemaReady?: Promise<void>;
};

function getDatabaseUrl() {
  const url = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error('Missing POSTGRES_URL. Connect a Supabase/Postgres storage resource to this Vercel project.');
  }
  return url;
}

function getSql() {
  if (!globalStore.__thumbnailPostgresClient) {
    globalStore.__thumbnailPostgresClient = postgres(getDatabaseUrl(), {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    });
  }
  return globalStore.__thumbnailPostgresClient;
}

function normalizeTargetId(value: unknown) {
  if (typeof value !== 'string') return 'default';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 100) : 'default';
}

async function ensureSchema() {
  if (!globalStore.__thumbnailSchemaReady) {
    const sql = getSql();
    globalStore.__thumbnailSchemaReady = sql`
      create table if not exists thumbnail_likes (
        target_id text primary key,
        count integer not null default 0,
        updated_at timestamptz not null default now()
      )
    `.then(() => undefined);
  }
  return globalStore.__thumbnailSchemaReady;
}

function toResponseBody(targetId: string, row: LikeRow, liked: boolean): ThumbnailResponse {
  return {
    ok: true,
    targetId,
    liked,
    count: Number(row.count ?? 0),
    storage: 'postgres',
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

async function getLikeState(targetId: string): Promise<LikeRow> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql<LikeRow[]>`
    insert into thumbnail_likes (target_id, count)
    values (${targetId}, 0)
    on conflict (target_id) do nothing
    returning target_id, count, updated_at
  `;

  if (rows[0]) return rows[0];

  const existing = await sql<LikeRow[]>`
    select target_id, count, updated_at
    from thumbnail_likes
    where target_id = ${targetId}
    limit 1
  `;

  return existing[0] ?? { target_id: targetId, count: 0, updated_at: new Date() };
}

async function incrementLike(targetId: string): Promise<LikeRow> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql<LikeRow[]>`
    insert into thumbnail_likes (target_id, count)
    values (${targetId}, 1)
    on conflict (target_id)
    do update set
      count = thumbnail_likes.count + 1,
      updated_at = now()
    returning target_id, count, updated_at
  `;

  return rows[0];
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  const targetId = normalizeTargetId(url.searchParams.get('targetId'));
  const row = await getLikeState(targetId);

  return NextResponse.json(toResponseBody(targetId, row, row.count > 0), {
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
  const row = await incrementLike(targetId);

  return NextResponse.json(toResponseBody(targetId, row, true), {
    headers: {
      ...corsHeaders(origin),
      'Cache-Control': 'no-store'
    }
  });
}

export async function OPTIONS(request: Request) {
  return corsPreflightResponse(request.headers.get('origin'));
}
