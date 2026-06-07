'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListMusic, Plus, Trash2, Pencil, ChevronRight } from 'lucide-react';
import { useLibraryStore, LocalPlaylist } from '@/stores/libraryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

function PlaylistCard({ playlist, onDelete, onRename }: {
  playlist: LocalPlaylist;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playlist.name);
  const trackCount = playlist.tracks?.length ?? 0;

  const handleRename = () => {
    if (name.trim() && name.trim() !== playlist.name) {
      onRename(playlist.id, name.trim());
      toast.success('Playlist renamed');
    }
    setIsEditing(false);
  };

  return (
    <div className="group flex items-center gap-4 p-4 bg-secondary hover:bg-white/10 rounded-lg transition-colors">
      <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center">
        <ListMusic className="w-7 h-7 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setName(playlist.name); setIsEditing(false); }
            }}
            className="h-7 text-sm font-semibold bg-background"
            autoFocus
          />
        ) : (
          <p className="font-semibold truncate">{playlist.name}</p>
        )}
        <p className="text-sm text-muted-foreground mt-0.5">
          {trackCount} {trackCount === 1 ? 'song' : 'songs'}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => {
            onDelete(playlist.id);
            toast.success('Playlist deleted');
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Link href={`/playlists/${playlist.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { playlists, fetchPlaylists, createPlaylist, deletePlaylist, renamePlaylist, isLoading } = useLibraryStore();
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist(newName.trim());
    setNewName('');
    setOpen(false);
    toast.success('Playlist created!');
  };

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6 select-none">
        <h1 className="text-3xl font-black">Playlists ({playlists.length})</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button className="btn-green gap-2">
              <Plus className="w-4 h-4" /> New Playlist
            </Button>
          } />
          <DialogContent className="bg-popover border-border">
            <DialogHeader>
              <DialogTitle>Create playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                id="playlist-name-input"
                placeholder="My Playlist"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="btn-green" onClick={handleCreate} disabled={!newName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center select-none">
          <ListMusic className="w-16 h-16 text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Your library is empty</h3>
          <p className="text-zinc-500 max-w-xs mb-6 text-sm">Create playlists or explore tracks to add to your library.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Explore Music
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <PlaylistCard
              key={pl.id}
              playlist={pl}
              onDelete={deletePlaylist}
              onRename={renamePlaylist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
