'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, MoreHorizontal, Heart, Plus, ListMusic } from 'lucide-react';
import { Track } from '@/types';
import { cn, formatDuration, truncate } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { usePlayTrack } from '@/hooks/useTrackActions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TrackItemProps {
  track: Track;
  index?: number;
  tracks?: Track[];
  showIndex?: boolean;
  className?: string;
}

export function TrackItem({ track, index, tracks = [], showIndex = false, className }: TrackItemProps) {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { playlists } = useLibraryStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { play, playWithQueue, enqueue } = usePlayTrack();

  const isCurrentTrack = currentTrack?.youtubeId === track.youtubeId;
  const isFav = isFavorite(track.youtubeId);

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else if (tracks.length > 0) {
      playWithQueue(track, tracks);
    } else {
      play(track);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track);
  };

  return (
    <div
      className={cn(
        'track-card group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer select-none',
        isCurrentTrack && 'bg-white/5',
        className
      )}
      onClick={handlePlay}
    >
      {/* Index / Play Icon */}
      <div className="relative flex-shrink-0 w-8 text-center">
        {showIndex && !isCurrentTrack && (
          <span className="text-sm text-muted-foreground group-hover:hidden">{index}</span>
        )}
        <div className={cn(
          'play-overlay absolute inset-0 flex items-center justify-center',
          !showIndex && 'opacity-0 group-hover:opacity-100',
          showIndex && 'hidden group-hover:flex'
        )}>
          {isCurrentTrack && isPlaying ? (
            <Pause className="w-4 h-4 text-primary" />
          ) : (
            <Play className="w-4 h-4 text-white fill-white" />
          )}
        </div>
        {isCurrentTrack && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center group-hover:hidden">
            <Pause className="w-4 h-4 text-primary" />
          </div>
        )}
        {isCurrentTrack && isPlaying && (
          <span className="text-primary text-xs font-bold tracking-tight group-hover:hidden">▶</span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-secondary">
        <Image
          src={track.thumbnail}
          alt={track.title}
          fill
          sizes="40px"
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate leading-tight', isCurrentTrack && 'text-primary')}>
          {track.title}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {track.channelId ? (
            <Link
              href={`/artists/${track.channelId}`}
              className="hover:underline hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {track.channelName}
            </Link>
          ) : (
            track.channelName
          )}
        </p>
      </div>

      {/* Duration + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
          {formatDuration(track.duration)}
        </span>

        <div
          className={cn(
            'flex items-center gap-1',
            isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 transition-all duration-200 hover:scale-110 active:scale-90', isFav && 'text-primary')}
            onClick={handleFavorite}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('w-3.5 h-3.5 transition-all duration-200', isFav && 'fill-primary text-primary')} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-7 w-7 transition-transform duration-200 active:scale-90">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => enqueue(track)}>
                <Plus className="w-4 h-4 mr-2" /> Add to queue
              </DropdownMenuItem>
              {playlists.map((pl) => (
                <DropdownMenuItem
                  key={pl.id}
                  onClick={() => useLibraryStore.getState().addTrackToPlaylist(pl.id, track)}
                >
                  <ListMusic className="w-4 h-4 mr-2" />
                  {truncate(pl.name, 20)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
