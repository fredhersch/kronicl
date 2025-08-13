'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Header } from '@/components/header';
import { MemoryList } from '@/components/memories/memory-list';
import type { Memory } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDataLoading(true);
      const q = query(collection(db, 'memories'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userMemories = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date.toDate().toISOString(),
          } as Memory;
        });
        setMemories(userMemories);
        setFilteredMemories(userMemories);
        setDataLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSearch = (query: string) => {
    const lowerCaseQuery = query.toLowerCase();
    if (!lowerCaseQuery) {
      setFilteredMemories(memories);
      return;
    }
    const results = memories.filter(
      (memory) =>
        memory.title.toLowerCase().includes(lowerCaseQuery) ||
        memory.summary.toLowerCase().includes(lowerCaseQuery) ||
        (memory.transcription && memory.transcription.toLowerCase().includes(lowerCaseQuery)) ||
        memory.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredMemories(results);
  };
  
  if (loading || !user || dataLoading) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
          <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <MemoryList memories={filteredMemories} />
      </main>
    </div>
  );
}
