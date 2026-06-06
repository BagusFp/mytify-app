'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Heart } from 'lucide-react';
import { Track } from '@/types';
import { cn, formatDuration, truncate } from '@/lib/utils';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayTrack } from '@/hooks/useTrackActions';
import { useFavoritesStore } from '@/stores/favoritesStore';

interface TrackCardProps {
  track: Track;
  tracks?: Track[];
  className?: string;
}

export function TrackCard({ track, tracks = [], className }: TrackCardProps) {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { play, playWithQueue } = usePlayTrack();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

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
        'group relative bg-secondary hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all duration-200 select-none',
        className
      )}
      onClick={handlePlay}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted mb-3 shadow-lg">
        <Image
          src={track.thumbnail}
          alt={track.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        
        {/* Heart button overlay */}
        <div className={cn(
          'absolute top-2 right-2 transition-all duration-200 z-10',
          isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          <button
            onClick={handleFavorite}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all duration-200"
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('w-4 h-4 transition-all duration-200', isFav ? 'text-primary fill-primary scale-110' : 'text-white/80 hover:text-white')} />
          </button>
        </div>

        {/* Play button overlay */}
        <div className={cn(
          'absolute bottom-2 right-2 transition-all duration-200',
          isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
        )}>
          <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all duration-200">
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-5 h-5 text-black fill-black" />
            ) : (
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <p className={cn('text-sm font-semibold leading-tight truncate', isCurrentTrack && 'text-primary')}>
        {truncate(track.title, 40)}
      </p>
      <p className="text-xs text-muted-foreground mt-1 truncate">
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
      <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(track.duration)}</p>
    </div>
  );
}
