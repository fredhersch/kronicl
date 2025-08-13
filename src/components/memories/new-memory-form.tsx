'use client';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { generateMemoryTitleSummaryTags } from '@/ai/flows/generate-memory-title-summary-tags';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Map } from '../map';
import {
  Upload,
  Mic,
  Square,
  FileText,
  Calendar as CalendarIcon,
  MapPin,
  Tag,
  Wand2,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  Cloud,
} from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  summary: z.string().min(1, 'Summary is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  location: z.string().min(1, 'Location is required.'),
  transcription: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export function NewMemoryForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      summary: '',
      date: new Date(),
      location: 'New York, NY',
      transcription: '',
      tags: [],
    },
  });

  const tags = form.watch('tags');
  const transcription = form.watch('transcription');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      // Basic validation: up to 3 images or 1 video
      const imageCount = files.filter(f => f.type.startsWith('image/')).length;
      const videoCount = files.filter(f => f.type.startsWith('video/')).length;
      if (videoCount > 1 || (videoCount > 0 && imageCount > 0) || imageCount > 3) {
        toast({
          variant: 'destructive',
          title: 'Invalid selection',
          description: 'You can upload up to 3 images or 1 video.',
        });
        return;
      }
      setMediaFiles(files);
      if (files.length > 0) {
        form.setValue('date', new Date(files[0].lastModified));
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        // Mock transcription
        form.setValue('transcription', 'This is a mock transcription of the recorded audio note. In a real application, this would be generated from the audio file.');
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 300) {
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Recording failed',
        description: 'Could not access microphone. Please check permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
  };
  
  const handleGenerateContent = async () => {
    if (!transcription) {
      toast({
        variant: 'destructive',
        title: 'Transcription is empty',
        description: 'Please record an audio note or write a transcription first.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateMemoryTitleSummaryTags({ transcription });
      form.setValue('title', result.title);
      form.setValue('summary', result.summary);
      form.setValue('tags', result.tags);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: 'Could not generate content. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = [...tags, tagInput.trim()];
      form.setValue('tags', newTags, { shouldValidate: true });
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    form.setValue('tags', newTags, { shouldValidate: true });
  };
  
  const onSubmit = (data: FormValues) => {
    if (mediaFiles.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No media selected',
            description: 'Please select at least one photo or video.',
        });
        return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
        setUploadProgress((prev) => {
            if (prev >= 95) return prev;
            return prev + Math.floor(Math.random() * 10) + 5;
        });
    }, 500);

    setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
            toast({
                title: 'Memory Created!',
                description: 'Your new memory has been saved.',
            });
            router.push('/');
        }, 500);
    }, 5000);
  };
  
  if (isUploading) {
      const estimatedTime = Math.max(1, Math.round((100 - uploadProgress) / 20));
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Saving your memory...</CardTitle>
                  <CardDescription>Please wait while we upload your files. This may take a few moments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{uploadProgress}% complete</span>
                      <span>About {estimatedTime} seconds remaining</span>
                  </div>
              </CardContent>
          </Card>
      );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload className="w-6 h-6"/> Media</CardTitle>
                <CardDescription>Select up to 3 images or 1 video for your memory. You can also select from Google Photos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="flex flex-wrap gap-4">
                        {mediaFiles.map((file, i) => (
                            <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border">
                                {file.type.startsWith('image/') ? (
                                    <Image src={URL.createObjectURL(file)} alt={file.name} layout="fill" objectFit="cover" />
                                ) : (
                                    <div className="w-full h-full bg-black flex items-center justify-center">
                                        <Video className="w-10 h-10 text-white" />
                                    </div>
                                )}
                                <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => setMediaFiles(mediaFiles.filter((_, idx) => idx !== i))}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                         <label className="w-32 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                            <ImageIcon className="w-10 h-10 text-muted-foreground" />
                            <span className="text-xs mt-1 text-muted-foreground">Add Media</span>
                            <input type="file" multiple accept="image/*,video/*" className="sr-only" onChange={handleFileChange} />
                         </label>
                    </div>
                    <Button variant="outline"><Cloud className="mr-2 h-4 w-4"/> Select from Google Photos</Button>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mic className="w-6 h-6"/> Audio Note & Transcription</CardTitle>
            <CardDescription>Record an audio note (up to 300s). We'll transcribe it for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-24 ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}>
                {isRecording ? <Square className="mr-2 h-4 w-4"/> : <Mic className="mr-2 h-4 w-4"/>}
                {isRecording ? 'Stop' : 'Record'}
              </Button>
              {isRecording && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse"></div>
                  <span>{format(recordingTime * 1000, 'mm:ss')}</span>
                </div>
              )}
              {audioBlob && !isRecording && (
                <audio controls src={URL.createObjectURL(audioBlob)} className="h-10"></audio>
              )}
            </div>

            <FormField
              control={form.control}
              name="transcription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><FileText className="w-5 h-5"/> Transcription</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Your transcription will appear here..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>AI Generated Content</CardTitle>
                     <Button type="button" onClick={handleGenerateContent} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                        Generate
                    </Button>
                </div>
                <CardDescription>Let AI help you craft the perfect title, summary, and tags from your transcription.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Sunny Day at the Beach" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., A wonderful day spent with family..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem>
                       <FormLabel className="flex items-center gap-2"><Tag className="w-5 h-5"/> Tags</FormLabel>
                      <FormControl>
                          <div className="flex items-center gap-2 border rounded-md p-2">
                             <div className="flex flex-wrap gap-2 flex-1">
                              {tags.map((tag, i) => (
                                <Badge key={i} variant="secondary">
                                  {tag}
                                  <button type="button" onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                                      <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Add a tag..."
                                    className="bg-transparent outline-none flex-1 min-w-[80px]"
                                />
                             </div>
                          </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Add the date and location of your memory.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2"><CalendarIcon className="w-5 h-5"/> Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className="pl-3 text-left font-normal">
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                 <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel className="flex items-center gap-2"><MapPin className="w-5 h-5"/> Location</FormLabel>
                       <FormControl>
                         <Input placeholder="Search for a location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Map latitude={40.7128} longitude={-74.0060} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">Save Memory</Button>
        </div>
      </form>
    </Form>
  );
}
