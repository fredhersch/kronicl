'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Calendar, MapPin, Play, MoreVertical, Archive } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Memory } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function MemoryCard({ memory }: { memory: Memory }) {
  const primaryMedia = memory.media?.[0];
  const hasAudio = !!memory.audioUrl;
  const isMobile = useIsMobile();
  const [isArchiving, setIsArchiving] = useState(false);
  const { toast } = useToast();

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to memory detail
    e.stopPropagation();
    
    if (isArchiving) return;
    
    setIsArchiving(true);
    
    try {
      // Import Firebase functions dynamically to avoid SSR issues
      const { doc, updateDoc } = await import('firebase/firestore');
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase-client');
      
      const db = getFirestore(app);
      const memoryRef = doc(db, 'memories', memory.id);
      
      // Archive the memory directly using client-side Firebase
      await updateDoc(memoryRef, {
        archived: true,
        archivedAt: new Date().toISOString(),
      });

      toast({
        title: 'Memory Archived',
        description: 'The memory has been archived and removed from your main view.',
      });
    } catch (error) {
      console.error('Error archiving memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive memory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Link href={`/memories/${memory.id}`}>
      <Card className="group overflow-hidden mobile-shadow hover:mobile-shadow-lg transition-all duration-300 border-0 bg-card memory-tile-mobile">
        {/* Media Preview */}
        <div className="relative aspect-video overflow-hidden">
          {/* Archive Menu */}
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="text-orange-600 focus:text-orange-600"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {isArchiving ? 'Archiving...' : 'Archive'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {primaryMedia ? (
            <Image
              src={primaryMedia.url}
              alt={memory.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : hasAudio ? (
            // Audio-only memory - show audio icon
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex flex-col items-center justify-center">
              <div className="text-primary/60 text-4xl sm:text-5xl mb-2">🎤</div>
              <div className="text-primary/40 text-xs sm:text-sm text-center px-2">
                Audio Memory
              </div>
            </div>
          ) : (
            // No media or audio - show camera icon
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <div className="text-primary/40 text-2xl sm:text-4xl">📸</div>
            </div>
          )}
          
          {/* Audio Indicator - Only show when there's both media and audio */}
          {hasAudio && primaryMedia && (
            <div className={`absolute ${isMobile ? 'top-1.5 right-1.5' : 'top-2 right-2 sm:top-3 sm:right-3'} bg-black/60 backdrop-blur-sm rounded-full ${isMobile ? 'p-1' : 'p-1.5 sm:p-2'}`}>
              <Play className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3 sm:w-4 sm:h-4'} text-white fill-white`} />
            </div>
          )}
          
          {/* Date Badge */}
          <div className={`absolute ${isMobile ? 'bottom-1.5 left-1.5' : 'bottom-2 left-2 sm:bottom-3 sm:left-3'} bg-background/90 backdrop-blur-sm rounded-full ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1 sm:px-3'}`}>
            <div className="flex items-center gap-1 text-xs font-medium">
              <Calendar className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'}`} />
              <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-xs'}`}>{format(new Date(memory.date), 'MMM d')}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className={`${isMobile ? 'p-1.5 space-y-1.5' : 'p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3'}`}>
          {/* Title */}
          <h3 className={`font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors ${isMobile ? 'text-xs leading-tight' : 'text-sm sm:text-base'}`}>
            {memory.title}
          </h3>
          
          {/* Summary */}
          <p className={`text-muted-foreground line-clamp-2 leading-relaxed ${isMobile ? 'text-xs leading-tight' : 'text-xs sm:text-sm'}`}>
            {memory.summary}
          </p>
          
          {/* Location */}
          {memory.location && (
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground ${isMobile ? 'gap-1' : ''}`}>
              <MapPin className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'} flex-shrink-0`} />
              <span className={`truncate ${isMobile ? 'text-xs leading-tight' : 'text-xs'}`}>{memory.location}</span>
            </div>
          )}
          
          {/* Tags */}
          {memory.tags.length > 0 && (
            <div className={`flex flex-wrap gap-1 ${isMobile ? 'gap-0.5' : ''}`}>
              {memory.tags.slice(0, isMobile ? 1 : 2).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className={`${isMobile ? 'text-xs px-1 py-0.5 text-xs leading-tight' : 'text-xs px-1.5 py-0.5 sm:px-2 sm:py-1'} bg-primary/10 text-primary border-primary/20`}
                >
                  {tag}
                </Badge>
              ))}
              {memory.tags.length > (isMobile ? 1 : 2) && (
                <Badge variant="outline" className={`${isMobile ? 'text-xs px-1 py-0.5 text-xs leading-tight' : 'text-xs px-1.5 py-0.5 sm:px-2 sm:py-1'}`}>
                  +{memory.tags.length - (isMobile ? 1 : 2)}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
