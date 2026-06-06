import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

// POST /api/playlists/[id]/tracks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { track } = await request.json();
    const dbTrack = await upsertTrack(track);
    await prisma.playlistTrack.upsert({
      where: { playlistId_trackId: { playlistId: id, trackId: dbTrack.id } },
      update: {},
      create: { playlistId: id, trackId: dbTrack.id },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[Playlist Tracks POST]', error);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}
