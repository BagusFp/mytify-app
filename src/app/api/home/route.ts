import { NextResponse } from 'next/server';
import { getVideosByIds } from '@/services/youtube';
import { FEATURED_VIDEO_IDS, DEFAULT_USER_ID } from '@/lib/constants';
import { prisma, ensureDefaultUser } from '@/lib/prisma';
import { SearchResult } from '@/types';

export async function GET() {
  try {
    await ensureDefaultUser();
    // Recently played from DB
    const recentHistory = await prisma.history.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: { track: true },
      orderBy: { playedAt: 'desc' },
      take: 24,
    });

    const seen = new Set<string>();
    const uniqueRecentTracks: any[] = [];
    for (const h of recentHistory) {
      if (h.track && !seen.has(h.track.youtubeId)) {
        seen.add(h.track.youtubeId);
        uniqueRecentTracks.push(h.track);
      }
      if (uniqueRecentTracks.length >= 6) {
        break;
      }
    }

    // Favorites from DB
    const favs = await prisma.favorite.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: { track: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

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

    return NextResponse.json({
      recentlyPlayed: uniqueRecentTracks,
      favorites: favs.map((f) => f.track),
      trending: featured,
      recommended: featured.slice(0, 6),
      newReleases: newReleases,
    });
  } catch (error) {
    console.error('[Home API]', error);
    return NextResponse.json({
      recentlyPlayed: [],
      favorites: [],
      trending: [],
      recommended: [],
    });
  }
}
