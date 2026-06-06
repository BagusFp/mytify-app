import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_USER_ID } from '@/lib/constants';

// GET /api/playlists
export async function GET() {
  try {
    await ensureDefaultUser();
    const playlists = await prisma.playlist.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: {
        tracks: {
          include: { track: true },
          orderBy: { addedAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('[Playlists GET]', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

// POST /api/playlists
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }
    await ensureDefaultUser();
    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        userId: DEFAULT_USER_ID,
      },
    });
    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error('[Playlists POST]', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}

async function ensureDefaultUser() {
  const exists = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!exists) {
    await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        name: 'Music Lover',
        email: 'user@mytify.app',
      },
    });
  }
}
