import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// Cache stream URLs to avoid redundant yt-dlp calls
const streamCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getDlpExecutable(): string {
  const customPath = 'C:\\laragon\\bin\\python\\python-3.10\\Scripts\\yt-dlp.exe';
  if (existsSync(customPath)) {
    return `"${customPath}"`;
  }
  return 'yt-dlp';
}

async function getStreamUrl(videoId: string): Promise<string> {
  // Check cache first
  const cached = streamCache.get(videoId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.url;
  }

  const ytDlpCmd = getDlpExecutable();
  const ytDlpArgs = [
    ytDlpCmd,
    `--no-playlist`,
    `-f`, `bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio`,
    `--get-url`,
    `--no-warnings`,
    `--quiet`,
    `https://www.youtube.com/watch?v=${videoId}`,
  ].join(' ');

  const { stdout, stderr } = await execAsync(ytDlpArgs, { timeout: 30000 });

  if (stderr && !stdout) {
    throw new Error(`yt-dlp error: ${stderr}`);
  }

  const url = stdout.trim().split('\n')[0];
  if (!url || !url.startsWith('http')) {
    throw new Error('yt-dlp returned invalid URL');
  }

  // Cache the result
  streamCache.set(videoId, { url, expiresAt: Date.now() + CACHE_TTL });

  return url;
}

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  try {
    const url = await getStreamUrl(videoId);
    return NextResponse.json({ url, expiresAt: Date.now() + CACHE_TTL });
  } catch (error) {
    console.error('[Stream API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stream URL' },
      { status: 500 }
    );
  }
}
