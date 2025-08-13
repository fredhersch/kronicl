import Link from 'next/link';
import Image from 'next/image';
import type { Memory } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDays, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface MemoryCardProps {
  memory: Memory;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const firstImage = memory.media.find((m) => m.type === 'image');
  const placeholderImage = 'https://placehold.co/600x400.png';

  return (
    <Link href={`/memories/${memory.id}`} className="block group">
      <Card className="overflow-hidden h-full transition-all duration-300 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 bg-card">
        <CardContent className="p-0">
          <div className="relative w-full h-48">
            <Image
              src={firstImage?.url ?? placeholderImage}
              alt={memory.title}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={firstImage?.dataAiHint}
            />
          </div>
          <CardHeader>
            <CardTitle className="font-headline text-lg line-clamp-2">{memory.title}</CardTitle>
            <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                <time dateTime={memory.date}>
                  {format(new Date(memory.date), 'MMM d, yyyy')}
                </time>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{memory.location}</span>
              </div>
            </div>
          </CardHeader>
        </CardContent>
      </Card>
    </Link>
  );
}
