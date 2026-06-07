import { SearchResult, Artist, Album, Track } from '@/types';
import { iso8601ToSeconds } from '@/lib/utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getDlpExecutable(): string {
  const customPath = 'C:\\laragon\\bin\\python\\python-3.10\\Scripts\\yt-dlp.exe';
  if (existsSync(customPath)) {
    return `"${customPath}"`;
  }
  return 'yt-dlp';
}

// Helper: fallback YouTube search via yt-dlp
async function searchYouTubeViaDlp(query: string, maxResults = 20): Promise<SearchResult[]> {
  const ytDlpCmd = getDlpExecutable();
  const cmd = `${ytDlpCmd} --flat-playlist --playlist-end ${maxResults} --dump-single-json "ytsearch${maxResults}:${query.replace(/"/g, '\\"')}"`;
  try {
    const { stdout } = await execAsync(cmd, { timeout: 30000 });
    const data = JSON.parse(stdout);
    if (!data.entries) return [];
    return data.entries
      .filter((entry: any) => entry.duration && entry.duration > 0 && !entry.is_live)
      .map((entry: any) => {
        const thumbnail = entry.thumbnails?.[entry.thumbnails.length - 1]?.url || 
                          `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`;
        return {
          youtubeId: entry.id,
          title: entry.title,
          thumbnail,
          channelName: entry.channel || entry.uploader || 'Unknown Artist',
          channelId: entry.channel_id || null,
          duration: Math.round(entry.duration || 0),
        };
      });
  } catch (error) {
    console.error('[yt-dlp Search Fallback Failed]', error);
    return [];
  }
}

// Helper: fallback video details via yt-dlp
async function getVideoDetailsViaDlp(videoId: string): Promise<SearchResult | null> {
  const ytDlpCmd = getDlpExecutable();
  const cmd = `${ytDlpCmd} --dump-single-json "https://www.youtube.com/watch?v=${videoId}"`;
  try {
    const { stdout } = await execAsync(cmd, { timeout: 30000 });
    const data = JSON.parse(stdout);
    const thumbnail = data.thumbnails?.[data.thumbnails.length - 1]?.url || 
                      `https://i.ytimg.com/vi/${data.id}/mqdefault.jpg`;
    return {
      youtubeId: data.id,
      title: data.title,
      thumbnail,
      channelName: data.channel || data.uploader || 'Unknown Artist',
      channelId: data.channel_id || null,
      duration: Math.round(data.duration || 0),
    };
  } catch (error) {
    console.error('[yt-dlp Details Fallback Failed]', error);
    return null;
  }
}

export async function searchYouTube(query: string, maxResults = 20): Promise<SearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return searchYouTubeViaDlp(query, maxResults);
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
      const err = await searchRes.json();
      throw new Error(err?.error?.message ?? 'YouTube search failed');
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
    if (!detailsRes.ok) throw new Error('YouTube video details fetch failed');
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
    return results.filter((track: any) => track.duration > 0);
  } catch (e) {
    console.warn('[YouTube API failed, falling back to yt-dlp search]', e);
    return searchYouTubeViaDlp(query, maxResults);
  }
}

export async function getVideoDetails(videoId: string): Promise<SearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return getVideoDetailsViaDlp(videoId);
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', videoId);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return getVideoDetailsViaDlp(videoId);
    const data = await res.json();

    const item = data.items?.[0];
    if (!item) return getVideoDetailsViaDlp(videoId);

    return {
      youtubeId: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      duration: iso8601ToSeconds(item.contentDetails.duration),
    };
  } catch (e) {
    console.warn('[YouTube API failed, falling back to yt-dlp details]', e);
    return getVideoDetailsViaDlp(videoId);
  }
}

export async function getVideosByIds(videoIds: string[]): Promise<SearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (videoIds.length === 0) return [];
  if (!apiKey) {
    const results = await Promise.all(videoIds.map((id) => getVideoDetailsViaDlp(id)));
    return results.filter(Boolean) as SearchResult[];
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', videoIds.join(','));
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      const results = await Promise.all(videoIds.map((id) => getVideoDetailsViaDlp(id)));
      return results.filter(Boolean) as SearchResult[];
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
    console.warn('[YouTube API failed, falling back to yt-dlp details batch]', e);
    const results = await Promise.all(videoIds.map((id) => getVideoDetailsViaDlp(id)));
    return results.filter(Boolean) as SearchResult[];
  }
}

