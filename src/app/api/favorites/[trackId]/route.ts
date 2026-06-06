import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDefaultUser } from '@/lib/prisma';
import { DEFAULT_USER_ID } from '@/lib/constants';

// DELETE /api/favorites/[trackId]  (trackId = youtubeId)
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;
  try {
    await ensureDefaultUser();
    const track = await prisma.track.findFirst({ where: { youtubeId: trackId } });
    if (!track) return NextResponse.json({ success: true });

    await prisma.favorite.deleteMany({
      where: { userId: DEFAULT_USER_ID, trackId: track.id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
