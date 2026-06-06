'use client';

import { useEffect, useState, useCallback } from 'react';
import { Heart, Play, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Track } from '@/types';
import { TrackItem } from '@/components/track/TrackItem';
import { Button } from '@/components/ui/button';
import { InfiniteScroll } from '@/components/ui/InfiniteScroll';

export default function FavoritesPage() {
  const { isFavorite, favorites: storeFavorites } = useFavoritesStore();
  const { playTrack, setQueue } = usePlayerStore();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    try {
      const res = await fetch('/api/favorites?page=1&limit=20');
      if (res.ok) {
        const data = await res.json();
        setTracks(data.favorites.map((f: any) => f.track).filter(Boolean));
        setTotalCount(data.total);
        setHasMore(data.hasMore);
        setPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/favorites?page=${nextPage}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const newTracks = data.favorites.map((f: any) => f.track).filter(Boolean);
        setTracks((prev) => {
          const existingIds = new Set(prev.map((t) => t.youtubeId));
          const filtered = newTracks.filter((t: Track) => !existingIds.has(t.youtubeId));
          return [...prev, ...filtered];
        });
        setTotalCount(data.total);
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [page, hasMore, isFetchingMore]);

  // Synchronize when store favorites change (e.g. addition/removal)
  const tracksToShow = tracks.filter((t) => isFavorite(t.youtubeId));

  const handlePlayAll = () => {
    if (tracksToShow.length === 0) return;
    const [first, ...rest] = tracksToShow;
    setQueue(rest);
    playTrack(first);
  };

  const handleShuffle = () => {
    if (tracksToShow.length === 0) return;
    const shuffled = [...tracksToShow].sort(() => Math.random() - 0.5);
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
            <h1 className="text-4xl font-black">Favorites ({totalCount})</h1>
            <p className="text-muted-foreground mt-2">{tracksToShow.length} visible songs</p>
          </div>
        </div>

        {tracksToShow.length > 0 && (
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
        {initialLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 rounded-md" />
            ))}
          </div>
        ) : tracksToShow.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center select-none">
            <Heart className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No favorite songs yet</h3>
            <p className="text-zinc-500 max-w-xs mb-6 text-sm">Add songs to your favorites to keep track of your loved music.</p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Find Songs
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {tracksToShow.map((track, i) => (
                <TrackItem
                  key={track.youtubeId}
                  track={track}
                  index={i + 1}
                  tracks={tracksToShow}
                  showIndex
                />
              ))}
            </div>
            <InfiniteScroll
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoading={isFetchingMore}
            />
          </>
        )}
      </div>
    </div>
  );
}
