import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/playlists/[id]/tracks/[trackId]
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  const { id, trackId } = await params;
  try {
    // trackId here is the youtubeId
    const track = await prisma.track.findFirst({ where: { youtubeId: trackId } });
    if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 });

    await prisma.playlistTrack.delete({
      where: { playlistId_trackId: { playlistId: id, trackId: track.id } },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}
