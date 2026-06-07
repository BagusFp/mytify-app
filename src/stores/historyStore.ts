import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';

export interface LocalHistoryEntry {
  id: string;
  trackId: string;
  playedAt: string;
  track: Track;
}

interface HistoryStore {
  history: LocalHistoryEntry[];

  addToHistory: (track: Track) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 500;

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      history: [],

      addToHistory: (track) => {
        const { history } = get();
        const now = Date.now();

        // Filter out any existing occurrences of this track to guarantee uniqueness
        const filteredHistory = history.filter(
          (e) => e.track.youtubeId !== track.youtubeId && e.trackId !== track.youtubeId
        );

        // Prepend the new entry to the top of the history list
        const entry: LocalHistoryEntry = {
          id: `hist-${now}-${track.youtubeId}`,
          trackId: track.youtubeId,
          playedAt: new Date().toISOString(),
          track,
        };

        set({
          history: [entry, ...filteredHistory].slice(0, MAX_HISTORY),
        });
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'mytify-history',
    }
  )
);
