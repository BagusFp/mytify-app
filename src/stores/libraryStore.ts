import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';
import { useFavoritesStore } from './favoritesStore';

export interface LocalPlaylist {
  id: string;
  name: string;
  createdAt: string;
  tracks: LocalPlaylistTrack[];
}

export interface LocalPlaylistTrack {
  playlistId: string;
  trackId: string;
  addedAt: string;
  track: Track;
}

interface LibraryStore {
  playlists: LocalPlaylist[];
  isLoading: boolean;

  // Playlists
  fetchPlaylists: () => void;
  createPlaylist: (name: string) => LocalPlaylist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;

  // Favorites (delegate to favoritesStore)
  favorites: ReturnType<typeof useFavoritesStore.getState>['favorites'];
  addFavorite: (track: Track) => void;
  removeFavorite: (youtubeId: string) => void;
  isFavorite: (youtubeId: string) => boolean;

  // History (noop — managed by historyStore via useAudioEngine)
  addToHistory: (track: Track) => void;
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      playlists: [],
      isLoading: false,
      favorites: [],

      // Playlists
      fetchPlaylists: () => {
        // No-op: already loaded from localStorage via persist
      },

      createPlaylist: (name) => {
        const playlist: LocalPlaylist = {
          id: `pl-${Date.now()}`,
          name,
          createdAt: new Date().toISOString(),
          tracks: [],
        };
        set((state) => ({ playlists: [playlist, ...state.playlists] }));
        return playlist;
      },

      deletePlaylist: (id) => {
        set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) }));
      },

      renamePlaylist: (id, name) => {
        set((state) => ({
          playlists: state.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
        }));
      },

      addTrackToPlaylist: (playlistId, track) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const alreadyAdded = p.tracks.some((pt) => pt.track.youtubeId === track.youtubeId);
            if (alreadyAdded) return p;
            const entry: LocalPlaylistTrack = {
              playlistId,
              trackId: track.youtubeId,
              addedAt: new Date().toISOString(),
              track,
            };
            return { ...p, tracks: [...p.tracks, entry] };
          }),
        }));
      },

      removeTrackFromPlaylist: (playlistId, trackId) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            return {
              ...p,
              tracks: p.tracks.filter((pt) => pt.track.youtubeId !== trackId && pt.trackId !== trackId),
            };
          }),
        }));
      },

      // Favorites — delegate to favoritesStore
      addFavorite: (track) => {
        useFavoritesStore.getState().addFavorite(track);
      },

      removeFavorite: (youtubeId) => {
        useFavoritesStore.getState().removeFavorite(youtubeId);
      },

      isFavorite: (youtubeId) => {
        return useFavoritesStore.getState().isFavorite(youtubeId);
      },

      // History — managed by historyStore, noop here for API compat
      addToHistory: () => {},
    }),
    {
      name: 'mytify-library',
      partialize: (state) => ({ playlists: state.playlists }),
    }
  )
);

// Keep libraryStore.favorites in sync with favoritesStore
useFavoritesStore.subscribe((state) => {
  useLibraryStore.setState({ favorites: state.favorites });
});
