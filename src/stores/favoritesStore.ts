import { create } from 'zustand';
import { Favorite, Track } from '@/types';

interface FavoritesStore {
  favorites: Favorite[];
  isLoading: boolean;
  error: string | null;
  mutatingTracks: Record<string, boolean>;

  fetchFavorites: () => Promise<void>;
  addFavorite: (track: Track) => Promise<void>;
  removeFavorite: (youtubeId: string) => Promise<void>;
  toggleFavorite: (track: Track) => Promise<void>;
  isFavorite: (youtubeId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  isLoading: false,
  error: null,
  mutatingTracks: {},

  fetchFavorites: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/favorites');
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      set({ favorites: data });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch favorites' });
    } finally {
      set({ isLoading: false });
    }
  },

  addFavorite: async (track) => {
    const youtubeId = track.youtubeId;
    // Prevent duplicate triggers if already favorited or mutation is in progress
    if (get().isFavorite(youtubeId) || get().mutatingTracks[youtubeId]) {
      return;
    }

    // Mark track as mutating
    set((state) => ({
      mutatingTracks: { ...state.mutatingTracks, [youtubeId]: true },
    }));

    const previousFavorites = get().favorites;

    // Optimistically create and prepend the favorite item
    const tempFavorite: Favorite = {
      id: `temp-${Date.now()}-${youtubeId}`,
      userId: 'default-user',
      trackId: track.id || `temp-track-${youtubeId}`,
      createdAt: new Date().toISOString(),
      track: track,
    };

    set({ favorites: [tempFavorite, ...previousFavorites] });

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track }),
      });

      if (!res.ok) throw new Error('Failed to add favorite');

      const realFavorite = await res.json();

      // Replace the optimistic temporary item with the actual db record
      set((state) => ({
        favorites: state.favorites.map((f) => (f.id === tempFavorite.id ? realFavorite : f)),
      }));
    } catch (err) {
      console.error('[Favorites Store Add Failed, rolling back]', err);
      // Rollback on error
      set({ favorites: previousFavorites });
    } finally {
      // Clear mutating state
      set((state) => {
        const mutating = { ...state.mutatingTracks };
        delete mutating[youtubeId];
        return { mutatingTracks: mutating };
      });
    }
  },

  removeFavorite: async (youtubeId) => {
    // Prevent duplicate triggers if not favorited or mutation is in progress
    if (!get().isFavorite(youtubeId) || get().mutatingTracks[youtubeId]) {
      return;
    }

    // Mark track as mutating
    set((state) => ({
      mutatingTracks: { ...state.mutatingTracks, [youtubeId]: true },
    }));

    const previousFavorites = get().favorites;

    // Optimistically remove the favorite from the local state
    set({
      favorites: previousFavorites.filter(
        (f) => f.track?.youtubeId !== youtubeId && f.trackId !== youtubeId
      ),
    });

    try {
      const res = await fetch(`/api/favorites/${youtubeId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove favorite');
    } catch (err) {
      console.error('[Favorites Store Remove Failed, rolling back]', err);
      // Rollback on error
      set({ favorites: previousFavorites });
    } finally {
      // Clear mutating state
      set((state) => {
        const mutating = { ...state.mutatingTracks };
        delete mutating[youtubeId];
        return { mutatingTracks: mutating };
      });
    }
  },

  toggleFavorite: async (track) => {
    if (get().isFavorite(track.youtubeId)) {
      await get().removeFavorite(track.youtubeId);
    } else {
      await get().addFavorite(track);
    }
  },

  isFavorite: (youtubeId) => {
    return get().favorites.some(
      (f) => f.track?.youtubeId === youtubeId || f.trackId === youtubeId
    );
  },
}));
