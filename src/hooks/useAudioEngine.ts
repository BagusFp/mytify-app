'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useHistoryStore } from '@/stores/historyStore';
import { Track } from '@/types';

let globalAudio: YouTubeAudioWrapper | null = null;
let ytPlayer: YouTubePlayer | null = null;
let ytPlayerReadyCallbacks: (() => void)[] = [];
let isYtApiLoaded = false;
let pollingInterval: ReturnType<typeof setInterval> | null = null;

type EventCallback = () => void;

interface YouTubePlayer {
  setVolume: (vol: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

class YouTubeAudioWrapper {
  private _currentTime: number = 0;
  private _duration: number = 0;
  private _volume: number = 0.8;
  private _isMuted: boolean = false;
  private _paused: boolean = true;
  private _src: string = '';
  private listeners: { [event: string]: EventCallback[] } = {};

  constructor() {
    this.initializeYoutubePlayer();
  }

  private initializeYoutubePlayer() {
    if (typeof window === 'undefined') return;

    if (!document.body) {
      setTimeout(() => this.initializeYoutubePlayer(), 50);
      return;
    }

    // Create container element if it doesn't exist
    let container = document.getElementById('youtube-player-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'youtube-player-container';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-9999';
      
      const inner = document.createElement('div');
      inner.id = 'youtube-player';
      container.appendChild(inner);
      document.body.appendChild(container);
    }

    if (isYtApiLoaded) return;
    isYtApiLoaded = true;

    // Load the script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Bind global callback
    (window as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      const YT = (window as { YT?: { Player: new (id: string, opts: object) => YouTubePlayer } }).YT;
      if (!YT) return;
      ytPlayer = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          autoplay: 0,
        },
        events: {
          onReady: () => {
            // Apply volume
            try {
              ytPlayer?.setVolume(this._volume * 100);
              if (this._isMuted) {
                ytPlayer?.mute();
              } else {
                ytPlayer?.unMute();
              }
            } catch { /* ignore */ }

            // Run queue
            const callbacks = [...ytPlayerReadyCallbacks];
            ytPlayerReadyCallbacks = [];
            callbacks.forEach((cb) => cb());
          },
          onStateChange: (event: { data: number }) => {
            this.handleStateChange(event.data);
          },
          onError: (event: { data: number }) => {
            this.handleError(event.data);
          },
        },
      });
    };
  }

  private handleStateChange(state: number) {
    // YT.PlayerState:
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    switch (state) {
      case 1: // playing
        this._paused = false;
        this.dispatchEvent('playing');
        this.dispatchEvent('canplay');
        this.startPolling();
        break;
      case 2: // paused
        this._paused = true;
        this.dispatchEvent('pause');
        this.stopPolling();
        break;
      case 3: // buffering
        this.dispatchEvent('waiting');
        break;
      case 0: // ended
        this._paused = true;
        this.dispatchEvent('ended');
        this.stopPolling();
        break;
      case 5: // cued
        this.dispatchEvent('canplay');
        break;
    }
  }

  private handleError(code: number) {
    console.error('YouTube Player Error Code:', code);
    this.dispatchEvent('error');
  }

  private startPolling() {
    this.stopPolling();
    pollingInterval = setInterval(() => {
      this.dispatchEvent('timeupdate');
      this.dispatchEvent('durationchange');
    }, 500);
  }

  private stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  // Getters/setters
  get currentTime(): number {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
      try {
        this._currentTime = ytPlayer.getCurrentTime() || 0;
      } catch { /* ignore */ }
    }
    return this._currentTime;
  }

  set currentTime(val: number) {
    this._currentTime = val;
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
      try {
        ytPlayer.seekTo(val, true);
      } catch { /* ignore */ }
    }
  }

  get duration(): number {
    if (ytPlayer && typeof ytPlayer.getDuration === 'function') {
      try {
        this._duration = ytPlayer.getDuration() || 0;
      } catch { /* ignore */ }
    }
    return this._duration;
  }

  get volume(): number {
    return this._volume;
  }

  set volume(val: number) {
    this._volume = val;
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      try {
        ytPlayer.setVolume(val * 100);
      } catch { /* ignore */ }
    }
  }

  get paused(): boolean {
    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
      try {
        const state = ytPlayer.getPlayerState();
        this._paused = state !== 1;
      } catch { /* ignore */ }
    }
    return this._paused;
  }

  get src(): string {
    return this._src;
  }

  set src(val: string) {
    this._src = val;
    if (val) {
      if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
        try {
          ytPlayer.loadVideoById(val);
        } catch { /* ignore */ }
      } else {
        ytPlayerReadyCallbacks.push(() => {
          if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
            ytPlayer.loadVideoById(val);
          }
        });
      }
    }
  }

  load() {
    // Noop
  }

  async play(): Promise<void> {
    this._paused = false;
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      try {
        ytPlayer.playVideo();
      } catch { /* ignore */ }
    } else {
      ytPlayerReadyCallbacks.push(() => {
        if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
          ytPlayer.playVideo();
        }
      });
    }
  }

  pause() {
    this._paused = true;
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      try {
        ytPlayer.pauseVideo();
      } catch { /* ignore */ }
    }
  }

  addEventListener(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  dispatchEvent(event: string) {
    const list = this.listeners[event];
    if (list) {
      list.forEach((cb) => cb());
    }
  }
}