// Search for channels (Artists)
export async function searchArtists(query: string, maxResults = 10): Promise<Artist[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    const videos = await searchYouTubeViaDlp(query, maxResults);
    const artistsMap = new Map<string, Artist>();
    for (const v of videos) {
      if (v.channelId && !artistsMap.has(v.channelId)) {
        artistsMap.set(v.channelId, {
          id: v.channelId,
          name: v.channelName,
          thumbnail: `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`,
          description: `Uploader: ${v.channelName}`,
        });
      }
    }
    return Array.from(artistsMap.values());
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'channel');
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();

    return data.items?.map((item: any) => ({
      id: item.id.channelId,
      name: item.snippet.channelTitle || item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      description: item.snippet.description,
    })) ?? [];
  } catch (e) {
    console.warn('[YouTube API failed, falling back to yt-dlp uploader extraction for artists]', e);
    const videos = await searchYouTubeViaDlp(query, maxResults);
    const artistsMap = new Map<string, Artist>();
    for (const v of videos) {
      if (v.channelId && !artistsMap.has(v.channelId)) {
        artistsMap.set(v.channelId, {
          id: v.channelId,
          name: v.channelName,
          thumbnail: `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`,
          description: `Uploader: ${v.channelName}`,
        });
      }
    }
    return Array.from(artistsMap.values());
  }
}

// Search for playlists (Albums)
export async function searchAlbums(query: string, maxResults = 10): Promise<Album[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Search videos and create album representations
    const videos = await searchYouTubeViaDlp(query + ' album', maxResults);
    return videos.map((v) => ({
      id: `playlist-${v.youtubeId}`,
      title: `${v.channelName} Collection`,
      thumbnail: v.thumbnail,
      channelName: v.channelName,
      channelId: v.channelId,
      description: `Album fallback representation for uploader ${v.channelName}`,
    }));
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'playlist');
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();

    return data.items?.map((item: any) => ({
      id: item.id.playlistId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      description: item.snippet.description,
    })) ?? [];
  } catch (e) {
    console.warn('[YouTube API failed, falling back to album mock generation]', e);
    const videos = await searchYouTubeViaDlp(query + ' album', maxResults);
    return videos.map((v) => ({
      id: `playlist-${v.youtubeId}`,
      title: `${v.channelName} Collection`,
      thumbnail: v.thumbnail,
      channelName: v.channelName,
      channelId: v.channelId,
      description: `Album fallback representation for uploader ${v.channelName}`,
    }));
  }
}

