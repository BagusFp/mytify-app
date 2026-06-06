import { NextRequest, NextResponse } from 'next/server';
import { getChannelDetails, getChannelTracks, getChannelPlaylists } from '@/services/youtube';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
  }

  try {
    const [details, tracks, albums] = await Promise.all([
      getChannelDetails(id),
      getChannelTracks(id, 10).catch(() => []),
      getChannelPlaylists(id, 8).catch(() => []),
    ]);

    if (!details) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json({
      artist: details,
      tracks,
      albums,
    });
  } catch (error) {
    console.error('[Artist API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch artist details' },
      { status: 500 }
    );
  }
}
