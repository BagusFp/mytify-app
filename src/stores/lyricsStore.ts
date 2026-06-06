'use client';

import { create } from 'zustand';
import { Track } from '@/types';

export interface LyricLine {
  time: number;
  text: string;
}

export function parseLRC(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  
  // Parse offset if any (standard LRC format uses [offset: +/- milliseconds])
  const offsetRegex = /^\[offset:\s*(-?\d+)\s*\]/i;
  let offsetMs = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const offsetMatch = offsetRegex.exec(trimmed);
    if (offsetMatch) {
      offsetMs = parseInt(offsetMatch[1], 10);
      break;
    }
  }
  const offsetSec = offsetMs / 1000;

  // Regex to match one or more timestamps: e.g. [01:02.34] or [01:02,34] or [1:2.3]
  const timeRegex = /\[(\d{1,2}):(\d{1,2})(?:[\.,](\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip metadata lines that do not have text or are strictly headers
    if (
      trimmed.startsWith('[offset:') ||
      trimmed.startsWith('[ar:') ||
      trimmed.startsWith('[ti:') ||
      trimmed.startsWith('[al:') ||
      trimmed.startsWith('[by:')
    ) {
      continue;
    }

    // Find all matches for timestamps in this line
    const matches: { time: number }[] = [];
    let match;
    timeRegex.lastIndex = 0; // reset regex state
    
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const hundredthsOrMsStr = match[3] || '0';
      const hundredthsOrMs = parseInt(hundredthsOrMsStr, 10);
      
      let ms = hundredthsOrMs;
      if (hundredthsOrMsStr.length === 1) {
        ms = hundredthsOrMs * 100;
      } else if (hundredthsOrMsStr.length === 2) {
        ms = hundredthsOrMs * 10;
      }
      
      // Apply offset to the timestamp (standard LRC: positive offset means lyrics show later, so we add it)
      const time = minutes * 60 + seconds + ms / 1000 + offsetSec;
      matches.push({ time });
    }

    if (matches.length > 0) {
      // The text is whatever is left after removing all timestamps
      const text = trimmed.replace(timeRegex, '').trim();
      for (const m of matches) {
        result.push({ time: m.time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

interface LyricsStore {
  lyricsCache: Record<string, { synced: LyricLine[] | null; plain: string[] | null; error: boolean }>;
  isLoading: boolean;
  currentLyrics: { synced: LyricLine[] | null; plain: string[] | null } | null;
  lyricsTrackId: string | null;
  showLyrics: boolean;

  fetchLyrics: (track: Track) => Promise<void>;
  toggleLyrics: () => void;
  setShowLyrics: (show: boolean) => void;
}

export const useLyricsStore = create<LyricsStore>((set, get) => ({
  lyricsCache: {},
  isLoading: false,
  currentLyrics: null,
  lyricsTrackId: null,
  showLyrics: false,

  fetchLyrics: async (track) => {
    const trackKey = track.youtubeId || track.id;
    if (!trackKey) return;

    const { lyricsCache } = get();
    if (lyricsCache[trackKey]) {
      set({
        currentLyrics: {
          synced: lyricsCache[trackKey].synced,
          plain: lyricsCache[trackKey].plain,
        },
        lyricsTrackId: trackKey,
      });
      return;
    }

    set({ isLoading: true, lyricsTrackId: trackKey, currentLyrics: null });

    try {
      const cleanTitle = encodeURIComponent(
        track.title
          .replace(/\s*[\(\[][^)]*(?:video|official|lyrics|audio|music)[^)]*[\)\]]/gi, '')
          .trim()
      );
      const cleanArtist = encodeURIComponent(track.channelName.replace(/\s*-\s*topic/gi, '').trim());

      const res = await fetch(
        `https://lrclib.net/api/get?artist_name=${cleanArtist}&track_name=${cleanTitle}`
      );

      if (res.ok) {
        const data = await res.json();

        let synced: LyricLine[] | null = null;
        if (data.syncedLyrics) {
          synced = parseLRC(data.syncedLyrics);
        }

        let plain: string[] | null = null;
        if (data.plainLyrics) {
          plain = data.plainLyrics
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean);
        } else if (synced) {
          plain = synced.map((line) => line.text);
        }

        const entry = { synced, plain, error: false };
        set((state) => ({
          lyricsCache: { ...state.lyricsCache, [trackKey]: entry },
          currentLyrics: { synced, plain },
          isLoading: false,
        }));
      } else {
        const entry = { synced: null, plain: null, error: true };
        set((state) => ({
          lyricsCache: { ...state.lyricsCache, [trackKey]: entry },
          currentLyrics: null,
          isLoading: false,
        }));
      }
    } catch (err) {
      console.error('Error fetching lyrics:', err);
      set({ isLoading: false, currentLyrics: null });
    }
  },

  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
  setShowLyrics: (show) => set({ showLyrics: show }),
}));
