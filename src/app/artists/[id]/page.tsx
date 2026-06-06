'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Play, Shuffle, Disc, Users } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { Track, Artist, Album } from '@/types';
import { TrackItem } from '@/components/track/TrackItem';
import { Button } from '@/components/ui/button';

interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const { id } = use(params);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { playTrack, setQueue } = usePlayerStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/artists/${id}`);
        if (!res.ok) throw new Error('Artist not found');
        const data = await res.json();
        setArtist(data.artist);
        setTracks(data.tracks || []);
        setAlbums(data.albums || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artist');
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
        <div className="flex gap-6 items-center">
          <div className="skeleton w-36 h-36 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-10 w-64 rounded" />
            <div className="skeleton h-5 w-40 rounded" />
          </div>
        </div>
        <div className="space-y-3 pt-6">
          <div className="skeleton h-8 w-40 rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-14 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-medium mb-4">{error || 'Artist not found'}</p>
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
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white mb-6 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          {artist.thumbnail && (
            <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-2xl border-4 border-white/10 flex-shrink-0">
              <Image
                src={artist.thumbnail}
                alt={artist.name}
                fill
                sizes="144px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" /> Verified Artist
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">{artist.name}</h1>
            {artist.subscriberCount && (
              <p className="text-muted-foreground mt-2 text-sm">
                {artist.subscriberCount} subscribers on YouTube
              </p>
            )}
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="flex justify-center md:justify-start gap-3 mt-8">
            <Button className="btn-green gap-2 rounded-full px-6" onClick={handlePlayAll}>
              <Play className="w-4 h-4 fill-black" /> Play Artist
            </Button>
            <Button variant="outline" className="gap-2 rounded-full px-6" onClick={handleShuffle}>
              <Shuffle className="w-4 h-4" /> Shuffle
            </Button>
          </div>
        )}
      </div>

      {/* Popular Tracks */}
      <div className="px-6 mt-6">
        <h2 className="text-2xl font-black mb-4">Popular Tracks</h2>
        {tracks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tracks found for this artist.</p>
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

      {/* Albums / Playlists Section */}
      {albums.length > 0 && (
        <div className="px-6 mt-10">
          <h2 className="text-2xl font-black mb-4">Albums & Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.id}`}
                className="group bg-secondary hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all duration-200"
              >
                <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted mb-3 shadow-lg">
                  <Image
                    src={album.thumbnail}
                    alt={album.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-xl">
                      <Disc className="w-5 h-5 text-black animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold leading-tight truncate group-hover:text-primary">
                  {album.title}
                </h3>
                {album.trackCount !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">{album.trackCount} tracks</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Description / About */}
      {artist.description && (
        <div className="px-6 mt-10">
          <div className="bg-secondary/40 rounded-xl p-6 border border-border/40">
            <h2 className="text-lg font-black mb-2">About {artist.name}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">
              {artist.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
