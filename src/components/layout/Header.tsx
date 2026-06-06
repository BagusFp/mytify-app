'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export function PageHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide header on home page
  if (pathname === '/') return null;

  let pageTitle = '';
  let linkName = '';

  if (pathname === '/favorites') {
    pageTitle = 'Favorites';
    linkName = 'Favorites';
  } else if (pathname === '/history') {
    pageTitle = 'History';
    linkName = 'History';
  } else if (pathname === '/library') {
    pageTitle = 'Library';
    linkName = 'Library';
  } else if (pathname === '/search') {
    pageTitle = 'Search';
    linkName = 'Search';
  } else if (pathname.startsWith('/playlists/')) {
    pageTitle = 'Playlist';
    linkName = 'Playlist';
  } else if (pathname.startsWith('/albums/')) {
    pageTitle = 'Album';
    linkName = 'Album';
  } else if (pathname.startsWith('/artists/')) {
    pageTitle = 'Artist';
    linkName = 'Artist';
  } else {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      linkName = segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
      pageTitle = linkName;
    }
  }

  if (!pageTitle) return null;

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/40 px-6 py-4 flex items-center justify-between select-none">
      {/* Desktop Breadcrumbs */}
      <div className="hidden md:flex items-center gap-1.5 text-sm font-semibold">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-white font-bold">{linkName}</span>
      </div>

      {/* Mobile Sticky Top Header */}
      <div className="flex md:hidden items-center gap-3">
        <button
          onClick={handleBack}
          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-white">{pageTitle}</h1>
      </div>
    </header>
  );
}
