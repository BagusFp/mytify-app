'use client';

import { Heart, Play, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Track } from '@/types';
import { TrackItem } from '@/components/track/TrackItem';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const { favorites } = useFavoritesStore();
  const { playTrack, setQueue } = usePlayerStore();

  const tracks: Track[] = favorites.map((f) => f.track);

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
      {/* Header */}
      <div className="bg-gradient-to-b from-pink-900/40 to-background p-6 pb-4">
        <div className="flex items-end gap-6 mb-6">
          <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-pink-600 to-rose-800 flex items-center justify-center shadow-xl">
            <Heart className="w-16 h-16 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Collection</p>
            <h1 className="text-4xl font-black">Favorites ({tracks.length})</h1>
            <p className="text-muted-foreground mt-2">{tracks.length} songs</p>
          </div>
        </div>

        {tracks.length > 0 && (
          <div className="flex gap-3">
            <Button className="btn-green gap-2 rounded-full" onClick={handlePlayAll}>
              <Play className="w-4 h-4 fill-black" /> Play all
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
          <div className="flex flex-col items-center justify-center py-20 text-center select-none">
            <Heart className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No favorite songs yet</h3>
            <p className="text-zinc-500 max-w-xs mb-6 text-sm">
              Add songs to your favorites to keep track of your loved music.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Find Songs
            </Link>
          </div>
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
    </div>
  );
}
