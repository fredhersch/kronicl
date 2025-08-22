'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Memory } from '@/lib/types';
import { MemoryDetail } from '@/components/memories/memory-detail';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Settings, LogOut, Home, User } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export default function MemoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const { db, user, signOut } = useAuth();

  useEffect(() => {
    if (!id || !db) return;

    const fetchMemory = async () => {
      setLoading(true);
      const docRef = doc(db, 'memories', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setMemory({
          id: docSnap.id,
          ...data,
          date: data.date.toDate().toISOString(),
        } as Memory);
      } else {
        notFound();
      }
      setLoading(false);
    };

    fetchMemory();
  }, [id, db]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-body">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-48 ml-4" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </header>
        <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-8">
          <Skeleton className="w-full aspect-video" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-8">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!memory) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
        <div className="flex items-center flex-1 min-w-0">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="ml-4 text-xl font-headline truncate">{memory.title}</h1>
        </div>
        
        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8 border-2 border-indigo-200">
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
                <AvatarFallback className="bg-indigo-600 text-white text-sm">
                  {user?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
                <AvatarFallback className="text-xs">
                  {user?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{user?.displayName || 'User'}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <Link href="/">
              <DropdownMenuItem>
                <Home className="mr-2 h-4 w-4" />
                <span>Home</span>
              </DropdownMenuItem>
            </Link>

            <Link href="/profile">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="p-4 sm:p-6 md:p-8">
        <MemoryDetail memory={memory} />
      </main>
    </div>
  );
}