export function getGlobalAudio(): YouTubeAudioWrapper | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudio) {
    globalAudio = new YouTubeAudioWrapper();
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

  const { addToHistory } = useHistoryStore();
  const currentTrackRef = useRef<Track | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const shouldPlayRef = useRef(false);

  const safePlay = useCallback(() => {
    const audio = getGlobalAudio();
    if (!audio) return;
    shouldPlayRef.current = true;
    const promise = audio.play();
    playPromiseRef.current = promise;
    promise.catch((e: Error) => {
      if (e?.name !== 'AbortError') {
        console.error('Audio play error:', e);
        setIsPlaying(false);
      }
    });
  }, [setIsPlaying]);

  const safePause = useCallback(() => {
    const audio = getGlobalAudio();
    if (!audio) return;
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

  // When current track changes, set streamUrl to the video ID directly
  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrackRef.current?.youtubeId === currentTrack.youtubeId) return;
    currentTrackRef.current = currentTrack;
    setStreamUrl(currentTrack.youtubeId);
  }, [currentTrack, setStreamUrl]);

  // When stream URL is set, load and play
  useEffect(() => {
    if (!streamUrl || !currentTrack) return;
    const audio = getGlobalAudio();
    if (!audio) return;
    
    // If the video source is already set to this stream (e.g. loaded synchronously in media session handler), don't reload it
    if (audio.src === streamUrl) {
      addToHistory(currentTrack);
      return;
    }

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
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Audio event listeners
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio) return;

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
      if (currentTrackRef.current) {
        setTimeout(() => {
          if (currentTrackRef.current) {
            setStreamUrl(currentTrackRef.current.youtubeId);
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
  }, [repeat, setPlaybackPosition, setDuration, setIsLoading, setError, setIsPlaying, playNext, setStreamUrl, safePlay]);

  // Media Session API — metadata + action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channelName,
      artwork: [
        { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    // Drive the actual YT player, then sync zustand state
    navigator.mediaSession.setActionHandler('play', () => {
      const audio = getGlobalAudio();
      if (audio) audio.play().catch(() => {});
      setIsPlaying(true);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      const audio = getGlobalAudio();
      if (audio) audio.pause();
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const { queue, playNext } = usePlayerStore.getState();
      if (queue.length > 0) {
        const nextTrack = queue[0];
        const audio = getGlobalAudio();
        if (audio) {
          audio.src = nextTrack.youtubeId;
          audio.play().catch(() => {});
        }
      }
      playNext();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const { historyQueue, playPrevious } = usePlayerStore.getState();
      if (historyQueue.length > 0) {
        const prevTrack = historyQueue[0];
        const audio = getGlobalAudio();
        if (audio) {
          audio.src = prevTrack.youtubeId;
          audio.play().catch(() => {});
        }
      }
      playPrevious();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        const audio = getGlobalAudio();
        if (audio) {
          audio.currentTime = details.seekTime;
          usePlayerStore.getState().setPlaybackPosition(details.seekTime);
        }
      }
    });
  }, [currentTrack, setIsPlaying]);

  // Sync Media Session playbackState
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Media Session — keep position state in sync with playback
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const audio = getGlobalAudio();
    if (!audio) return;

    const updatePositionState = () => {
      try {
        const dur = audio.duration;
        const pos = audio.currentTime;
        if (dur > 0 && isFinite(dur) && isFinite(pos)) {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: 1,
            position: Math.min(pos, dur),
          });
        }
      } catch { /* ignore — not all browsers support setPositionState */ }
    };

    audio.addEventListener('timeupdate', updatePositionState);
    audio.addEventListener('durationchange', updatePositionState);
    return () => {
      audio.removeEventListener('timeupdate', updatePositionState);
      audio.removeEventListener('durationchange', updatePositionState);
    };
  }, [currentTrack]);

  // Background playback recovery — visibilitychange
  // The YouTube IFrame API is throttled by Chromium when the page is hidden
  // (JS timers are deprioritised and the iframe renderer is suspended).
  // We cannot fully prevent this without a native app, but we CAN resume
  // playback the moment the user returns to the tab/app.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const { isPlaying: playing } = usePlayerStore.getState();
        if (playing) {
          const audio = getGlobalAudio();
          if (audio) audio.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {};
}

export function useAudioControls() {
  const setPlaybackPosition = usePlayerStore((s) => s.setPlaybackPosition);

  // Seek function
  const seek = useCallback((seconds: number) => {
    const audio = getGlobalAudio();
    if (!audio) return;
    audio.currentTime = seconds;
    setPlaybackPosition(seconds);
  }, [setPlaybackPosition]);

  return { seek };
}
