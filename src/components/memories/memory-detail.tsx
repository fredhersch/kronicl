'use client';
import type { Memory } from '@/lib/types';
import Image from 'next/image';
import { Map } from '../map';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarDays, MapPin, Mic, FileText, Smile, Meh, Frown } from 'lucide-react';
import { format } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';

export function MemoryDetail({ memory }: { memory: Memory }) {
  const SentimentIcon = {
    positive: <Smile className="w-5 h-5 text-green-500" />,
    neutral: <Meh className="w-5 h-5 text-yellow-500" />,
    negative: <Frown className="w-5 h-5 text-red-500" />,
  }[memory.sentiment];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardContent className="p-0">
          <Carousel className="w-full">
            <CarouselContent>
              {memory.media.map((item, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full aspect-video">
                     <Image
                      src={item.url}
                      alt={`${memory.title} - media ${index + 1}`}
                      layout="fill"
                      objectFit="contain"
                      className="rounded-t-lg bg-black"
                      data-ai-hint={item.dataAiHint}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {memory.media.length > 1 && (
              <>
                <CarouselPrevious className="ml-16" />
                <CarouselNext className="mr-16" />
              </>
            )}
          </Carousel>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{memory.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <FileText className="w-6 h-6" /> Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{memory.transcription}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
               <CardTitle className="font-headline text-2xl">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <h3 className="font-semibold">Date</h3>
                  <p className="text-muted-foreground">{format(new Date(memory.date), 'PPP p')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-muted-foreground">{memory.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 mt-1 text-accent" />
                 <div>
                  <h3 className="font-semibold">Audio Note</h3>
                  <audio controls src={memory.audioUrl} className="w-full mt-1">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
               <div className="flex items-start gap-3">
                <div className="mt-1 text-accent">{SentimentIcon}</div>
                 <div>
                  <h3 className="font-semibold">Sentiment</h3>
                  <p className="text-muted-foreground capitalize">{memory.sentiment}</p>
                </div>
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
               <CardTitle className="font-headline text-2xl">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <Map latitude={memory.latitude} longitude={memory.longitude} />
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
               <CardTitle className="font-headline text-2xl">Tags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-accent/20 text-accent-foreground/80">
                  {tag}
                </Badge>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
