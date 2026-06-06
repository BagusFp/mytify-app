// Core track/music types
export interface Track {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration: number; // seconds
  channelName: string;
  channelId?: string; // YouTube Channel ID
}

export interface SearchResult {
  youtubeId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelId?: string; // YouTube Channel ID
  duration: number;
}

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  tracks?: PlaylistTrack[];
}

export interface PlaylistTrack {
  playlistId: string;
  trackId: string;
  addedAt: string;
  track?: Track;
}

export interface Favorite {
  id: string;
  userId: string;
  trackId: string;
  createdAt: string;
  track?: Track;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  trackId: string;
  playedAt: string;
  track?: Track;
}

// Player state types
export type RepeatMode = 'none' | 'one' | 'all';

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackPosition: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isLoading: boolean;
  error: string | null;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface StreamUrlResponse {
  url: string;
  expiresAt?: number;
}

// User type (for future auth)
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Artist {
  id: string; // YouTube Channel ID
  name: string;
  thumbnail: string;
  description?: string;
  subscriberCount?: string;
}

export interface Album {
  id: string; // YouTube Playlist ID
  title: string;
  thumbnail: string;
  channelName: string;
  channelId?: string;
  description?: string;
  trackCount?: number;
}
