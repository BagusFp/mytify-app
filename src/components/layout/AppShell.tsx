'use client';

import { useEffect } from 'react';
import { useLibraryStore } from '@/stores/libraryStore';
import { Sidebar, BottomNav } from '@/components/layout/Navigation';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { FullPlayer } from '@/components/player/FullPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/Header';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useAudioEngine(); // Run the global audio engine singleton

  const { fetchPlaylists } = useLibraryStore();
  const { currentTrack } = usePlayerStore();

  // Load library data on mount (no-op: localStorage loads automatically via persist)
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        className={cn(
          'flex-1 overflow-x-hidden min-h-screen flex flex-col',
          currentTrack ? 'main-content-padding-player' : 'main-content-padding'
        )}
      >
        <PageHeader />
        <div className="flex-1">{children}</div>
      </main>

      {/* Full screen player modal */}
      <FullPlayer />

      {/* Persistent bottom player */}
      <MiniPlayer />

      {/* Mobile bottom nav — above player */}
      <div className={currentTrack ? 'mb-20 md:mb-0' : ''}>
        <BottomNav />
      </div>

      {/* Toast notifications */}
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
