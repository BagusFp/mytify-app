import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';

export interface LocalFavorite {
  id: string;
  trackId: string;
  createdAt: string;
  track: Track;
}

interface FavoritesStore {
  favorites: LocalFavorite[];

  addFavorite: (track: Track) => void;
  removeFavorite: (youtubeId: string) => void;
  toggleFavorite: (track: Track) => void;
  isFavorite: (youtubeId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (track) => {
        const { favorites, isFavorite } = get();
        if (isFavorite(track.youtubeId)) return;
        const entry: LocalFavorite = {
          id: `fav-${Date.now()}-${track.youtubeId}`,
          trackId: track.youtubeId,
          createdAt: new Date().toISOString(),
          track,
        };
        set({ favorites: [entry, ...favorites] });
      },

      removeFavorite: (youtubeId) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.track.youtubeId !== youtubeId),
        }));
      },

      toggleFavorite: (track) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(track.youtubeId)) {
          removeFavorite(track.youtubeId);
        } else {
          addFavorite(track);
        }
      },

      isFavorite: (youtubeId) => {
        return get().favorites.some((f) => f.track.youtubeId === youtubeId);
      },
    }),
    {
      name: 'mytify-favorites',
    }
  )
);
