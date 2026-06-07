import { SearchResult, Artist, Album, Track } from '@/types';
import { iso8601ToSeconds } from '@/lib/utils';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function searchYouTube(query: string, maxResults = 20): Promise<SearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return [];
  }

  try {
    // Step 1: Search for videos
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('videoCategoryId', '10'); // Music category
    searchUrl.searchParams.set('maxResults', String(maxResults));
    searchUrl.searchParams.set('key', apiKey);

    const searchRes = await fetch(searchUrl.toString(), { next: { revalidate: 60 } });
    if (!searchRes.ok) {
      let message = 'YouTube search failed';
      try {
        const err = await searchRes.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube search failed with status ${searchRes.status}`;
      }
      throw new Error(message);
    }
    const searchData = await searchRes.json();

    const videoIds: string[] = searchData.items
      ?.map((item: { id: { videoId: string } }) => item.id.videoId)
      .filter(Boolean) ?? [];

    if (videoIds.length === 0) return [];

    // Step 2: Get video details (duration and snippet details)
    const detailsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    detailsUrl.searchParams.set('part', 'snippet,contentDetails');
    detailsUrl.searchParams.set('id', videoIds.join(','));
    detailsUrl.searchParams.set('key', apiKey);

    const detailsRes = await fetch(detailsUrl.toString(), { next: { revalidate: 60 } });
    if (!detailsRes.ok) {
      let message = 'YouTube video details fetch failed';
      try {
        const err = await detailsRes.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube video details fetch failed with status ${detailsRes.status}`;
      }
      throw new Error(message);
    }
    const detailsData = await detailsRes.json();

    const results = detailsData.items?.map(
      (item: {
        id: string;
        snippet: { title: string; thumbnails: { medium: { url: string } }; channelTitle: string; channelId: string };
        contentDetails: { duration: string };
      }) => ({
        youtubeId: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
        channelName: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        duration: iso8601ToSeconds(item.contentDetails.duration),
      })
    ) ?? [];
    return results.filter((track: SearchResult) => track.duration > 0);
  } catch (e) {
    console.error('[YouTube API searchYouTube failed]', e);
    return [];
  }
}

export async function getVideoDetails(videoId: string): Promise<SearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return null;
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', videoId);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube video details fetch failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube video details fetch failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    const item = data.items?.[0];
    if (!item) return null;

    return {
      youtubeId: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      duration: iso8601ToSeconds(item.contentDetails.duration),
    };
  } catch (e) {
    console.error('[YouTube API getVideoDetails failed]', e);
    return null;
  }
}

export async function getVideosByIds(videoIds: string[]): Promise<SearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (videoIds.length === 0) return [];
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return [];
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', videoIds.join(','));
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube videos by IDs fetch failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube videos by IDs fetch failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    return data.items?.map(
      (item: {
        id: string;
        snippet: { title: string; thumbnails: { medium: { url: string } }; channelTitle: string; channelId: string };
        contentDetails: { duration: string };
      }) => ({
        youtubeId: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
        channelName: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        duration: iso8601ToSeconds(item.contentDetails.duration),
      })
    ) ?? [];
  } catch (e) {
    console.error('[YouTube API getVideosByIds failed]', e);
    return [];
  }
}

// Search for channels (Artists)
export async function searchArtists(query: string, maxResults = 10): Promise<Artist[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return [];
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'channel');
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube artists search failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube artists search failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    return data.items?.map((item: {
      id: { channelId: string };
      snippet: { channelTitle: string; title: string; thumbnails: { medium?: { url: string }; default?: { url: string } }; description: string };
    }) => ({
      id: item.id.channelId,
      name: item.snippet.channelTitle || item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      description: item.snippet.description,
    })) ?? [];
  } catch (e) {
    console.error('[YouTube API searchArtists failed]', e);
    return [];
  }
}

