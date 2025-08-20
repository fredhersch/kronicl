'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Play } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Memory } from '@/lib/types';

export function MemoryCard({ memory }: { memory: Memory }) {
  const primaryMedia = memory.media?.[0];
  const hasAudio = !!memory.audioUrl;

  return (
    <Link href={`/memories/${memory.id}`}>
      <Card className="group overflow-hidden mobile-shadow hover:mobile-shadow-lg transition-all duration-300 border-0 bg-card">
        {/* Media Preview */}
        <div className="relative aspect-square overflow-hidden">
          {primaryMedia ? (
            <Image
              src={primaryMedia.url}
              alt={memory.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <div className="text-primary/40 text-4xl">📸</div>
            </div>
          )}
          
          {/* Audio Indicator */}
          {hasAudio && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full p-2">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          )}
          
          {/* Date Badge */}
          <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
            <div className="flex items-center gap-1 text-xs font-medium">
              <Calendar className="w-3 h-3" />
              {format(new Date(memory.date), 'MMM d')}
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {memory.title}
          </h3>
          
          {/* Summary */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {memory.summary}
          </p>
          
          {/* Location */}
          {memory.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{memory.location}</span>
            </div>
          )}
          
          {/* Tags */}
          {memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {memory.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20"
                >
                  {tag}
                </Badge>
              ))}
              {memory.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{memory.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
