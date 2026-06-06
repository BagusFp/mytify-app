'use client';

import { useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { Track } from '@/types';

export function usePlayTrack() {
  const { playTrack, addToQueue, setQueue } = usePlayerStore();

  const play = useCallback(
    (track: Track) => {
      playTrack(track);
    },
    [playTrack]
  );

  const playWithQueue = useCallback(
    (track: Track, tracks: Track[]) => {
      const rest = tracks.filter((t) => t.youtubeId !== track.youtubeId);
      setQueue(rest);
      playTrack(track);
    },
    [playTrack, setQueue]
  );

  const enqueue = useCallback(
    (track: Track) => {
      addToQueue(track);
    },
    [addToQueue]
  );

  return { play, playWithQueue, enqueue };
}

export function useFavoriteTrack() {
  const { addFavorite, removeFavorite, isFavorite } = useLibraryStore();

  const toggle = useCallback(
    async (track: Track) => {
      if (isFavorite(track.youtubeId)) {
        await removeFavorite(track.youtubeId);
      } else {
        await addFavorite(track);
      }
    },
    [addFavorite, removeFavorite, isFavorite]
  );

  return { toggle, isFavorite };
}
