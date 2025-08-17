'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Memory } from '@/lib/types';
import { MemoryDetail } from '@/components/memories/memory-detail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function MemoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

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
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-body">
        <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-48 ml-4" />
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
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="ml-4 text-xl font-headline truncate">{memory.title}</h1>
      </header>
      <main className="p-4 sm:p-6 md:p-8">
        <MemoryDetail memory={memory} />
      </main>
    </div>
  );
}
