import { create } from 'zustand';
import { Playlist, Favorite, HistoryEntry, Track } from '@/types';
import { useFavoritesStore } from './favoritesStore';

interface LibraryStore {
  playlists: Playlist[];
  favorites: Favorite[];
  historyEntries: HistoryEntry[];
  isLoading: boolean;
  error: string | null;

  // Playlists
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist | null>;
  deletePlaylist: (id: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;

  // Favorites
  fetchFavorites: () => Promise<void>;
  addFavorite: (track: Track) => Promise<void>;
  removeFavorite: (trackId: string) => Promise<void>;
  isFavorite: (trackId: string) => boolean;

  // History
  fetchHistory: () => Promise<void>;
  addToHistory: (track: Track) => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  playlists: [],
  favorites: [],
  historyEntries: [],
  isLoading: false,
  error: null,

  fetchPlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/playlists');
      if (!res.ok) throw new Error('Failed to fetch playlists');
      const data = await res.json();
      set({ playlists: data });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },

  createPlaylist: async (name) => {
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create playlist');
      const playlist = await res.json();
      set((state) => ({ playlists: [playlist, ...state.playlists] }));
      return playlist;
    } catch {
      return null;
    }
  },

  deletePlaylist: async (id) => {
    set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) }));
    await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
  },

  renamePlaylist: async (id, name) => {
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
    await fetch(`/api/playlists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  },

  addTrackToPlaylist: async (playlistId, track) => {
    await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track }),
    });
    await get().fetchPlaylists();
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' });
    await get().fetchPlaylists();
  },

  fetchFavorites: async () => {
    await useFavoritesStore.getState().fetchFavorites();
  },

  addFavorite: async (track) => {
    await useFavoritesStore.getState().addFavorite(track);
  },

  removeFavorite: async (trackId) => {
    await useFavoritesStore.getState().removeFavorite(trackId);
  },

  isFavorite: (trackId) => {
    return useFavoritesStore.getState().isFavorite(trackId);
  },

  fetchHistory: async () => {
    try {
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      set({ historyEntries: data });
    } catch {
      // silent
    }
  },

  addToHistory: async (track) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track }),
      });
    } catch {
      // silent
    }
  },
}));

// Subscribe to favoritesStore to keep favorites synchronized in libraryStore
useFavoritesStore.subscribe((state) => {
  useLibraryStore.setState({ favorites: state.favorites });
});
