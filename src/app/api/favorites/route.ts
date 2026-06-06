import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDefaultUser } from '@/lib/prisma';
import { DEFAULT_USER_ID } from '@/lib/constants';

async function upsertTrack(track: {
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
  channelId?: string;
}) {
  return prisma.track.upsert({
    where: { youtubeId: track.youtubeId },
    update: {
      channelId: track.channelId ?? null,
    },
    create: {
      youtubeId: track.youtubeId,
      title: track.title,
      thumbnail: track.thumbnail,
      duration: track.duration,
      channelName: track.channelName,
      channelId: track.channelId ?? null,
    },
  });
}

// GET /api/favorites
export async function GET() {
  try {
    await ensureDefaultUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: { track: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(favorites);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites
export async function POST(request: NextRequest) {
  try {
    await ensureDefaultUser();
    const { track } = await request.json();
    const dbTrack = await upsertTrack(track);
    
    // Explicit duplicate check
    const existing = await prisma.favorite.findUnique({
      where: { userId_trackId: { userId: DEFAULT_USER_ID, trackId: dbTrack.id } },
      include: { track: true },
    });
    
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const fav = await prisma.favorite.create({
      data: { userId: DEFAULT_USER_ID, trackId: dbTrack.id },
      include: { track: true },
    });
    return NextResponse.json(fav, { status: 201 });
  } catch (error) {
    console.error('[Favorites POST]', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}
