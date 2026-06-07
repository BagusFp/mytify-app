'use client';

import { Clock } from 'lucide-react';
import Link from 'next/link';
import { Track } from '@/types';
import { TrackItem } from '@/components/track/TrackItem';
import { useHistoryStore } from '@/stores/historyStore';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function HistoryPage() {
  const { history } = useHistoryStore();
  const tracks: Track[] = history.map((e) => e.track);

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center gap-3 mb-6 select-none">
        <Clock className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-black">History ({history.length})</h1>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center select-none">
          <Clock className="w-16 h-16 text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No listening history yet</h3>
          <p className="text-zinc-500 max-w-xs mb-6 text-sm">
            Explore our library and start playing your favorite tracks.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Discover Music
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {history.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2">
              <div className="flex-1">
                <TrackItem track={entry.track} tracks={tracks} />
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">
                {formatDate(entry.playedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
