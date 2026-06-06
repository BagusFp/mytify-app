# Mytify 🎵

A Spotify-inspired music streaming web application built with Next.js 15, streaming audio from YouTube via yt-dlp.

## Features

- 🔍 **YouTube Music Search** — powered by YouTube Data API v3
- 🎵 **Persistent Audio Player** — single global Audio instance, survives page navigation
- ❤️ **Favorites** — like/unlike tracks, saved to PostgreSQL
- 📚 **Playlists** — create, rename, delete playlists; add/remove tracks
- 🕐 **History** — automatically records listening history
- 🔀 **Shuffle & Repeat** — full queue management
- 📱 **Mobile First** — responsive layout with bottom nav
- 🔔 **Media Session API** — lock screen/notification controls
- 📲 **PWA** — installable on Android/desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (base-ui) |
| State | Zustand with persistence |
| Database | PostgreSQL + Prisma ORM v7 |
| Audio | yt-dlp (backend stream extraction) |
| API | YouTube Data API v3 |

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL database
- `yt-dlp` installed and in PATH: https://github.com/yt-dlp/yt-dlp
- YouTube Data API v3 key: https://console.cloud.google.com

### 2. Install yt-dlp

**Windows (PowerShell):**
```powershell
winget install yt-dlp
# or
pip install yt-dlp
```

### 3. Environment Variables

Copy `.env` and fill in your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mytify?schema=public"
YOUTUBE_API_KEY="your-youtube-api-key"
```

### 4. Database Setup

```bash
# Run migrations
npx prisma migrate dev --name init

# Or push schema directly (no migration files)
npx prisma db push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── search/         # YouTube search endpoint
│   │   ├── stream/         # yt-dlp stream URL endpoint
│   │   ├── playlists/      # CRUD for playlists
│   │   ├── favorites/      # CRUD for favorites
│   │   ├── history/        # Listening history
│   │   └── home/           # Home page data aggregation
│   ├── search/             # Search page
│   ├── library/            # Library/playlists page
│   ├── favorites/          # Favorites page
│   ├── history/            # History page
│   └── playlists/[id]/     # Playlist detail page
├── components/
│   ├── layout/             # AppShell, Sidebar, BottomNav
│   ├── player/             # MiniPlayer, FullPlayer
│   ├── track/              # TrackItem, TrackCard
│   └── pwa/                # ServiceWorkerRegistration
├── hooks/
│   ├── useAudioEngine.ts   # Global audio singleton + Media Session
│   └── useTrackActions.ts  # Track play/favorite helpers
├── stores/
│   ├── playerStore.ts      # Zustand player state
│   └── libraryStore.ts     # Zustand library state
├── services/
│   └── youtube.ts          # YouTube API client
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── utils.ts            # Utility functions
│   └── constants.ts        # App constants
└── types/
    └── index.ts            # TypeScript types
```

## Architecture Decisions

### Single Audio Instance
The audio engine uses a module-level singleton (`let globalAudio: HTMLAudioElement | null`), ensuring playback never stops during route navigation.

### Prisma v7
Uses driver adapter pattern (`@prisma/adapter-pg`) as required by Prisma v7. The `DATABASE_URL` is configured in `prisma.config.ts` for migrations and in `src/lib/prisma.ts` for runtime.

### Single-User Mode
Currently runs in single-user mode with a fixed `DEFAULT_USER_ID`. Authentication-ready: swap `DEFAULT_USER_ID` with the actual session user ID to enable multi-user support.

### Authentication (Future)
The architecture is ready for Clerk/NextAuth/Better Auth. Add a `userId` from the session to all API routes instead of `DEFAULT_USER_ID`.

## License

Personal and educational use only.
