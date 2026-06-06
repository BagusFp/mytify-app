'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Loader2, Music2, X, Disc, Users } from 'lucide-react';
import { SearchResult, Track, Artist, Album } from '@/types';
import { TrackItem } from '@/components/track/TrackItem';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchTab = 'all' | 'songs' | 'artists' | 'albums';

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Music2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No results for &ldquo;{query}&rdquo;</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Try different keywords or check if your YouTube API key is configured.
      </p>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [songs, setSongs] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSongs([]);
      setArtists([]);
      setAlbums([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Search failed');
      }
      const data = await res.json();
      
      const tracks: Track[] = (data.songs || []).map((item: SearchResult) => ({
        id: item.youtubeId,
        youtubeId: item.youtubeId,
        title: item.title,
        thumbnail: item.thumbnail,
        duration: item.duration,
        channelName: item.channelName,
        channelId: item.channelId,
      }));

      setSongs(tracks);
      setArtists(data.artists || []);
      setAlbums(data.albums || []);
      setHasSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleSuggestionClick = (s: string) => {
    setQuery(s);
  };

  const suggestions = [
    'lofi hip hop', 'jazz classics', 'pop hits 2024',
    'workout music', 'ambient chill', 'indie rock',
  ];

  const hasAnyResults = songs.length > 0 || artists.length > 0 || albums.length > 0;

  return (
    <div className="p-6 page-enter pb-24">
      {/* Header */}
      <h1 className="text-3xl font-black mb-6">Search</h1>

      {/* Search input */}
      <div className="relative mb-6 max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          id="search-input"
          type="text"
          placeholder="Search for songs, artists, albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 pr-10 h-12 text-base bg-secondary border-transparent focus:border-primary rounded-full"
          autoFocus
        />
        {query && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              setQuery('');
              setSongs([]);
              setArtists([]);
              setAlbums([]);
              setHasSearched(false);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      {hasSearched && !isLoading && hasAnyResults && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-border/40">
          {(['all', 'songs', 'artists', 'albums'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors flex-shrink-0',
                activeTab === tab
                  ? 'bg-primary text-black'
                  : 'bg-secondary text-muted-foreground hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Searching YouTube...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && hasSearched && !hasAnyResults && !error && (
        <EmptyState query={query} />
      )}

      {/* Search results rendering */}
      {!isLoading && hasSearched && hasAnyResults && (
        <div className="space-y-8">
          {/* SONGS SECTION */}
          {(activeTab === 'all' || activeTab === 'songs') && songs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black">Songs</h2>
                {activeTab === 'all' && (
                  <button onClick={() => setActiveTab('songs')} className="text-xs font-bold text-muted-foreground hover:text-white">
                    See all
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {(activeTab === 'all' ? songs.slice(0, 5) : songs).map((track, i) => (
                  <TrackItem
                    key={track.youtubeId}
                    track={track}
                    index={i + 1}
                    tracks={songs}
                    showIndex
                  />
                ))}
              </div>
            </div>
          )}

          {/* ARTISTS SECTION */}
          {(activeTab === 'all' || activeTab === 'artists') && artists.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black">Artists</h2>
                {activeTab === 'all' && (
                  <button onClick={() => setActiveTab('artists')} className="text-xs font-bold text-muted-foreground hover:text-white">
                    See all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {(activeTab === 'all' ? artists.slice(0, 6) : artists).map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artists/${artist.id}`}
                    className="group bg-secondary hover:bg-white/10 rounded-lg p-4 cursor-pointer transition-all duration-200 text-center"
                  >
                    <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-muted mb-3 shadow-lg">
                      {artist.thumbnail ? (
                        <Image
                          src={artist.thumbnail}
                          alt={artist.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/20">
                          <Users className="w-10 h-10 text-primary" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold truncate leading-tight group-hover:text-primary">
                      {artist.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">
                      Artist
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ALBUMS SECTION */}
          {(activeTab === 'all' || activeTab === 'albums') && albums.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black">Albums & Playlists</h2>
                {activeTab === 'all' && (
                  <button onClick={() => setActiveTab('albums')} className="text-xs font-bold text-muted-foreground hover:text-white">
                    See all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {(activeTab === 'all' ? albums.slice(0, 6) : albums).map((album) => (
                  <Link
                    key={album.id}
                    href={`/albums/${album.id}`}
                    className="group bg-secondary hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-all duration-200"
                  >
                    <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted mb-3 shadow-lg">
                      {album.thumbnail ? (
                        <Image
                          src={album.thumbnail}
                          alt={album.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/20">
                          <Disc className="w-10 h-10 text-primary" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold leading-tight truncate group-hover:text-primary">
                      {album.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      By {album.channelName}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial prompt suggestion grid */}
      {!hasSearched && !isLoading && query.length < 2 && (
        <div className="py-12">
          <h2 className="text-lg font-semibold mb-6 text-muted-foreground">Browse categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestions.map((s) => (
              <div
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="bg-gradient-to-br from-secondary to-secondary/50 hover:from-white/10 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-primary/20"
              >
                <p className="font-semibold text-sm">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
