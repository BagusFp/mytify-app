import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube, searchAlbums, searchArtists } from '@/services/youtube';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20');
  const type = request.nextUrl.searchParams.get('type'); // 'songs' | 'albums' | 'artists' | 'all'

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    const q = query.trim();
    if (type === 'songs') {
      const songs = await searchYouTube(q, limit);
      return NextResponse.json({ songs });
    } else if (type === 'albums') {
      const albums = await searchAlbums(q, limit);
      return NextResponse.json({ albums });
    } else if (type === 'artists') {
      const artists = await searchArtists(q, limit);
      return NextResponse.json({ artists });
    } else {
      // Fetch all three concurrently
      const [songs, albums, artists] = await Promise.all([
        searchYouTube(q, 15).catch(() => []),
        searchAlbums(q, 8).catch(() => []),
        searchArtists(q, 8).catch(() => []),
      ]);
      return NextResponse.json({ songs, albums, artists });
    }
  } catch (error) {
    console.error('[Search API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
