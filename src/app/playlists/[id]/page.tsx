'use client';

import { use, useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ListMusic, Play, Shuffle } from 'lucide-react';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Track } from '@/types';
import { TrackItem } from '@/components/track/TrackItem';
import { Button } from '@/components/ui/button';

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = use(params);
  const { playlists } = useLibraryStore();
  const { playTrack, setQueue } = usePlayerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-8 w-32 rounded" />
        <div className="flex gap-6 items-end">
          <div className="skeleton w-32 h-32 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-10 w-64 rounded" />
            <div className="skeleton h-5 w-40 rounded" />
          </div>
        </div>
        <div className="space-y-3 pt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const playlist = playlists.find((p) => p.id === id);
  if (!playlist) return notFound();

  const tracks: Track[] = playlist.tracks.map((pt) => pt.track);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    const [first, ...rest] = tracks;
    setQueue(rest);
    playTrack(first);
  };

  const handleShuffle = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const [first, ...rest] = shuffled;
    setQueue(rest);
    playTrack(first);
  };

  return (
    <div className="page-enter">
      {/* Header with gradient */}
      <div className="bg-gradient-to-b from-primary/20 to-background p-6 pb-4">
        <Link href="/library" className="flex items-center gap-2 text-muted-foreground hover:text-white mb-6 w-fit">
          <ArrowLeft className="w-4 h-4" /> Library
        </Link>
        <div className="flex items-end gap-6">
          <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-xl">
            <ListMusic className="w-16 h-16 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Playlist</p>
            <h1 className="text-4xl font-serif font-bold">{playlist.name}</h1>
            <p className="text-muted-foreground mt-2">{tracks.length} songs</p>
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="flex gap-3 mt-6">
            <Button className="btn-green gap-2 rounded-full" onClick={handlePlayAll}>
              <Play className="w-4 h-4 fill-black" /> Play
            </Button>
            <Button variant="outline" className="gap-2 rounded-full" onClick={handleShuffle}>
              <Shuffle className="w-4 h-4" /> Shuffle
            </Button>
          </div>
        )}
      </div>

      {/* Track list */}
      <div className="p-6 pt-2">
        {tracks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No songs in this playlist yet.</p>
            <p className="text-sm mt-1">Search for songs and add them here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((track, i) => (
              <TrackItem
                key={`${track.youtubeId}-${i}`}
                track={track}
                index={i + 1}
                tracks={tracks}
                showIndex
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
