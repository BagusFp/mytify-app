'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Music, AlertCircle } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useLyricsStore } from '@/stores/lyricsStore';
import { useAudioControls, getGlobalAudio } from '@/hooks/useAudioEngine';
import { cn } from '@/lib/utils';

interface LyricsViewProps {
  className?: string;
}

export function LyricsView({ className }: LyricsViewProps) {
  const { currentTrack } = usePlayerStore();
  const { currentLyrics, isLoading, fetchLyrics, showLyrics } = useLyricsStore();
  const { seek } = useAudioControls();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  const [activeIndex, setActiveIndex] = useState(-1);

  // Fetch lyrics when track changes and lyrics panel is open
  useEffect(() => {
    if (currentTrack && showLyrics) {
      fetchLyrics(currentTrack);
    }
  }, [currentTrack, showLyrics, fetchLyrics]);

  const synced = currentLyrics?.synced || null;
  const plain = currentLyrics?.plain || null;

  // Real-time synchronization using requestAnimationFrame directly from the global audio instance
  useEffect(() => {
    if (!synced || synced.length === 0) {
      setActiveIndex(-1);
      return;
    }

    let animationFrameId: number;

    const updateSync = () => {
      try {
        const audio = getGlobalAudio();
        const currentTime = audio.currentTime;

        let index = -1;
        for (let i = 0; i < synced.length; i++) {
          if (currentTime >= synced[i].time) {
            index = i;
          } else {
            break;
          }
        }
        
        setActiveIndex(index);
      } catch (err) {
        // Safe fallback for server-side or unmounted states
      }

      animationFrameId = requestAnimationFrame(updateSync);
    };

    animationFrameId = requestAnimationFrame(updateSync);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [synced]);

  // Smooth scroll container to keep active line centered
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = activeLineRef.current;

      const containerHeight = container.clientHeight;
      const elementTop = activeElement.offsetTop;
      const elementHeight = activeElement.clientHeight;

      // Center the active line
      const targetScrollTop = elementTop - containerHeight / 2 + elementHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 p-6">
        <Music className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm">No track currently playing</p>
      </div>
    );
  }

  return (
    <div className={cn('relative flex flex-col h-full overflow-hidden select-none', className)}>
      {/* Dynamic Blurred Album Art Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none select-none">
        <Image
          src={currentTrack.thumbnail}
          alt=""
          fill
          className="object-cover scale-150 blur-3xl opacity-35 saturate-150"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/90 to-zinc-950" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-400 font-semibold">Loading lyrics...</span>
          </div>
        ) : !currentLyrics?.plain && !currentLyrics?.synced ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="w-10 h-10 text-zinc-600 mb-3" />
            <p className="text-base font-bold text-white mb-1">Lyrics not available</p>
            <p className="text-xs text-zinc-500 max-w-xs">Lyrics not available for this track.</p>
          </div>
        ) : synced && synced.length > 0 ? (
          /* SYNCHRONIZED LYRICS */
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6 py-20 space-y-6 scrollbar-none scroll-smooth"
          >
            {synced.map((line, i) => {
              const isActive = i === activeIndex;
              const isPast = i < activeIndex;

              return (
                <button
                  key={i}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(line.time)}
                  className={cn(
                    'w-full text-left transition-all duration-300 ease-out py-1 outline-none focus:outline-none block hover:text-white',
                    isActive
                      ? 'text-2xl font-black text-white scale-[1.02] origin-left drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]'
                      : isPast
                      ? 'text-lg font-bold text-white/40'
                      : 'text-lg font-bold text-white/20'
                  )}
                >
                  {line.text || '•••'}
                </button>
              );
            })}
          </div>
        ) : (
          /* FALLBACK PLAIN LYRICS */
          <div className="flex-1 overflow-y-auto px-6 py-12 scrollbar-none">
            <div className="space-y-4 max-w-md mx-auto text-center md:text-left">
              {plain?.map((line, i) => (
                <p
                  key={i}
                  className="text-base font-bold text-zinc-300/90 leading-relaxed hover:text-white transition-colors"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
