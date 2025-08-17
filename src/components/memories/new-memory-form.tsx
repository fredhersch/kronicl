
'use client';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateMemoryTitleSummaryTags } from '@/ai/flows/generate-memory-title-summary-tags';
import { transcribeAudio } from '@/ai/flows/transcribe-audio-flow';
import { analyzeSentiment } from '@/ai/flows/analyze-sentiment';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

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
import { GooglePhotosPicker } from './google-photos-picker';
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
  Search,
  Link as LinkIcon,
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Memory } from '@/lib/types';
import Link from 'next/link';
import { app } from '@/lib/firebase-client';

const db = getFirestore(app);
const storage = getStorage(app);


const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  summary: z.string().min(1, 'Summary is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  location: z.string().min(1, 'Location is required.'),
  transcription: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required.'),
});

type FormValues = z.infer<typeof formSchema>;

const blobToDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export function NewMemoryForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { user, isGooglePhotosConnected } = useAuth();
  const { toast } = useToast();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.006);
  const [sentiment, setSentiment] = useState<Memory['sentiment']>('neutral');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const googleMapsApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      summary: '',
      date: new Date(),
      location: '',
      transcription: '',
      tags: [],
    },
  });
  
  const fetchLocationName = async (lat: number, lng: number) => {
      if (!googleMapsApiKey) {
        console.warn("Google Maps API Key is missing.");
        form.setValue('location', `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        return;
      }
      try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          form.setValue('location', data.results[0].formatted_address);
        } else {
          form.setValue('location', `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        }
      } catch (error) {
        console.error('Reverse geocoding failed', error);
        form.setValue('location', `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        toast({
          variant: "destructive",
          title: "Could not fetch location name",
          description: "Please check your API key and network connection.",
        });
      }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          fetchLocationName(lat, lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            variant: "destructive",
            title: "Could not get location",
            description: "Using default location. Please ensure location services are enabled.",
          });
          fetchLocationName(latitude, longitude); // Use default location
        }
      );
    } else {
        fetchLocationName(latitude, longitude); // Use default location if geolocation is not supported
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationSearch = async () => {
    const locationQuery = form.getValues('location');
    if (!locationQuery) {
        toast({ variant: 'destructive', title: 'No location entered', description: 'Please type an address to search.' });
        return;
    }

    if (!googleMapsApiKey) {
      toast({
        variant: "destructive",
        title: "Missing API Key",
        description: "Google Maps API key is missing or invalid.",
      });
      return;
    }

    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${googleMapsApiKey}`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            setLatitude(lat);
            setLongitude(lng);
            form.setValue('location', data.results[0].formatted_address);
        } else {
            toast({ variant: 'destructive', title: 'Location not found', description: 'Could not find the specified location. Please try again.' });
        }
    } catch (error) {
        console.error("Geocoding failed", error);
        toast({ variant: 'destructive', title: 'Location search failed', description: 'There was an error searching for the location.' });
    }
  };


  const tags = form.watch('tags');

  const addMediaFiles = (newFiles: File[]) => {
    const combinedFiles = [...mediaFiles, ...newFiles];
    const imageCount = combinedFiles.filter(f => f.type.startsWith('image/')).length;
    const videoCount = combinedFiles.filter(f => f.type.startsWith('video/')).length;

    if (videoCount > 1 || (videoCount > 0 && imageCount > 0) || imageCount > 3) {
      toast({
        variant: 'destructive',
        title: 'Invalid selection',
        description: 'You can upload up to 3 images or 1 video.',
      });
      return;
    }
    
    setMediaFiles(combinedFiles);

    if (combinedFiles.length > 0 && mediaFiles.length === 0) {
      form.setValue('date', new Date(combinedFiles[0].lastModified));
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addMediaFiles(Array.from(event.target.files));
      // Reset file input to allow re-selection of the same file if needed after removal
      event.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());

        setIsProcessingAI(true);
        try {
          const audioDataUri = await blobToDataUri(blob);
          const { transcription } = await transcribeAudio({ audioDataUri });
          form.setValue('transcription', transcription);

          const [{ title, summary, tags }, { sentiment }] = await Promise.all([
             generateMemoryTitleSummaryTags({ transcription }),
             analyzeSentiment({ transcription })
          ]);
          
          form.setValue('title', title);
          form.setValue('summary', summary);
          form.setValue('tags', tags);
          setSentiment(sentiment);

        } catch (error) {
          console.error("AI Processing Error:", error);
          toast({
            variant: 'destructive',
            title: 'AI Processing Failed',
            description: 'Could not process audio. Please try again.',
          });
        } finally {
          setIsProcessingAI(false);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
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
    }
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        form.setValue('tags', newTags, { shouldValidate: true });
      }
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    form.setValue('tags', newTags, { shouldValidate: true });
  };
  
  const onSubmit = async (data: FormValues) => {
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
    
    const mediaItems: { type: 'image' | 'video'; url: string }[] = [];
    let audioUrl = '';

    const uploadTasks: Promise<void>[] = [];
    const filesToUpload = [...mediaFiles];
    if (audioBlob) {
        filesToUpload.push(new File([audioBlob], 'audio.webm', { type: 'audio/webm' }));
    }

    const fileProgress: { [key: string]: number } = {};
    const totalSize = filesToUpload.reduce((acc, file) => acc + file.size, 0);

    const updateProgress = () => {
        const uploadedBytes = Object.values(fileProgress).reduce((acc, bytes) => acc + bytes, 0);
        const progress = totalSize > 0 ? (uploadedBytes / totalSize) * 100 : 0;
        setUploadProgress(progress);
    };

    // Upload media files
    for (const file of mediaFiles) {
        const fileId = uuidv4();
        const fileName = `${fileId}-${file.name}`;
        const storageRef = ref(storage, `memories/${userId}/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const taskPromise = new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    fileProgress[fileName] = snapshot.bytesTransferred;
                    updateProgress();
                },
                (error) => {
                    console.error("Upload failed for", fileName, error);
                    delete fileProgress[fileName];
                    updateProgress();
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    mediaItems.push({
                        type: file.type.startsWith('image/') ? 'image' : 'video',
                        url: downloadURL
                    });
                    resolve();
                }
            );
        });
        uploadTasks.push(taskPromise);
    }
    
    // Upload audio file
    if (audioBlob) {
        const audioId = uuidv4();
        const audioName = `${audioId}.webm`;
        const audioRef = ref(storage, `memories/${userId}/audio/${audioName}`);
        const uploadTask = uploadBytesResumable(audioRef, audioBlob);
        
        const taskPromise = new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    fileProgress[audioName] = snapshot.bytesTransferred;
                    updateProgress();
                },
                (error) => {
                    console.error("Audio upload failed:", error);
                    delete fileProgress[audioName];
                    updateProgress();
                    reject(error);
                },
                async () => {
                    audioUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve();
                }
            );
        });
        uploadTasks.push(taskPromise);
    }

    try {
        await Promise.all(uploadTasks);

        await addDoc(collection(db, 'memories'), {
            ...data,
            userId,
            media: mediaItems,
            audioUrl,
            createdAt: serverTimestamp(),
            latitude: latitude,
            longitude: longitude,
            sentiment: sentiment,
        });

        toast({
            title: 'Memory Created!',
            description: 'Your new memory has been saved.',
        });
        router.push('/');
    } catch (error) {
        console.error("Error creating memory:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to create memory',
            description: 'There was an error saving your memory. Please try again.',
        });
    } finally {
        setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };
  
  if (isUploading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Saving your memory...</CardTitle>
                  <CardDescription>Please wait while we upload your files. This may take a few moments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <div className="flex justify-center text-sm text-muted-foreground">
                      <span>{Math.round(uploadProgress)}% complete</span>
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
                            <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border/40">
                                {file.type.startsWith('image/') ? (
                                    <Image src={URL.createObjectURL(file)} alt={file.name} layout="fill" objectFit="cover" />
                                ) : (
                                    <div className="w-full h-full bg-black flex items-center justify-center">
                                        <Video className="w-10 h-10 text-white" />
                                    </div>
                                )}
                                <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 z-10" onClick={() => setMediaFiles(mediaFiles.filter((_, idx) => idx !== i))}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                         <label className="w-32 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                            <ImageIcon className="w-10 h-10 text-muted-foreground" />
                            <span className="text-xs mt-1 text-muted-foreground">Add Media</span>
                            <input type="file" multiple accept="image/*,video/*" className="sr-only" onChange={handleFileChange} />
                         </label>
                    </div>

                    {isGooglePhotosConnected() ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => setIsPickerOpen(true)}><Cloud className="mr-2 h-4 w-4"/> Select from Google Photos</Button>
                            <GooglePhotosPicker
                                open={isPickerOpen}
                                onOpenChange={setIsPickerOpen}
                                onSelect={addMediaFiles}
                            />
                        </>
                    ) : (
                        <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center text-center gap-2">
                             <p className="text-sm text-muted-foreground">Connect your Google account to select photos directly from your library.</p>
                             <Link href="/profile">
                                <Button variant="secondary">
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Connect to Google Photos
                                </Button>
                             </Link>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mic className="w-6 h-6"/> Audio Note & Transcription</CardTitle>
            <CardDescription>Record an audio note (up to 300s). We'll transcribe it and generate content for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-24 ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`} disabled={isProcessingAI}>
                {isRecording ? <Square className="mr-2 h-4 w-4"/> : <Mic className="mr-2 h-4 w-4"/>}
                {isRecording ? 'Stop' : 'Record'}
              </Button>
              {isRecording && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse"></div>
                  <span>{formatTime(recordingTime)}</span>
                </div>
              )}
               {isProcessingAI && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
              {audioBlob && !isRecording && !isProcessingAI && (
                <audio controls src={URL.createObjectURL(audioBlob)} className="h-10"></audio>
              )}
            </div>

            <FormField
              control={form.control}
              name="transcription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-medium"><FileText className="w-5 h-5"/> Transcription</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Your transcription will appear here..." {...field} rows={5} disabled={isProcessingAI} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wand2 className="w-6 h-6"/> AI Generated Content</CardTitle>
                <CardDescription>Review and edit the AI-generated title, summary, and tags.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Title</FormLabel>
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
                      <FormLabel className="font-medium">Summary</FormLabel>
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
                       <FormLabel className="flex items-center gap-2 font-medium"><Tag className="w-5 h-5"/> Tags</FormLabel>
                      <FormControl>
                          <div className="flex items-center gap-2 border rounded-md p-2 flex-wrap">
                              {tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
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
                                    placeholder="Add a tag and press Enter..."
                                    className="bg-transparent outline-none flex-1 min-w-[150px] p-1"
                                />
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
          <CardContent className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="flex items-center gap-2 font-medium"><CalendarIcon className="w-5 h-5"/> Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className="pl-3 text-left font-normal justify-start">
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
                       <FormLabel className="flex items-center gap-2 font-medium"><MapPin className="w-5 h-5"/> Location</FormLabel>
                        <div className="flex items-center gap-2">
                           <FormControl>
                             <Input placeholder="Search for a location" {...field} />
                          </FormControl>
                           <Button type="button" size="icon" variant="outline" onClick={handleLocationSearch}>
                            <Search className="w-4 h-4" />
                            <span className="sr-only">Search Location</span>
                           </Button>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Map latitude={latitude} longitude={longitude} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={isUploading || isProcessingAI} className="min-w-[150px]">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Save Memory
          </Button>
        </div>
      </form>
    </Form>
  );
}
