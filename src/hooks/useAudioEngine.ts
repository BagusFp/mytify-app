'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { Track } from '@/types';

/**
 * Global singleton audio instance — never recreated between renders or route changes.
 */
let globalAudio: HTMLAudioElement | null = null;

function getGlobalAudio(): HTMLAudioElement {
  if (typeof window === 'undefined') throw new Error('No window');
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'auto';
  }
  return globalAudio;
}

export function useAudioEngine() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    repeat,
    streamUrl,
    setIsPlaying,
    setPlaybackPosition,
    setDuration,
    setIsLoading,
    setError,
    setStreamUrl,
    playNext,
  } = usePlayerStore();

  const { addToHistory } = useLibraryStore();
  const isLoadingStreamRef = useRef(false);
  const currentTrackRef = useRef<Track | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const shouldPlayRef = useRef(false);

  const safePlay = useCallback(() => {
    const audio = getGlobalAudio();
    shouldPlayRef.current = true;
    const promise = audio.play();
    playPromiseRef.current = promise;
    promise.catch((e) => {
      if (e.name !== 'AbortError') {
        console.error('Audio play error:', e);
        setIsPlaying(false);
      }
    });
  }, [setIsPlaying]);

  const safePause = useCallback(() => {
    const audio = getGlobalAudio();
    shouldPlayRef.current = false;
    const promise = playPromiseRef.current;
    if (promise) {
      promise.then(() => {
        if (!shouldPlayRef.current) {
          audio.pause();
        }
      }).catch(() => {
        // Ignore play abort
      });
    } else {
      audio.pause();
    }
  }, []);

  // Fetch stream URL from backend
  const fetchStreamUrl = useCallback(async (videoId: string) => {
    if (isLoadingStreamRef.current) return;
    isLoadingStreamRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stream?videoId=${videoId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Stream fetch failed');
      }
      const { url } = await res.json();
      setStreamUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stream');
      setIsLoading(false);
    } finally {
      isLoadingStreamRef.current = false;
    }
  }, [setIsLoading, setError, setStreamUrl]);

  // When current track changes, fetch stream URL
  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrackRef.current?.youtubeId === currentTrack.youtubeId) return;
    currentTrackRef.current = currentTrack;
    fetchStreamUrl(currentTrack.youtubeId);
  }, [currentTrack, fetchStreamUrl]);

  // When stream URL is set, load and play
  useEffect(() => {
    if (!streamUrl || !currentTrack) return;
    const audio = getGlobalAudio();
    audio.src = streamUrl;
    audio.load();
    if (isPlaying) {
      safePlay();
    }
    // Save to history
    addToHistory(currentTrack);
  }, [streamUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause state
  useEffect(() => {
    if (!streamUrl) return;
    if (isPlaying) {
      safePlay();
    } else {
      safePause();
    }
  }, [isPlaying, streamUrl, safePlay, safePause]);

  // Sync volume
  useEffect(() => {
    const audio = getGlobalAudio();
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Audio event listeners
  useEffect(() => {
    const audio = getGlobalAudio();

    const handleTimeUpdate = () => setPlaybackPosition(audio.currentTime);
    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        safePlay();
      } else {
        playNext();
      }
    };
    const handleError = () => {
      setError('Playback error — retrying...');
      // Retry once
      if (currentTrackRef.current) {
        setTimeout(() => {
          if (currentTrackRef.current) {
            fetchStreamUrl(currentTrackRef.current.youtubeId);
          }
        }, 2000);
      }
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
    };
  }, [repeat, setPlaybackPosition, setDuration, setIsLoading, setError, setIsPlaying, playNext, fetchStreamUrl, safePlay]);

  // Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channelName,
      artwork: [
        { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
      ],
    });
    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    navigator.mediaSession.setActionHandler('previoustrack', () =>
      usePlayerStore.getState().playPrevious()
    );
  }, [currentTrack, setIsPlaying, playNext]);

  // Seek function
  const seek = useCallback((seconds: number) => {
    const audio = getGlobalAudio();
    audio.currentTime = seconds;
    setPlaybackPosition(seconds);
  }, [setPlaybackPosition]);

  return { seek };
}
