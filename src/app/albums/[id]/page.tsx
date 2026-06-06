'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Play, Shuffle, Disc, Users } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { Track, Album } from '@/types';
import { TrackItem } from '@/components/track/TrackItem';
import { Button } from '@/components/ui/button';

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export default function AlbumPage({ params }: AlbumPageProps) {
  const { id } = use(params);
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { playTrack, setQueue } = usePlayerStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/albums/${id}`);
        if (!res.ok) throw new Error('Album not found');
        const data = await res.json();
        setAlbum(data.album);
        setTracks(data.tracks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load album');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-8 w-32 rounded" />
        <div className="flex gap-6 items-end">
          <div className="skeleton w-36 h-36 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-10 w-64 rounded" />
            <div className="skeleton h-5 w-40 rounded" />
          </div>
        </div>
        <div className="space-y-3 pt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-14 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-medium mb-4">{error || 'Album not found'}</p>
        <Link href="/" className="btn-green inline-block px-4 py-2 rounded-full text-sm font-semibold">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter pb-12">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-primary/20 via-background to-background p-6">
        <Link href="/search" className="flex items-center gap-2 text-muted-foreground hover:text-white mb-6 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          {album.thumbnail && (
            <div className="relative w-36 h-36 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 bg-muted">
              <Image
                src={album.thumbnail}
                alt={album.title}
                fill
                sizes="144px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Album / Playlist</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {album.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-sm mt-3 text-muted-foreground">
              {album.channelId ? (
                <Link href={`/artists/${album.channelId}`} className="font-bold text-white hover:underline">
                  {album.channelName}
                </Link>
              ) : (
                <span className="font-bold text-white">{album.channelName}</span>
              )}
              <span>•</span>
              <span>{tracks.length} tracks</span>
            </div>
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="flex justify-center sm:justify-start gap-3 mt-8">
            <Button className="btn-green gap-2 rounded-full px-6" onClick={handlePlayAll}>
              <Play className="w-4 h-4 fill-black" /> Play
            </Button>
            <Button variant="outline" className="gap-2 rounded-full px-6" onClick={handleShuffle}>
              <Shuffle className="w-4 h-4" /> Shuffle
            </Button>
          </div>
        )}
      </div>

      {/* Tracks */}
      <div className="px-6 mt-6">
        {tracks.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">No tracks found in this album.</p>
        ) : (
          <div className="space-y-1">
            {tracks.map((track, i) => (
              <TrackItem
                key={track.youtubeId}
                track={track}
                index={i + 1}
                tracks={tracks}
                showIndex
              />
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {album.description && (
        <div className="px-6 mt-10">
          <div className="bg-secondary/20 rounded-xl p-6 border border-border/40">
            <h2 className="text-lg font-black mb-2">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">
              {album.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
