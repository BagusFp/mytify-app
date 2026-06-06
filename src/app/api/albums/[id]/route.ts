import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistDetails, getPlaylistTracks } from '@/services/youtube';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
  }

  try {
    const [details, tracks] = await Promise.all([
      getPlaylistDetails(id),
      getPlaylistTracks(id).catch(() => []),
    ]);

    if (!details) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    return NextResponse.json({
      album: details,
      tracks,
    });
  } catch (error) {
    console.error('[Album API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch album details' },
      { status: 500 }
    );
  }
}
