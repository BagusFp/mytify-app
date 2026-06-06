'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, History, Heart, ListMusic, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLibraryStore } from '@/stores/libraryStore';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/history', label: 'History', icon: History },
];

// Desktop sidebar (width updated to 260px, playlists section added)
export function Sidebar() {
  const pathname = usePathname();
  const { playlists, fetchPlaylists, createPlaylist } = useLibraryStore();

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreatePlaylist = async () => {
    const name = prompt('Enter playlist name:');
    if (name?.trim()) {
      await createPlaylist(name.trim());
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-zinc-950 min-h-screen flex-shrink-0 border-r border-zinc-900 select-none">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <ListMusic className="w-4 h-4 text-black" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">Mytify</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href} className="relative">
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-md" />
                )}
                <Link
                  href={href}
                  className={cn(
                    'group flex items-center gap-4 pl-4 pr-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-zinc-900/80 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform duration-200 group-hover:scale-105',
                      isActive ? 'text-primary' : 'text-zinc-400 group-hover:text-white'
                    )}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Playlists section */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-zinc-900 mt-5 pt-5 px-3">
        <div className="flex items-center justify-between px-3 mb-3 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Playlists
          </span>
          <button
            onClick={handleCreatePlaylist}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900/60 transition-colors"
            title="Create Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {playlists.length === 0 ? (
            <span className="text-xs text-zinc-500 px-3 italic block py-2 select-none">
              No playlists yet
            </span>
          ) : (
            playlists.map((pl) => {
              const isPlActive = pathname === `/playlists/${pl.id}`;
              return (
                <div key={pl.id} className="relative">
                  {isPlActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-sm" />
                  )}
                  <Link
                    href={`/playlists/${pl.id}`}
                    className={cn(
                      'group flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg text-sm font-semibold truncate transition-all duration-200',
                      isPlActive
                        ? 'text-primary bg-zinc-900/80'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                    )}
                  >
                    <ListMusic className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate group-hover:translate-x-0.5 transition-transform duration-200">{pl.name}</span>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-[10px] text-zinc-600 border-t border-zinc-900 flex-shrink-0">
        <p>© 2026 Mytify</p>
        <p className="mt-1">For personal & educational use</p>
      </div>
    </aside>
  );
}

// Mobile bottom navigation
export function BottomNav() {
  const pathname = usePathname();

  const mobileItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/favorites', label: 'Favorites', icon: Heart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 player-safe-bottom">
      <div className="flex h-14 items-center justify-around">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-200',
                isActive ? 'text-primary scale-105' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-black tracking-tight">{label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-primary rounded-full transition-transform duration-300 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
