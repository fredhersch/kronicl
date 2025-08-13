import { MemoryDetail } from '@/components/memories/memory-detail';
import { memories } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MemoryDetailPage({ params }: { params: { id: string } }) {
  const memory = memories.find((m) => m.id === params.id);

  if (!memory) {
    notFound();
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
