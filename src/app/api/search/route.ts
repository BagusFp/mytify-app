import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube, searchAlbums, searchArtists } from '@/services/youtube';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20');
  const type = request.nextUrl.searchParams.get('type'); // 'songs' | 'albums' | 'artists' | 'all'
  const pageToken = request.nextUrl.searchParams.get('pageToken') ?? undefined;

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    const q = query.trim();
    if (type === 'songs') {
      const { songs, nextPageToken } = await searchYouTube(q, limit, pageToken);
      return NextResponse.json({ songs, nextPageToken });
    } else if (type === 'albums') {
      const { albums, nextPageToken } = await searchAlbums(q, limit, pageToken);
      return NextResponse.json({ albums, nextPageToken });
    } else if (type === 'artists') {
      const { artists, nextPageToken } = await searchArtists(q, limit, pageToken);
      return NextResponse.json({ artists, nextPageToken });
    } else {
      // Fetch all three concurrently
      const [youtubeRes, albumsRes, artistsRes] = await Promise.all([
        searchYouTube(q, 15).catch(() => ({ songs: [], nextPageToken: undefined })),
        searchAlbums(q, 8).catch(() => ({ albums: [], nextPageToken: undefined })),
        searchArtists(q, 8).catch(() => ({ artists: [], nextPageToken: undefined })),
      ]);
      return NextResponse.json({
        songs: youtubeRes.songs,
        albums: albumsRes.albums,
        artists: artistsRes.artists,
        nextPageToken: youtubeRes.nextPageToken,
        albumsNextPageToken: albumsRes.nextPageToken,
        artistsNextPageToken: artistsRes.nextPageToken,
      });
    }
  } catch (error) {
    console.error('[Search API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