// Get specific channel details
export async function getChannelDetails(channelId: string): Promise<Artist | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    const ytDlpCmd = getDlpExecutable();
    const cmd = `${ytDlpCmd} --flat-playlist --dump-single-json "https://www.youtube.com/channel/${channelId}"`;
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      const data = JSON.parse(stdout);
      const thumbnail = data.thumbnails?.[data.thumbnails.length - 1]?.url || '';
      return {
        id: data.id || channelId,
        name: data.title || 'Unknown Artist',
        thumbnail,
        description: data.description || `Uploader channel ${data.title}`,
      };
    } catch {
      return {
        id: channelId,
        name: 'YouTube Creator',
        thumbnail: '',
        description: 'Artist details retrieved via uploader fallback.',
      };
    }
  }

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/channels`);
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('id', channelId);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return null;
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
    console.warn('[YouTube API failed, falling back to channel details scraping]', e);
    const ytDlpCmd = getDlpExecutable();
    const cmd = `${ytDlpCmd} --flat-playlist --dump-single-json "https://www.youtube.com/channel/${channelId}"`;
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      const data = JSON.parse(stdout);
      const thumbnail = data.thumbnails?.[data.thumbnails.length - 1]?.url || '';
      return {
        id: data.id || channelId,
        name: data.title || 'Unknown Artist',
        thumbnail,
        description: data.description || `Uploader channel ${data.title}`,
      };
    } catch {
      return {
        id: channelId,
        name: 'YouTube Creator',
        thumbnail: '',
        description: 'Artist details retrieved via uploader fallback.',
      };
    }
  }
}

// Get videos for a channel (Artist top tracks)
export async function getChannelTracks(channelId: string, maxResults = 10): Promise<Track[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const ytDlpCmd = getDlpExecutable();
  const fallbackFn = async () => {
    const cmdChannel = `${ytDlpCmd} --flat-playlist --playlist-end ${maxResults} --dump-single-json "https://www.youtube.com/channel/${channelId}"`;
    try {
      const { stdout } = await execAsync(cmdChannel, { timeout: 30000 });
      const data = JSON.parse(stdout);
      if (!data.entries) return [];
      return data.entries.map((entry: any) => ({
        id: entry.id,
        youtubeId: entry.id,
        title: entry.title,
        thumbnail: entry.thumbnails?.[entry.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`,
        duration: Math.round(entry.duration || 0),
        channelName: data.title || entry.uploader || 'Unknown Channel',
        channelId: channelId,
      }));
    } catch {
      return [];
    }
  };

  if (!apiKey) return fallbackFn();

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
    if (!res.ok) return fallbackFn();
    const data = await res.json();

    const videoIds = data.items?.map((item: any) => item.id.videoId).filter(Boolean) ?? [];
    if (videoIds.length === 0) return fallbackFn();

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
    console.warn('[YouTube API failed, falling back to channel tracks scraping]', e);
    return fallbackFn();
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
    if (!res.ok) return [];
    const data = await res.json();

    return data.items?.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      description: item.snippet.description,
      trackCount: item.contentDetails?.itemCount,
    })) ?? [];
  } catch (e) {
    console.warn('[YouTube API failed, return empty playlists]', e);
    return [];
  }
}

// Get specific playlist details
export async function getPlaylistDetails(playlistId: string): Promise<Album | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const ytDlpCmd = getDlpExecutable();
  const fallbackFn = async () => {
    const cmd = `${ytDlpCmd} --flat-playlist --dump-single-json "https://www.youtube.com/playlist?list=${playlistId}"`;
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      const data = JSON.parse(stdout);
      const thumbnail = data.thumbnails?.[data.thumbnails.length - 1]?.url || '';
      return {
        id: data.id,
        title: data.title,
        thumbnail,
        channelName: data.uploader || 'Unknown Channel',
        channelId: data.uploader_id || null,
        description: data.description || '',
        trackCount: data.playlist_count || data.entries?.length || 0,
      };
    } catch {
      return null;
    }
  };

  if (!apiKey) return fallbackFn();

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/playlists`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', playlistId);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return fallbackFn();
    const data = await res.json();

    const item = data.items?.[0];
    if (!item) return fallbackFn();

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
    console.warn('[YouTube API failed, falling back to playlist details scraping]', e);
    return fallbackFn();
  }
}

// Get tracks for a playlist (Album tracks)
export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const ytDlpCmd = getDlpExecutable();
  const fallbackFn = async () => {
    const cmd = `${ytDlpCmd} --flat-playlist --dump-single-json "https://www.youtube.com/playlist?list=${playlistId}"`;
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      const data = JSON.parse(stdout);
      if (!data.entries) return [];
      return data.entries.map((entry: any) => ({
        id: entry.id,
        youtubeId: entry.id,
        title: entry.title,
        thumbnail: entry.thumbnails?.[entry.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`,
        duration: Math.round(entry.duration || 0),
        channelName: entry.channel || entry.uploader || 'Unknown Channel',
        channelId: entry.channel_id || null,
      }));
    } catch {
      return [];
    }
  };

  if (!apiKey) return fallbackFn();

  try {
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return fallbackFn();
    const data = await res.json();

    const videoIds = data.items?.map((item: any) => item.contentDetails?.videoId).filter(Boolean) ?? [];
    if (videoIds.length === 0) return fallbackFn();

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
    console.warn('[YouTube API failed, falling back to playlist tracks scraping]', e);
    return fallbackFn();
  }
}
