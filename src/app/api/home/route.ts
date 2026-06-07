import { NextResponse } from 'next/server';
import { getVideosByIds } from '@/services/youtube';
import { FEATURED_VIDEO_IDS } from '@/lib/constants';
import { SearchResult } from '@/types';

export async function GET() {
  try {
    // Featured tracks from YouTube API
    let featured: SearchResult[] = [];
    try {
      featured = await getVideosByIds(FEATURED_VIDEO_IDS.slice(0, 6));
    } catch {
      featured = [];
    }

    // New Releases from YouTube API
    let newReleases: SearchResult[] = [];
    try {
      newReleases = await getVideosByIds(FEATURED_VIDEO_IDS.slice(3, 9));
    } catch {
      newReleases = [];
    }

    // recentlyPlayed and favorites are now served from localStorage (client-side stores)
    return NextResponse.json({
      recentlyPlayed: [],
      favorites: [],
      trending: featured,
      recommended: featured.slice(0, 6),
      newReleases,
    });
  } catch (error) {
    console.error('[Home API]', error);
    return NextResponse.json({
      recentlyPlayed: [],
      favorites: [],
      trending: [],
      recommended: [],
      newReleases: [],
    });
  }
}
