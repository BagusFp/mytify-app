import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/playlists/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const playlist = await prisma.playlist.update({
      where: { id },
      data: { name: name.trim() },
    });
    return NextResponse.json(playlist);
  } catch {
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

// DELETE /api/playlists/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.playlist.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}

// GET /api/playlists/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          include: { track: true },
          orderBy: { addedAt: 'asc' },
        },
      },
    });
    if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(playlist);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}
