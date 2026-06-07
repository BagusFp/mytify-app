'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, ChevronDown, Heart, ListMusic, Trash2, Mic2
} from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useLyricsStore } from '@/stores/lyricsStore';
import { useAudioControls } from '@/hooks/useAudioEngine';
import { cn, formatDuration } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrackItem } from '@/components/track/TrackItem';
import { LyricsView } from './LyricsView';

export function FullPlayer() {
  const {
    currentTrack, isPlaying, volume, isMuted, playbackPosition, duration,
    shuffle, repeat, isLoading, queue,
    togglePlay, setVolume, toggleMute, playNext, playPrevious,
    toggleShuffle, cycleRepeat, setShowFullPlayer, showFullPlayer, clearQueue
  } = usePlayerStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { showLyrics, setShowLyrics } = useLyricsStore();
  const { seek } = useAudioControls();

  // Mobile queue toggle state
  const [showMobileQueue, setShowMobileQueue] = useState(false);

  // Swipe-to-minimize gesture state
  const [translateY, setTranslateY] = useState(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const handleMobileQueueToggle = () => {
    setShowMobileQueue(!showMobileQueue);
    setShowLyrics(false);
  };

  const handleMobileLyricsToggle = () => {
    const nextVal = !showLyrics;
    setShowLyrics(nextVal);
    setShowMobileQueue(false);
  };

  const isFav = currentTrack ? isFavorite(currentTrack.youtubeId) : false;

  const upcomingQueue = queue.filter(
    (t) => t.youtubeId !== currentTrack?.youtubeId && t.id !== currentTrack?.id
  );

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullPlayer) {
        setShowFullPlayer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullPlayer, setShowFullPlayer]);

  // Touch handlers for mobile swipe-to-minimize
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    // Only allow swipe down (diff > 0)
    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    isSwiping.current = false;
    if (translateY > 120) {
      setShowFullPlayer(false);
    }
    setTranslateY(0);
  };

  if (!currentTrack) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-0 md:p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        showFullPlayer
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      )}
      onClick={() => setShowFullPlayer(false)}
    >
      
      {/* DESKTOP FULL PLAYER (Centered Card overlay) */}
      <div
        className={cn(
          'hidden md:flex bg-zinc-950/95 border border-zinc-800/60 rounded-3xl shadow-2xl w-full max-w-5xl h-[80vh] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          showFullPlayer ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-12 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left pane: Artwork and main playback controls */}
        <div className="flex-1 flex flex-col justify-between p-8 relative">
          
          {/* Header row with minimize button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setShowFullPlayer(false)}
              title="Minimize"
            >
              <ChevronDown className="w-6 h-6" />
            </Button>
          </div>

          {/* Center Column: Artwork + Metadata + Buttons */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            
            {/* Album Cover Art */}
            <div className="relative w-72 h-72 rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 group">
              <Image
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                fill
                sizes="288px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Song Title and Artist */}
            <div className="text-center w-full max-w-md px-4">
              <h2 className="text-2xl font-black truncate text-white leading-tight">
                {currentTrack.title}
              </h2>
              <p className="text-zinc-400 hover:text-white truncate mt-1 text-sm font-medium">
                {currentTrack.channelId ? (
                  <Link href={`/artists/${currentTrack.channelId}`} onClick={() => setShowFullPlayer(false)}>
                    {currentTrack.channelName}
                  </Link>
                ) : (
                  currentTrack.channelName
                )}
              </p>
            </div>

            {/* Playback Button Group */}
            <div className="flex items-center gap-6 mt-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-10 w-10 text-zinc-400 hover:text-white rounded-full transition-all', shuffle && 'text-primary hover:text-primary')}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white rounded-full hover:bg-white/5 active:scale-95 transition-all"
                onClick={playPrevious}
                title="Previous"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-16 w-16 bg-white text-black hover:bg-zinc-200 hover:scale-105 active:scale-95 rounded-full flex items-center justify-center transition-all shadow-lg"
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current text-black" />
                ) : (
                  <Play className="w-7 h-7 fill-current text-black ml-1" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white rounded-full hover:bg-white/5 active:scale-95 transition-all"
                onClick={playNext}
                title="Next"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-10 w-10 text-zinc-400 hover:text-white rounded-full transition-all', repeat !== 'none' && 'text-primary hover:text-primary')}
                onClick={cycleRepeat}
                title="Repeat"
              >
                {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </Button>
            </div>

          </div>

          {/* Bottom Pane: Seek slider + Volume */}
          <div className="w-full max-w-lg mx-auto flex flex-col gap-5 mt-auto">
            {/* Seek Bar */}
            <div className="w-full">
              <Slider
                value={[playbackPosition]}
                min={0}
                max={duration || 100}
                step={1}
                onValueChange={(v) => seek(Array.isArray(v) ? v[0] : v)}
                className="mb-1"
              />
              <div className="flex justify-between text-xs text-zinc-400 font-medium tabular-nums px-1">
                <span>{formatDuration(playbackPosition)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 w-3/5 mx-auto justify-center">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                className="flex-1"
                onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)}
              />
            </div>
          </div>

        </div>

        {/* Right pane: Queue list or Lyrics */}
        <div className="w-96 border-l border-zinc-900 bg-zinc-950/80 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-900 flex-shrink-0">
            <div className="flex items-center gap-4 select-none">
              <button
                onClick={() => setShowLyrics(false)}
                className={cn(
                  'font-bold text-sm transition-colors relative py-1',
                  !showLyrics ? 'text-white' : 'text-zinc-500 hover:text-white'
                )}
              >
                Next Up ({upcomingQueue.length})
                {!showLyrics && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setShowLyrics(true)}
                className={cn(
                  'font-bold text-sm transition-colors relative py-1',
                  showLyrics ? 'text-white' : 'text-zinc-500 hover:text-white'
                )}
              >
                Lyrics
                {showLyrics && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>
            {!showLyrics && upcomingQueue.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-zinc-400 hover:text-red-400 hover:bg-transparent"
                onClick={clearQueue}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
          {showLyrics ? (
            <LyricsView className="flex-1" />
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-1">
                {upcomingQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500">
                    <ListMusic className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">Queue is empty</p>
                  </div>
                ) : (
                  upcomingQueue.map((t, i) => (
                    <TrackItem key={`${t.youtubeId}-${i}`} track={t} index={i + 1} showIndex />
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

      </div>

      {/* MOBILE FULLSCREEN PLAYER */}
      <div
        className={cn(
          'md:hidden fixed inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black flex flex-col justify-between p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] z-[60] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          showFullPlayer ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          transform: translateY > 0 && showFullPlayer ? `translateY(${translateY}px)` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-zinc-400 hover:text-white rounded-full"
            onClick={() => setShowFullPlayer(false)}
            title="Minimize"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 select-none">
            {showLyrics ? 'Lyrics' : showMobileQueue ? 'Play Queue' : 'Now Playing'}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-10 w-10 rounded-full transition-colors', showLyrics ? 'text-primary' : 'text-zinc-400')}
              onClick={handleMobileLyricsToggle}
              title="Toggle Lyrics"
            >
              <Mic2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-10 w-10 rounded-full transition-colors', showMobileQueue ? 'text-primary' : 'text-zinc-400')}
              onClick={handleMobileQueueToggle}
              title="Toggle Queue"
            >
              <ListMusic className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Dynamic Mobile Center Panel */}
        {showLyrics ? (
          // Mobile Lyrics View
          <div className="flex-1 flex flex-col h-0 my-4 bg-black/20 rounded-2xl border border-zinc-900 overflow-hidden">
            <LyricsView className="flex-1" />
          </div>
        ) : showMobileQueue ? (
          // Mobile Queue View
          <div className="flex-1 flex flex-col h-0 my-4 bg-black/20 rounded-2xl border border-zinc-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 flex-shrink-0">
              <h3 className="text-sm font-bold text-white">Next Up ({upcomingQueue.length})</h3>
              {upcomingQueue.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-zinc-400 hover:text-red-400"
                  onClick={clearQueue}
                >
                  Clear Queue
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 space-y-1">
                {upcomingQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 text-xs">
                    <ListMusic className="w-10 h-10 mb-2 opacity-20" />
                    <p>Queue is empty</p>
                  </div>
                ) : (
                  upcomingQueue.map((t, i) => (
                    <TrackItem key={`${t.youtubeId}-${i}`} track={t} index={i + 1} showIndex />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // Mobile Playing Art + Metadata
          <div className="flex-1 flex flex-col justify-center gap-6 my-4 select-none">
            <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden shadow-2xl bg-zinc-900">
              <Image
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                fill
                sizes="280px"
                className="object-cover"
                unoptimized
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between w-full max-w-[280px] mx-auto px-1 mt-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black truncate text-white leading-tight">
                  {currentTrack.title}
                </h2>
                <p className="text-xs text-zinc-400 truncate mt-1">
                  {currentTrack.channelName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 text-zinc-400 hover:text-white rounded-full flex-shrink-0 transition-all hover:scale-110 active:scale-90',
                  isFav && 'text-primary'
                )}
                onClick={() => toggleFavorite(currentTrack)}
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={cn('w-5 h-5 transition-all duration-200', isFav && 'fill-primary text-primary')} />
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Seek controls */}
        <div className="w-full max-w-[280px] mx-auto mb-2 flex-shrink-0">
          <Slider
            value={[playbackPosition]}
            min={0}
            max={duration || 100}
            step={1}
            onValueChange={(v) => seek(Array.isArray(v) ? v[0] : v)}
            className="mb-1"
          />
          <div className="flex justify-between text-[10px] font-semibold text-zinc-400 tabular-nums px-0.5">
            <span>{formatDuration(playbackPosition)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Mobile controls row */}
        <div className="flex items-center justify-between w-full max-w-[300px] mx-auto mb-6 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-12 w-12 text-zinc-400 rounded-full', shuffle && 'text-primary')}
            onClick={toggleShuffle}
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 text-white rounded-full active:scale-95 transition-transform"
            onClick={playPrevious}
            title="Previous"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 bg-white text-black hover:bg-zinc-200 active:scale-90 rounded-full flex items-center justify-center transition-all shadow-lg"
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current text-black" />
            ) : (
              <Play className="w-7 h-7 fill-current text-black ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 text-white rounded-full active:scale-95 transition-transform"
            onClick={playNext}
            title="Next"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-12 w-12 text-zinc-400 rounded-full', repeat !== 'none' && 'text-primary')}
            onClick={cycleRepeat}
            title="Repeat"
          >
            {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </Button>
        </div>

      </div>

    </div>
  );
}
