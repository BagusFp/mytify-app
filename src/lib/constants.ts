// Default user ID for single-user mode (pre-auth)
export const DEFAULT_USER_ID = 'default-user';

export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export const PLAYER_DEFAULTS = {
  volume: 0.8,
  shuffle: false,
  repeat: 'none' as const,
};

export const MOCK_USER = {
  id: DEFAULT_USER_ID,
  name: 'Music Lover',
  email: 'user@mytify.app',
  createdAt: new Date().toISOString(),
};

// Trending/featured video IDs for home page mock content
export const FEATURED_VIDEO_IDS = [
  'dQw4w9WgXcQ',
  'kJQP7kiw5Fk',
  'fJ9rUzIMcZQ',
  'hT_nvWreIhg',
  'CevxZvSJLk8',
  'y6120QOlsfU',
  'RgKAFK5djSk',
  '0KSOMA3QBU0',
  'YqeW9_5kURI',
  'e-ORhEE9VVg',
];
