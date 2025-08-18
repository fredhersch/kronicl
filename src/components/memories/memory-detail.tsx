'use client';
import type { Memory } from '@/lib/types';
import Image from 'next/image';
import { Map } from '../map';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarDays, MapPin, Mic, FileText, Smile, Meh, Frown, Tag, Music, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { formatCreationTime } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export function MemoryDetail({ memory }: { memory: Memory }) {
    const SentimentIcon = {
        positive: <Smile className="w-5 h-5 text-green-600" />,
        neutral: <Meh className="w-5 h-5 text-yellow-600" />,
        negative: <Frown className="w-5 h-5 text-red-600" />,
    }[memory.sentiment];
    
    const sentimentVariant = {
        positive: 'positive',
        negative: 'destructive',
        neutral: 'neutral',
    } as const;

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
               <CardTitle className="font-headline text-3xl">{memory.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-foreground/90 mb-2">
                    <BookOpen className="w-5 h-5 text-accent"/>
                    Summary
                  </h3>
                  <p className="text-muted-foreground">{memory.summary}</p>
                </div>
                
                 <div>
                  <h3 className="flex items-center gap-2 font-semibold text-lg text-foreground/90 mb-2">
                    <Music className="w-5 h-5 text-accent"/>
                    Audio Note
                  </h3>
                  <audio controls src={memory.audioUrl} className="w-full mt-1">
                    Your browser does not support the audio element.
                  </audio>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="transcription">
                        <AccordionTrigger>
                           <h3 className="flex items-center gap-2 font-semibold text-lg text-foreground/90">
                             <FileText className="w-5 h-5 text-accent"/>
                             Transcription
                           </h3>
                        </AccordionTrigger>
                        <AccordionContent>
                           <p className="text-muted-foreground whitespace-pre-wrap">{memory.transcription}</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div>
                   <h3 className="flex items-center gap-2 font-semibold text-lg text-foreground/90 mb-3">
                     <Tag className="w-5 h-5 text-accent"/>
                     Tags
                   </h3>
                   <div className="flex flex-wrap gap-2">
                    {memory.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-accent/20 text-accent-foreground/80">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

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
                <CalendarDays className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <h3 className="font-semibold">Created</h3>
                  <p className="text-muted-foreground">{formatCreationTime(memory.clientCreatedAt)}</p>
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
                <div className="mt-0.5 text-accent">{SentimentIcon}</div>
                 <div>
                  <h3 className="font-semibold">Sentiment</h3>
                   <Badge variant={sentimentVariant[memory.sentiment]} className="capitalize">
                      {memory.sentiment}
                   </Badge>
                </div>
              </div>
               <div className="mt-4">
                 <Map latitude={memory.latitude} longitude={memory.longitude} />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
