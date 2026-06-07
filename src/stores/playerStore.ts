import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { toast } from 'sonner';
import { Track, RepeatMode } from '@/types';

interface PlayerStore {
  // State
  currentTrack: Track | null;
  queue: Track[];
  historyQueue: Track[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackPosition: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isLoading: boolean;
  error: string | null;
  streamUrl: string | null;
  showFullPlayer: boolean;

  // Actions
  setCurrentTrack: (track: Track) => void;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (indexOrId: number | string) => void;
  clearQueue: () => void;
  setQueue: (tracks: Track[]) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  isInQueue: (trackId: string) => boolean;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamUrl: (url: string | null) => void;
  setShowFullPlayer: (show: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        currentTrack: null,
        queue: [],
        historyQueue: [],
        isPlaying: false,
        volume: 0.8,
        isMuted: false,
        playbackPosition: 0,
        duration: 0,
        shuffle: false,
        repeat: 'none',
        isLoading: false,
        error: null,
        streamUrl: null,
        showFullPlayer: false,

        setCurrentTrack: (track) => set({ currentTrack: track }),

        playTrack: (track) => {
          const { currentTrack, historyQueue } = get();
          const newHistory = currentTrack
            ? [currentTrack, ...historyQueue.filter((t) => t.youtubeId !== currentTrack.youtubeId)].slice(0, 50)
            : historyQueue;
          set({
            currentTrack: track,
            isPlaying: true,
            playbackPosition: 0,
            streamUrl: null,
            isLoading: true,
            error: null,
            historyQueue: newHistory,
          });
        },

        addToQueue: (track) => {
          const { queue, currentTrack } = get();
          const isCurrent = currentTrack && (currentTrack.id === track.id || currentTrack.youtubeId === track.youtubeId);
          const exists = queue.some((t) => t.id === track.id || t.youtubeId === track.youtubeId);

          if (isCurrent || exists) {
            if (exists) {
              const filtered = queue.filter((t) => t.id !== track.id && t.youtubeId !== track.youtubeId);
              set({ queue: [...filtered, track] });
            }
            toast.info('Already in queue');
            return;
          }

          set({ queue: [...queue, track] });
          toast.success('Added to queue');
        },

        removeFromQueue: (indexOrId) =>
          set((state) => {
            if (typeof indexOrId === 'number') {
              return { queue: state.queue.filter((_, i) => i !== indexOrId) };
            } else {
              return {
                queue: state.queue.filter((t) => t.id !== indexOrId && t.youtubeId !== indexOrId),
              };
            }
          }),

        clearQueue: () => set({ queue: [] }),

        setQueue: (tracks) => {
          const uniqueTracks: Track[] = [];
          const seen = new Set<string>();
          for (const track of tracks) {
            const key = track.youtubeId || track.id;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueTracks.push(track);
            }
          }
          set({ queue: uniqueTracks });
        },

        moveQueueItem: (fromIndex, toIndex) => {
          const { queue } = get();
          if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
          const newQueue = [...queue];
          const [movedItem] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, movedItem);
          set({ queue: newQueue });
        },

        isInQueue: (trackId) => {
          const { queue } = get();
          return queue.some((t) => t.id === trackId || t.youtubeId === trackId);
        },

        playNext: () => {
          const { queue, currentTrack, shuffle, repeat, historyQueue } = get();
          if (repeat === 'one' && currentTrack) {
            set({ playbackPosition: 0, streamUrl: null, isLoading: true });
            return;
          }
          if (queue.length === 0) {
            if (repeat === 'all' && historyQueue.length > 0) {
              const next = historyQueue[historyQueue.length - 1];
              set({ currentTrack: next, playbackPosition: 0, streamUrl: null, isLoading: true });
            } else {
              set({ isPlaying: false });
            }
            return;
          }
          let nextIndex = 0;
          if (shuffle) {
            nextIndex = Math.floor(Math.random() * queue.length);
          }
          const nextTrack = queue[nextIndex];
          const newQueue = queue.filter((_, i) => i !== nextIndex);
          const newHistory = currentTrack
            ? [currentTrack, ...historyQueue.filter((t) => t.youtubeId !== currentTrack.youtubeId)].slice(0, 50)
            : historyQueue;
          set({
            currentTrack: nextTrack,
            queue: newQueue,
            historyQueue: newHistory,
            playbackPosition: 0,
            streamUrl: null,
            isLoading: true,
            isPlaying: true,
            error: null,
          });
        },

        playPrevious: () => {
          const { historyQueue, currentTrack, queue } = get();
          if (get().playbackPosition > 3) {
            set({ playbackPosition: 0, streamUrl: null, isLoading: true });
            return;
          }
          if (historyQueue.length === 0) return;
          const [prev, ...rest] = historyQueue;
          set({
            currentTrack: prev,
            historyQueue: rest,
            queue: currentTrack ? [currentTrack, ...queue] : queue,
            playbackPosition: 0,
            streamUrl: null,
            isLoading: true,
            isPlaying: true,
            error: null,
          });
        },

        togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
        setIsPlaying: (playing) => set({ isPlaying: playing }),
        setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
        toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
        setPlaybackPosition: (position) => set({ playbackPosition: position }),
        setDuration: (duration) => set({ duration }),
        toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
        cycleRepeat: () =>
          set((state) => ({
            repeat: state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none',
          })),
        setIsLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setStreamUrl: (url) => set({ streamUrl: url }),
        setShowFullPlayer: (show) => set({ showFullPlayer: show }),
      }),
      {
        name: 'mytify-player',
        partialize: (state) => ({
          volume: state.volume,
          isMuted: state.isMuted,
          shuffle: state.shuffle,
          repeat: state.repeat,
          queue: state.queue,
          currentTrack: state.currentTrack,
          historyQueue: state.historyQueue,
        }),
      }
    )
  )
);
