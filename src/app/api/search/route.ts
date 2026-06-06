import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube, searchAlbums, searchArtists } from '@/services/youtube';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20');
  const type = request.nextUrl.searchParams.get('type'); // 'songs' | 'albums' | 'artists' | 'all'
  const page = parseInt(request.nextUrl.searchParams.get('page') ?? '1');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    const q = query.trim();
    if (type === 'songs') {
      const fetchCount = page * limit;
      const allSongs = await searchYouTube(q, fetchCount);
      const songs = allSongs.slice((page - 1) * limit, page * limit);
      return NextResponse.json({ songs, hasMore: allSongs.length >= fetchCount });
    } else if (type === 'albums') {
      const fetchCount = page * limit;
      const allAlbums = await searchAlbums(q, fetchCount);
      const albums = allAlbums.slice((page - 1) * limit, page * limit);
      return NextResponse.json({ albums, hasMore: allAlbums.length >= fetchCount });
    } else if (type === 'artists') {
      const fetchCount = page * limit;
      const allArtists = await searchArtists(q, fetchCount);
      const artists = allArtists.slice((page - 1) * limit, page * limit);
      return NextResponse.json({ artists, hasMore: allArtists.length >= fetchCount });
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
