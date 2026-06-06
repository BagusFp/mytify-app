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

// GET /api/history
export async function GET() {
  try {
    await ensureDefaultUser();
    const history = await prisma.history.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: { track: true },
      orderBy: { playedAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(history);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

// POST /api/history
export async function POST(request: NextRequest) {
  try {
    await ensureDefaultUser();
    const { track } = await request.json();
    const dbTrack = await upsertTrack(track);

    // Get latest history item
    const latestEntry = await prisma.history.findFirst({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { playedAt: 'desc' },
      include: { track: true },
    });

    if (latestEntry && latestEntry.track.youtubeId === track.youtubeId) {
      const timeDiffMs = Date.now() - new Date(latestEntry.playedAt).getTime();
      const thirtyMinutesInMs = 30 * 60 * 1000;

      if (timeDiffMs < thirtyMinutesInMs) {
        // Same track played within 30 minutes -> update timestamp
        const updated = await prisma.history.update({
          where: { id: latestEntry.id },
          data: { playedAt: new Date() },
          include: { track: true },
        });
        return NextResponse.json(updated, { status: 200 });
      }
    }

    // Different track or same track after 30 minutes -> create new entry
    const entry = await prisma.history.create({
      data: { userId: DEFAULT_USER_ID, trackId: dbTrack.id },
      include: { track: true },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('[History POST]', error);
    return NextResponse.json({ error: 'Failed to add history entry' }, { status: 500 });
  }
}
