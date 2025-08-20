import type { Memory } from '@/lib/types';
import { MemoryCard } from './memory-card';

interface MemoryListProps {
  memories: Memory[];
}

export function MemoryList({ memories }: MemoryListProps) {
  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <h2 className="text-2xl font-semibold font-headline">No Memories Found</h2>
        <p className="text-muted-foreground">Try adjusting your search or create a new memory!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}
