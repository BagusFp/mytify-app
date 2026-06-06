'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, Heart, ListMusic, Mic2
} from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useLyricsStore } from '@/stores/lyricsStore';
import { useAudioControls } from '@/hooks/useAudioEngine';
import { cn, formatDuration } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, volume, isMuted, playbackPosition, duration,
    shuffle, repeat, isLoading,
    togglePlay, setVolume, toggleMute, playNext, playPrevious,
    toggleShuffle, cycleRepeat, setShowFullPlayer, showFullPlayer,
  } = usePlayerStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { showLyrics, toggleLyrics, setShowLyrics } = useLyricsStore();
  const { seek } = useAudioControls();

  const isFav = currentTrack ? isFavorite(currentTrack.youtubeId) : false;

  const handleFavorite = useCallback(() => {
    if (!currentTrack) return;
    toggleFavorite(currentTrack);
  }, [currentTrack, toggleFavorite]);

  const handleLyricsClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!showFullPlayer) {
        setShowFullPlayer(true);
        setShowLyrics(true);
      } else {
        toggleLyrics();
      }
    },
    [showFullPlayer, setShowFullPlayer, setShowLyrics, toggleLyrics]
  );

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-900 player-safe-bottom">
      {/* Progress bar on top (Mobile only) */}
      <div
        className="w-full h-[2px] bg-white/10 cursor-pointer md:hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const fraction = (e.clientX - rect.left) / rect.width;
          seek(fraction * duration);
        }}
      >
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${duration > 0 ? (playbackPosition / duration) * 100 : 0}%` }}
        />
      </div>

      {/* Main container */}
      <div className="px-4 py-3 md:py-4">
        {/* DESKTOP MINI PLAYER */}
        <div className="hidden md:flex items-center justify-between gap-4">
          
          {/* Left: Info + Heart */}
          <div className="flex items-center gap-3 w-[30%] min-w-[200px]">
            <div
              className="relative w-14 h-14 rounded overflow-hidden cursor-pointer shadow-md flex-shrink-0 group bg-zinc-900"
              onClick={() => setShowFullPlayer(true)}
            >
              <Image
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                fill
                sizes="56px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-semibold truncate text-white hover:underline cursor-pointer leading-tight"
                onClick={() => setShowFullPlayer(true)}
              >
                {currentTrack.title}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-1">
                {currentTrack.channelName}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-90 flex-shrink-0',
                isFav && 'text-primary hover:text-primary'
              )}
              onClick={handleFavorite}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('w-4.5 h-4.5 transition-all duration-200', isFav && 'fill-primary text-primary')} />
            </Button>
          </div>

          {/* Center: Controls + Progress */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[45%]">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8 text-zinc-400 hover:text-white rounded-full transition-colors', shuffle && 'text-primary hover:text-primary')}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <Shuffle className="w-4.5 h-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white rounded-full transition-colors"
                onClick={playPrevious}
                title="Previous"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white text-black hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md"
                onClick={togglePlay}
                disabled={isLoading}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current text-black" />
                ) : (
                  <Play className="w-5 h-5 fill-current text-black ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white rounded-full transition-colors"
                onClick={playNext}
                title="Next"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8 text-zinc-400 hover:text-white rounded-full transition-colors', repeat !== 'none' && 'text-primary hover:text-primary')}
                onClick={cycleRepeat}
                title="Repeat"
              >
                {repeat === 'one' ? <Repeat1 className="w-4.5 h-4.5" /> : <Repeat className="w-4.5 h-4.5" />}
              </Button>
            </div>

            {/* Seek Bar */}
            <div className="flex items-center gap-2.5 w-full">
              <span className="text-[10px] text-zinc-400 tabular-nums w-8 text-right select-none">
                {formatDuration(playbackPosition)}
              </span>
              <Slider
                value={[playbackPosition]}
                min={0}
                max={duration || 100}
                step={1}
                className="flex-1"
                onValueChange={(v) => seek(Array.isArray(v) ? v[0] : v)}
              />
              <span className="text-[10px] text-zinc-400 tabular-nums w-8 select-none">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Right: Queue + Volume */}
          <div className="flex items-center gap-3 w-[30%] justify-end min-w-[240px]">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 text-zinc-400 hover:text-white transition-colors',
                showLyrics && 'text-primary hover:text-primary'
              )}
              onClick={handleLyricsClick}
              title="Lyrics"
            >
              <Mic2 className="w-4.5 h-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 text-zinc-400 hover:text-white transition-colors',
                showFullPlayer && 'text-primary hover:text-primary'
              )}
              onClick={() => setShowFullPlayer(!showFullPlayer)}
              title="Open full player & queue"
            >
              <ListMusic className="w-4.5 h-4.5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white transition-colors"
                onClick={toggleMute}
                title="Toggle Mute"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                className="w-24"
                onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)}
              />
            </div>
          </div>
        </div>

        {/* MOBILE MINI PLAYER */}
        <div
          className="flex md:hidden items-center justify-between gap-3 cursor-pointer"
          onClick={() => setShowFullPlayer(true)}
        >
          {/* Left: Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-12 h-12 rounded overflow-hidden bg-zinc-900 flex-shrink-0">
              <Image
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white leading-tight">
                {currentTrack.title}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {currentTrack.channelName}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10 text-zinc-400 transition-all hover:scale-110 active:scale-90',
                showLyrics && 'text-primary'
              )}
              onClick={handleLyricsClick}
              title="Lyrics"
            >
              <Mic2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-10 w-10 text-zinc-400 transition-all hover:scale-110 active:scale-90',
                isFav && 'text-primary'
              )}
              onClick={handleFavorite}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('w-5 h-5 transition-all duration-200', isFav && 'fill-primary text-primary')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all flex items-center justify-center"
              onClick={togglePlay}
              disabled={isLoading}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-black" />
              ) : (
                <Play className="w-5 h-5 fill-current text-black ml-0.5" />
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