// Search for playlists (Albums)
export async function searchAlbums(query: string, maxResults = 10): Promise<Album[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return [];
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'playlist');
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube albums search failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube albums search failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    return data.items?.map((item: {
      id: { playlistId: string };
      snippet: { title: string; thumbnails: { medium?: { url: string }; default?: { url: string } }; channelTitle: string; channelId: string; description: string };
    }) => ({
      id: item.id.playlistId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      description: item.snippet.description,
    })) ?? [];
  } catch (e) {
    console.error('[YouTube API searchAlbums failed]', e);
    return [];
  }
}

// Get specific channel details
export async function getChannelDetails(channelId: string): Promise<Artist | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return null;
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/channels`);
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('id', channelId);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube channel details fetch failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube channel details fetch failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    const item = data.items?.[0];
    if (!item) return null;

    return {
      id: item.id,
      name: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.high?.url ?? '',
      description: item.snippet.description,
      subscriberCount: item.statistics?.subscriberCount 
        ? Number(item.statistics.subscriberCount).toLocaleString() 
        : undefined,
    };
  } catch (e) {
    console.error('[YouTube API getChannelDetails failed]', e);
    return null;
  }
}

// Get videos for a channel (Artist top tracks)
export async function getChannelTracks(channelId: string, maxResults = 10): Promise<Track[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return [];
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('type', 'video');
    url.searchParams.set('order', 'viewCount');
    url.searchParams.set('videoCategoryId', '10');
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube channel tracks fetch failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube channel tracks fetch failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    const videoIds = data.items?.map((item: { id: { videoId: string } }) => item.id.videoId).filter(Boolean) ?? [];
    if (videoIds.length === 0) return [];

    const details = await getVideosByIds(videoIds);
    return details.map((d) => ({
      id: d.youtubeId,
      youtubeId: d.youtubeId,
      title: d.title,
      thumbnail: d.thumbnail,
      duration: d.duration,
      channelName: d.channelName,
      channelId: d.channelId,
    }));
  } catch (e) {
    console.error('[YouTube API getChannelTracks failed]', e);
    return [];
  }
}

// Get playlists for a channel (Artist albums)
export async function getChannelPlaylists(channelId: string, maxResults = 10): Promise<Album[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/playlists`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube channel playlists fetch failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube channel playlists fetch failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    return data.items?.map((item: {
      id: string;
      snippet: { title: string; thumbnails: { medium?: { url: string }; default?: { url: string } }; channelTitle: string; channelId: string; description: string };
      contentDetails?: { itemCount?: number };
    }) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      description: item.snippet.description,
      trackCount: item.contentDetails?.itemCount,
    })) ?? [];
  } catch (e) {
    console.error('[YouTube API getChannelPlaylists failed]', e);
    return [];
  }
}

// Get specific playlist details
export async function getPlaylistDetails(playlistId: string): Promise<Album | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return null;
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/playlists`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', playlistId);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube playlist details fetch failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube playlist details fetch failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    const item = data.items?.[0];
    if (!item) return null;

    return {
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.high?.url ?? '',
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      description: item.snippet.description,
      trackCount: item.contentDetails?.itemCount,
    };
  } catch (e) {
    console.error('[YouTube API getPlaylistDetails failed]', e);
    return null;
  }
}

// Get tracks for a playlist (Album tracks)
export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY is not defined in environment variables');
    return [];
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      let message = 'YouTube playlist tracks fetch failed';
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch {
        message = `YouTube playlist tracks fetch failed with status ${res.status}`;
      }
      throw new Error(message);
    }
    const data = await res.json();

    const videoIds = data.items?.map((item: { contentDetails?: { videoId?: string } }) => item.contentDetails?.videoId).filter(Boolean) ?? [];
    if (videoIds.length === 0) return [];

    const details = await getVideosByIds(videoIds);
    return details.map((d) => ({
      id: d.youtubeId,
      youtubeId: d.youtubeId,
      title: d.title,
      thumbnail: d.thumbnail,
      duration: d.duration,
      channelName: d.channelName,
      channelId: d.channelId,
    }));
  } catch (e) {
    console.error('[YouTube API getPlaylistTracks failed]', e);
    return [];
  }
}

