'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Heart, TrendingUp, Sparkles, Search, ChevronRight, Play } from 'lucide-react';
import { Track } from '@/types';
import { TrackCard } from '@/components/track/TrackCard';
import { usePlayerStore } from '@/stores/playerStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useHistoryStore } from '@/stores/historyStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HomeData {
  recentlyPlayed: Track[];
  favorites: Track[];
  trending: Track[];
  recommended: Track[];
  newReleases: Track[];
}

function SectionHeader({ title, icon: Icon, href }: { title: string; icon: React.ElementType; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4 select-none">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function TrackGrid({ tracks }: { tracks: Track[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {tracks.map((track) => (
        <TrackCard key={track.youtubeId} track={track} tracks={tracks} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-800/40 p-3">
      <div className="skeleton w-full aspect-square rounded-md mb-3" />
      <div className="skeleton h-3 rounded w-3/4 mb-2" />
      <div className="skeleton h-3 rounded w-1/2" />
    </div>
  );
}

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

function SkeletonMobileList() {
  return (
    <div className="space-y-2 px-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2 bg-zinc-900/40 border border-zinc-900/60 rounded-lg h-16 animate-pulse">
          <div className="w-12 h-12 bg-zinc-800 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-3/4" />
            <div className="h-2.5 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonHorizontalScroll() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar px-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 w-36 bg-zinc-900/40 border border-zinc-800/40 p-2.5 rounded-lg animate-pulse">
          <div className="w-full aspect-square bg-zinc-800 rounded-md mb-2.5" />
          <div className="h-3 bg-zinc-800 rounded w-3/4 mb-1.5" />
          <div className="h-2.5 bg-zinc-800 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack } = usePlayerStore();
  const { favorites: localFavorites } = useFavoritesStore();
  const { history: localHistory } = useHistoryStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Derive local data
  const recentlyPlayed: Track[] = localHistory.slice(0, 6).map((e) => e.track);
  const favoriteTracks: Track[] = localFavorites.slice(0, 6).map((f) => f.track);

  useEffect(() => {
    async function loadHome() {
      try {
        const res = await fetch('/api/home');
        const homeData = await res.json();
        setData(homeData);
      } catch {
        setData({ recentlyPlayed: [], favorites: [], trending: [], recommended: [], newReleases: [] });
      } finally {
        setIsLoading(false);
      }
    }
    loadHome();
  }, []);

  return (
    <div className="page-enter pb-16">
      
      {/* DESKTOP EXPERIENCE */}
      <div className="hidden md:block p-8 space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-[44px] lg:text-[48px] font-extrabold tracking-tight text-white leading-tight">{greeting} 👋</h1>
          <p className="text-zinc-400 mt-1.5 text-sm font-normal">Welcome back. Continue listening where you left off.</p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Search music', href: '/search', icon: Search, color: 'from-emerald-600 to-teal-800' },
            { label: 'Favorites', href: '/favorites', icon: Heart, color: 'from-pink-600 to-rose-800' },
            { label: 'History', href: '/history', icon: Clock, color: 'from-orange-600 to-orange-800' },
            { label: 'Library', href: '/library', icon: Sparkles, color: 'from-purple-600 to-indigo-800' },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br text-white font-bold shadow-md',
                'hover:brightness-110 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]',
                color
              )}
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm tracking-wide">{label}</span>
            </Link>
          ))}
        </div>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <section>
            <SectionHeader title="Recently Played" icon={Clock} href="/history" />
            <TrackGrid tracks={recentlyPlayed} />
          </section>
        )}

        {/* Favorites */}
        {favoriteTracks.length > 0 && (
          <section>
            <SectionHeader title="Your Favorites" icon={Heart} href="/favorites" />
            <TrackGrid tracks={favoriteTracks} />
          </section>
        )}

        {/* Trending */}
        <section>
          <SectionHeader title="Trending Music" icon={TrendingUp} />
          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : data?.trending && data.trending.length > 0 ? (
            <TrackGrid tracks={data.trending} />
          ) : (
            <div className="text-center py-12 text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-900">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Search and play music to generate recommendations.</p>
              <Link href="/search" className="inline-block mt-4">
                <Button variant="outline" size="sm">Search Music</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Recommended */}
        {data?.recommended && data.recommended.length > 0 && (
          <section>
            <SectionHeader title="Recommended for You" icon={Sparkles} />
            <TrackGrid tracks={data.recommended} />
          </section>
        )}

        {/* New Releases */}
        {data?.newReleases && data.newReleases.length > 0 && (
          <section>
            <SectionHeader title="New Releases" icon={Sparkles} />
            <TrackGrid tracks={data.newReleases} />
          </section>
        )}
      </div>

      {/* MOBILE EXPERIENCE */}
      <div className="block md:hidden p-4 space-y-8">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-white leading-tight">{greeting} 👋</h1>
        </div>

        {/* Compact Quick Actions list */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Search music', href: '/search', icon: Search, color: 'bg-zinc-900/60 border border-zinc-800/40' },
            { label: 'Favorites', href: '/favorites', icon: Heart, color: 'bg-zinc-900/60 border border-zinc-800/40' },
            { label: 'History', href: '/history', icon: Clock, color: 'bg-zinc-900/60 border border-zinc-800/40' },
            { label: 'Library', href: '/library', icon: Sparkles, color: 'bg-zinc-900/60 border border-zinc-800/40' },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl text-zinc-100 font-bold h-14 active:scale-95 transition-transform shadow-sm',
                color
              )}
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>

        {/* Recently Played (Compact List) */}
        {recentlyPlayed.length > 0 && (
          <section className="px-1">
            <SectionHeader title="Recently Played" icon={Clock} href="/history" />
            <div className="space-y-2">
              {recentlyPlayed.slice(0, 4).map((track) => (
                <div
                  key={track.youtubeId}
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-3 p-2 bg-zinc-900/40 active:bg-zinc-900 rounded-lg cursor-pointer h-16 transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-zinc-800">
                    <Image src={track.thumbnail} alt={track.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-white leading-tight">{track.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate mt-1">{track.channelName}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0 active:scale-90 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Favorites (Horizontal Scrollable) */}
        {favoriteTracks.length > 0 && (
          <section>
            <div className="px-1">
              <SectionHeader title="Your Favorites" icon={Heart} href="/favorites" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x no-scrollbar px-1">
              {favoriteTracks.map((track) => (
                <div key={track.youtubeId} className="snap-start flex-shrink-0 w-36">
                  <TrackCard track={track} tracks={favoriteTracks} className="bg-zinc-900/60 border border-zinc-800/40 p-2" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending (Horizontal Scrollable) */}
        {(isLoading || (data?.trending && data.trending.length > 0)) && (
          <section>
            <div className="px-1">
              <SectionHeader title="Trending Music" icon={TrendingUp} />
            </div>
            {isLoading ? (
              <SkeletonHorizontalScroll />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x no-scrollbar px-1">
                {data!.trending.map((track) => (
                  <div key={track.youtubeId} className="snap-start flex-shrink-0 w-36">
                    <TrackCard track={track} tracks={data!.trending} className="bg-zinc-900/60 border border-zinc-800/40 p-2" />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Recommended (Horizontal Scrollable) */}
        {data?.recommended && data.recommended.length > 0 && (
          <section>
            <div className="px-1">
              <SectionHeader title="Recommended for You" icon={Sparkles} />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x no-scrollbar px-1">
              {data.recommended.map((track) => (
                <div key={track.youtubeId} className="snap-start flex-shrink-0 w-36">
                  <TrackCard track={track} tracks={data.recommended} className="bg-zinc-900/60 border border-zinc-800/40 p-2" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
