'use client';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateMemoryTitleSummaryTags } from '@/ai/flows/generate-memory-title-summary-tags';
import { transcribeAudio } from '@/ai/flows/transcribe-audio-flow';
import { analyzeSentiment } from '@/ai/flows/analyze-sentiment';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageLogging } from '@/hooks/use-page-logging';
import { logger, logInfo, logError, logDebug, logWarn } from '@/lib/logger-client';
import { 
  validateTranscriptionResponse, 
  validateTitleSummaryResponse, 
  validateSentimentResponse, 
  createFallbackValues,
  logAIServiceCall,
  logAIServiceResult
} from '@/lib/ai-debug-utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
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
  Search,
  Plus,
  Play,
  Pause,
  Info,
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Memory } from '@/lib/types';
import { compressImages, getOptimalCompressionOptions, shouldCompressImage, formatFileSize } from '@/lib/image-compression';
import { compressVideo, getOptimalVideoCompressionOptions, shouldCompressVideo, isVideoFormatSupported } from '@/lib/video-compression';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  summary: z.string().min(1, 'Summary is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  location: z.string().min(1, 'Location is required.'),
  transcription: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required.'),
  // Media is now optional - no validation required
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

// Helper function to convert URL to File object
async function urlToFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

export function NewMemoryForm({ userId }: { userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { db, storage } = useAuth();
  const { toast } = useToast();
  const { logPageEvent, getCurrentPageInfo } = usePageLogging();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.006);
  const [sentiment, setSentiment] = useState<Memory['sentiment']>('neutral');
  const hasSetDateFromFile = useRef(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
      if (!googleMapsApiKey || googleMapsApiKey.includes('YOUR_API_KEY')) {
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

  // Auto-set date from first media file when media files change
  useEffect(() => {
    if (mediaFiles.length > 0 && !hasSetDateFromFile.current) {
      const firstFileDate = new Date(mediaFiles[0].lastModified);
      
      // Log date auto-set from file
      logDebug('Date auto-set from file', {
        component: 'NewMemoryForm',
        function: 'useEffect-mediaFiles',
        action: 'date-auto-set',
        userId: userId,
        fileName: mediaFiles[0].name,
        fileDate: firstFileDate.toISOString(),
        timestamp: new Date().toISOString()
      });

      // Set the date and mark that we've done it
      form.setValue('date', firstFileDate);
      hasSetDateFromFile.current = true;
    }
  }, [mediaFiles, form, userId]);

  // Handle pre-selected media from gallery
  useEffect(() => {
    const preselectedMediaParam = searchParams.get('preselectedMedia');
    if (preselectedMediaParam) {
      try {
        const mediaUrls = JSON.parse(preselectedMediaParam) as string[];
        
        // Convert URLs to File objects
        Promise.all(
          mediaUrls.map(async (url, index) => {
            try {
              // Extract filename from URL or create a default one
              const urlParts = url.split('/');
              const filename = urlParts[urlParts.length - 1] || `gallery-item-${index + 1}`;
              return await urlToFile(url, filename);
            } catch (error) {
              console.error('Failed to convert URL to file:', url, error);
              return null;
            }
          })
        ).then((files) => {
          const validFiles = files.filter((file): file is File => file !== null);
          if (validFiles.length > 0) {
            setMediaFiles(validFiles);
            setIncludeMedia(true);
            
            toast({
              title: 'Media Selected',
              description: `${validFiles.length} item${validFiles.length !== 1 ? 's' : ''} loaded from gallery`,
            });
          }
        }).catch((error) => {
          console.error('Failed to load pre-selected media:', error);
          toast({
            title: 'Error',
            description: 'Failed to load selected media from gallery',
            variant: 'destructive'
          });
        });
        
        // Clear the URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('preselectedMedia');
        window.history.replaceState({}, '', url.toString());
      } catch (error) {
        console.error('Failed to parse preselected media:', error);
      }
    }
  }, [searchParams, toast]);

  const handleLocationSearch = async () => {
    const locationQuery = form.getValues('location');
    if (!locationQuery) {
        toast({ variant: 'destructive', title: 'No location entered', description: 'Please type an address to search.' });
        return;
    }

    if (!googleMapsApiKey || googleMapsApiKey.includes('YOUR_API_KEY')) {
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

  const addMediaFiles = async (newFiles: File[]) => {
    // Get current page info for context
    const pageInfo = getCurrentPageInfo();
    
    // Enhanced file validation and processing
    const validFiles = newFiles.filter(file => {
      // Check file size (max 50MB per file)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        logWarn('File too large, skipping', {
          component: 'NewMemoryForm',
          function: 'addMediaFiles',
          action: 'file-too-large',
          userId: userId,
          fileName: file.name,
          fileSize: file.size,
          maxSize,
          timestamp: new Date().toISOString()
        });
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} is too large. Maximum size is 50MB.`,
        });
        return false;
      }

      // Check file type
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      if (!isValidType) {
        logWarn('Invalid file type, skipping', {
          component: 'NewMemoryForm',
          function: 'addMediaFiles',
          action: 'invalid-file-type',
          userId: userId,
          fileName: file.name,
          fileType: file.type,
          timestamp: new Date().toISOString()
        });
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a supported image or video file.`,
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      logWarn('No valid files after filtering', {
        component: 'NewMemoryForm',
        function: 'addMediaFiles',
        action: 'no-valid-files',
        userId: userId,
        originalCount: newFiles.length,
        validCount: validFiles.length,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Log file selection with page context
    logInfo('Media files selected', {
      component: 'NewMemoryForm',
      function: 'addMediaFiles',
      action: 'files-selected',
      userId: userId,
      pageContext: {
        currentPath: pageInfo.currentPath,
        sessionId: pageInfo.sessionId
      },
      newFilesCount: validFiles.length,
      newFiles: validFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      })),
      existingFilesCount: mediaFiles.length,
      timestamp: new Date().toISOString()
    });

    // Log page event for file selection
    logPageEvent('Media Files Selected', {
      userId: userId,
      newFilesCount: validFiles.length,
      totalFilesAfter: mediaFiles.length + validFiles.length,
      fileTypes: validFiles.map(f => f.type),
      totalSize: validFiles.reduce((total, file) => total + file.size, 0),
      pagePath: pageInfo.currentPath
    });

    try {
      // Start compression process
      setIsCompressing(true);
      setCompressionProgress(0);
      
      // Compress files before adding them
      const compressedFiles = await Promise.all(
        validFiles.map(async (file, index) => {
          try {
            if (file.type.startsWith('image/')) {
              // Compress images
              if (shouldCompressImage(file)) {
                const baseOptions = getOptimalCompressionOptions(file.size);
                
                // Apply quality setting
                const options = {
                  ...baseOptions,
                  quality: compressionQuality >= 0.8 ? 0.9 : 
                          compressionQuality >= 0.6 ? 0.8 : 0.7
                };
                
                const result = await compressImages([file], options);
                const compressedResult = result[0];
                
                // Log compression results
                logInfo('Image compressed successfully', {
                  component: 'NewMemoryForm',
                  function: 'addMediaFiles',
                  action: 'image-compressed',
                  fileName: file.name,
                  originalSize: compressedResult.originalSize,
                  compressedSize: compressedResult.compressedSize,
                  compressionRatio: Math.round(compressedResult.compressionRatio),
                  newDimensions: `${compressedResult.width}x${compressedResult.height}`,
                  quality: compressionQuality,
                  userId: userId
                });
                
                // Update progress
                setCompressionProgress(((index + 1) / validFiles.length) * 100);
                
                // Create new file with compressed data
                return new File([compressedResult.blob], file.name, {
                  type: `image/${options.format}`,
                  lastModified: Date.now()
                });
              } else {
                // No compression needed
                setCompressionProgress(((index + 1) / validFiles.length) * 100);
                return file;
              }
            } else if (file.type.startsWith('video/')) {
              // Compress videos
              if (shouldCompressVideo(file) && isVideoFormatSupported(file)) {
                try {
                  const baseOptions = getOptimalVideoCompressionOptions(file.size);
                  
                  // Apply quality setting
                  const options = {
                    ...baseOptions,
                    quality: compressionQuality >= 0.8 ? 0.9 : 
                            compressionQuality >= 0.6 ? 0.8 : 0.7
                  };
                  
                  const result = await compressVideo(file, options);
                  
                  logInfo('Video compressed successfully', {
                    component: 'NewMemoryForm',
                    function: 'addMediaFiles',
                    action: 'video-compressed',
                    fileName: file.name,
                    originalSize: result.originalSize,
                    compressedSize: result.compressedSize,
                    compressionRatio: Math.round(result.compressionRatio),
                    duration: result.duration,
                    newDimensions: `${result.width}x${result.height}`,
                    quality: compressionQuality,
                    userId: userId
                  });
                  
                  // Update progress
                  setCompressionProgress(((index + 1) / validFiles.length) * 100);
                  
                  return new File([result.blob], file.name, {
                    type: 'video/webm',
                    lastModified: Date.now()
                  });
                } catch (error) {
                  logWarn('Video compression failed, using original', {
                    component: 'NewMemoryForm',
                    function: 'addMediaFiles',
                    action: 'video-compression-failed',
                    fileName: file.name,
                    error: error instanceof Error ? error.message : String(error),
                    userId: userId
                  });
                  
                  // Update progress
                  setCompressionProgress(((index + 1) / validFiles.length) * 100);
                  
                  return file; // Fallback to original
                }
              } else {
                // No compression needed or not supported
                setCompressionProgress(((index + 1) / validFiles.length) * 100);
                return file;
              }
            }
            return file;
          } catch (error) {
            logError('File compression failed', {
              component: 'NewMemoryForm',
              function: 'addMediaFiles',
              action: 'compression-error',
              fileName: file.name,
              error: error instanceof Error ? error.message : String(error),
              userId: userId
            });
            
            // Update progress
            setCompressionProgress(((index + 1) / validFiles.length) * 100);
            
            return file; // Fallback to original
          }
        })
      );
      
      // Compression completed
      setIsCompressing(false);
      setCompressionProgress(100);
      
      // Log compression summary
      const totalOriginalSize = validFiles.reduce((total, file) => total + file.size, 0);
      const totalCompressedSize = compressedFiles.reduce((total, file) => total + file.size, 0);
      const overallCompressionRatio = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;
      
      logInfo('File compression completed', {
        component: 'NewMemoryForm',
        function: 'addMediaFiles',
        action: 'compression-completed',
        userId: userId,
        totalFiles: compressedFiles.length,
        totalOriginalSize,
        totalCompressedSize,
        overallCompressionRatio: Math.round(overallCompressionRatio),
        sizeReduction: formatFileSize(totalOriginalSize - totalCompressedSize),
        timestamp: new Date().toISOString()
      });
      
      // Show compression results to user
      if (overallCompressionRatio > 10) {
        toast({
          title: 'Files compressed successfully',
          description: `Reduced size by ${Math.round(overallCompressionRatio)}% (${formatFileSize(totalOriginalSize - totalCompressedSize)})`,
        });
      }
      
      const combinedFiles = [...mediaFiles, ...compressedFiles];
    const imageCount = combinedFiles.filter(f => f.type.startsWith('image/')).length;
    const videoCount = combinedFiles.filter(f => f.type.startsWith('video/')).length;

    // Log file validation
    logDebug('Validating file selection', {
      component: 'NewMemoryForm',
      function: 'addMediaFiles',
      action: 'validation-check',
      userId: userId,
      totalFiles: combinedFiles.length,
      imageCount,
      videoCount,
      isValid: !(videoCount > 1 || (videoCount > 0 && imageCount > 0) || imageCount > 3),
      timestamp: new Date().toISOString()
    });

    if (videoCount > 1 || (videoCount > 0 && imageCount > 0) || imageCount > 3) {
      // Log validation failure
      logWarn('Invalid file selection', {
        component: 'NewMemoryForm',
        function: 'addMediaFiles',
        action: 'validation-failed',
        userId: userId,
        imageCount,
        videoCount,
        reason: videoCount > 1 ? 'too-many-videos' : 
                (videoCount > 0 && imageCount > 0) ? 'mixed-media-types' : 
                'too-many-images',
        timestamp: new Date().toISOString()
      });

      toast({
        variant: 'destructive',
        title: 'Invalid selection',
        description: 'You can upload up to 3 images or 1 video.',
      });
      return;
    }
    
    // Use functional update to avoid race conditions
    setMediaFiles(prevFiles => {
        const newCombinedFiles = [...prevFiles, ...compressedFiles];
      
      // Log successful file addition
      logInfo('Media files added successfully', {
        component: 'NewMemoryForm',
        function: 'addMediaFiles',
        action: 'files-added',
        userId: userId,
        totalFiles: newCombinedFiles.length,
        imageCount: newCombinedFiles.filter(f => f.type.startsWith('image/')).length,
        videoCount: newCombinedFiles.filter(f => f.type.startsWith('video/')).length,
        timestamp: new Date().toISOString()
      });

      return newCombinedFiles;
    });
      
    } catch (error) {
      // Compression failed, fallback to original files
      setIsCompressing(false);
      setCompressionProgress(0);
      
      logError('File compression failed', {
        component: 'NewMemoryForm',
        function: 'addMediaFiles',
        action: 'compression-failed',
        error: error instanceof Error ? error.message : String(error),
        userId: userId
      });
      
      toast({
        variant: 'destructive',
        title: 'Compression failed',
        description: 'Files will be uploaded without compression.',
      });
      
      // Fallback to original files
      const combinedFiles = [...mediaFiles, ...validFiles];
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
      
      setMediaFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  };

  const clearAllMedia = () => {
    try {
      const pageInfo = getCurrentPageInfo();
      
      // Log clearing all media
      logInfo('All media files cleared', {
        component: 'NewMemoryForm',
        function: 'clearAllMedia',
        action: 'all-files-cleared',
        userId: userId,
        pageContext: {
          currentPath: pageInfo.currentPath,
          sessionId: pageInfo.sessionId
        },
        clearedFileCount: mediaFiles.length,
        timestamp: new Date().toISOString()
      });

      // Log page event for clearing all media
      logPageEvent('All Media Files Cleared', {
        userId: userId,
        clearedFileCount: mediaFiles.length,
        pagePath: pageInfo.currentPath
      });

      setMediaFiles([]);
      
      // Reset the date ref so it can be set again if new files are added
      hasSetDateFromFile.current = false;
      
      // Log successful clearing
      logDebug('Media files state cleared', {
        component: 'NewMemoryForm',
        function: 'clearAllMedia',
        action: 'state-cleared',
        userId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logError('Error clearing all media files', {
        component: 'NewMemoryForm',
        function: 'clearAllMedia',
        action: 'clear-error',
        userId: userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, error instanceof Error ? error : undefined);

      toast({
        variant: 'destructive',
        title: 'Error clearing files',
        description: 'There was an error clearing the files. Please try again.',
      });
    }
  };

  const removeMediaFile = (index: number) => {
    try {
      const pageInfo = getCurrentPageInfo();
      const fileToRemove = mediaFiles[index];
      
      // Log file removal
      logInfo('Media file removed', {
        component: 'NewMemoryForm',
        function: 'removeMediaFile',
        action: 'file-removed',
        userId: userId,
        pageContext: {
          currentPath: pageInfo.currentPath,
          sessionId: pageInfo.sessionId
        },
        removedFile: {
          name: fileToRemove.name,
          size: fileToRemove.size,
          type: fileToRemove.type
        },
        remainingFiles: mediaFiles.length - 1,
        timestamp: new Date().toISOString()
      });

      // Log page event for file removal
      logPageEvent('Media File Removed', {
        userId: userId,
        fileName: fileToRemove.name,
        remainingFiles: mediaFiles.length - 1,
        pagePath: pageInfo.currentPath
      });

      // Use functional update to avoid race conditions
      setMediaFiles(prevFiles => {
        const newFiles = prevFiles.filter((_, idx) => idx !== index);
        
        // Reset the date ref if we're removing all files
        if (newFiles.length === 0) {
          hasSetDateFromFile.current = false;
        }
        
        // Log successful removal
        logDebug('Media files updated after removal', {
          component: 'NewMemoryForm',
          function: 'removeMediaFile',
          action: 'files-updated',
          userId: userId,
          newFileCount: newFiles.length,
          timestamp: new Date().toISOString()
        });
        
        return newFiles;
      });
    } catch (error) {
      logError('Error removing media file', {
        component: 'NewMemoryForm',
        function: 'removeMediaFile',
        action: 'removal-error',
        userId: userId,
        fileIndex: index,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, error instanceof Error ? error : undefined);

      toast({
        variant: 'destructive',
        title: 'Error removing file',
        description: 'There was an error removing the file. Please try again.',
      });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    try {
      if (event.target.files && event.target.files.length > 0) {
        const files = Array.from(event.target.files);
        const pageInfo = getCurrentPageInfo();
        
        // Log file input change with page context
        logDebug('File input changed', {
          component: 'NewMemoryForm',
          function: 'handleFileChange',
          action: 'input-change',
          userId: userId,
          pageContext: {
            currentPath: pageInfo.currentPath,
            sessionId: pageInfo.sessionId
          },
          filesSelected: files.length,
          files: files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          })),
          timestamp: new Date().toISOString()
        });

        // Log page event for file input change
        logPageEvent('File Input Changed', {
          userId: userId,
          filesSelected: files.length,
          fileNames: files.map(f => f.name),
          totalSize: files.reduce((total, file) => total + file.size, 0),
          pagePath: pageInfo.currentPath
        });

        // Process files
        addMediaFiles(files);
        
        // Log successful file processing
        logDebug('File input processed successfully', {
          component: 'NewMemoryForm',
          function: 'handleFileChange',
          action: 'files-processed',
          userId: userId,
          processedCount: files.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // Log any errors during file processing
      logError('Error processing file input', {
        component: 'NewMemoryForm',
        function: 'handleFileChange',
        action: 'file-processing-error',
        userId: userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, error instanceof Error ? error : undefined);

      toast({
        variant: 'destructive',
        title: 'File processing error',
        description: 'There was an error processing your files. Please try again.',
      });
    } finally {
      // Always reset the input value to allow re-selection
      // This is important for mobile devices and re-selection scenarios
      if (event.target) {
        event.target.value = '';
        
        // Log file input reset
        logDebug('File input reset', {
          component: 'NewMemoryForm',
          function: 'handleFileChange',
          action: 'input-reset',
          userId: userId,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setRecordingTime(0);
        setIsRecording(false);
        setIsPaused(false);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        // Start AI processing
        processAudioWithAI(audioBlob);
      };
      
      mediaRecorder.onpause = () => {
        setIsPaused(true);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };
      
      mediaRecorder.onresume = () => {
        setIsPaused(false);
        // Restart timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => {
            if (prev >= 300) {
              stopRecording();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 300) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      logInfo('Audio recording started', {
        component: 'NewMemoryForm',
        function: 'startRecording',
        action: 'recording-started',
        userId: userId
      });
      
    } catch (error) {
      logError('Failed to start audio recording', {
        component: 'NewMemoryForm',
        function: 'startRecording',
        action: 'recording-failed',
        error: error instanceof Error ? error.message : String(error),
        userId: userId
      });
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      logInfo('Audio recording paused', {
        component: 'NewMemoryForm',
        function: 'pauseRecording',
        action: 'recording-paused',
        recordingTime,
        userId: userId
      });
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      logInfo('Audio recording resumed', {
        component: 'NewMemoryForm',
        function: 'resumeRecording',
        action: 'recording-resumed',
        recordingTime,
        userId: userId
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      logInfo('Audio recording stopped', {
        component: 'NewMemoryForm',
        function: 'stopRecording',
        action: 'recording-stopped',
        finalRecordingTime: recordingTime,
        userId: userId
      });
    }
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      form.setValue('tags', newTags, { shouldValidate: true });
    }
    setTagInput('');
  };

  const handleTagBlur = () => {
    if (tagInput.trim()) {
      addTag();
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    form.setValue('tags', newTags, { shouldValidate: true });
  };
  
  const onSubmit = async (data: FormValues) => {
    // Get current page info for context
    const pageInfo = getCurrentPageInfo();
    
    // Log form submission start with page context
    logInfo('Memory form submission started', {
      component: 'NewMemoryForm',
      function: 'onSubmit',
      action: 'submission-start',
      userId: userId,
      pageContext: {
        currentPath: pageInfo.currentPath,
        previousPath: pageInfo.previousPath,
        searchParams: pageInfo.searchParams,
        sessionId: pageInfo.sessionId
      },
      mediaFileCount: mediaFiles.length,
      hasAudioBlob: !!audioBlob,
      formData: {
        title: data.title,
        summary: data.summary,
        date: data.date.toISOString(),
        location: data.location,
        tags: data.tags,
        latitude,
        longitude
      },
      timestamp: new Date().toISOString()
    });

    // Log page event for form submission
    logPageEvent('Memory Form Submission Started', {
      userId: userId,
      formData: {
        title: data.title,
        mediaFileCount: mediaFiles.length,
        hasAudioBlob: !!audioBlob,
        location: data.location
      },
      pagePath: pageInfo.currentPath
    });

    if (!db || !storage) {
        logError('Firebase services not available', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'services-unavailable',
          userId: userId,
          hasDb: !!db,
          hasStorage: !!storage,
          timestamp: new Date().toISOString()
        });

        toast({
            variant: 'destructive',
            title: 'Services not available',
            description: 'Firebase is not ready. Please wait a moment and try again.',
        });
        return;
    }
    if (includeMedia && mediaFiles.length === 0) {
        logWarn('No media files selected', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'no-media-selected',
          userId: userId,
          timestamp: new Date().toISOString()
        });

        toast({
            variant: 'destructive',
            title: 'No media selected',
            description: 'Please select at least one photo or video.',
        });
        return;
    }

    // Log upload preparation with page context
    logInfo('Preparing file uploads', {
      component: 'NewMemoryForm',
      function: 'onSubmit',
      action: 'upload-preparation',
      userId: userId,
      pageContext: {
        currentPath: pageInfo.currentPath,
        sessionId: pageInfo.sessionId
      },
      mediaFiles: mediaFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      })),
      audioBlobSize: audioBlob?.size || 0,
      timestamp: new Date().toISOString()
    });

    // Log page event for file upload preparation
    logPageEvent('File Upload Preparation Started', {
      userId: userId,
      fileCount: mediaFiles.length,
      totalFileSize: mediaFiles.reduce((total, file) => total + file.size, 0),
      hasAudio: !!audioBlob,
      pagePath: pageInfo.currentPath
    });

    setIsUploading(true);
    setUploadProgress(0);

    const uploadFile = (file: File, path: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Log upload initiation
            logInfo('File upload initiated', {
                component: 'NewMemoryForm',
                function: 'uploadFile',
                action: 'upload-start',
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                filePath: path,
                userId: userId,
                timestamp: new Date().toISOString()
            });

            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Log upload task creation
            logDebug('Upload task created', {
                component: 'NewMemoryForm',
                function: 'uploadFile',
                action: 'task-created',
                fileName: file.name,
                storagePath: path,
                uploadTaskId: uploadTask.snapshot?.ref?.name || 'unknown',
                timestamp: new Date().toISOString()
            });

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    const bytesTransferred = snapshot.bytesTransferred;
                    const totalBytes = snapshot.totalBytes;
                    const state = snapshot.state;
                    
                    // Log upload progress
                    logDebug('Upload progress update', {
                        component: 'NewMemoryForm',
                        function: 'uploadFile',
                        action: 'progress-update',
                        fileName: file.name,
                        progress: Math.round(progress),
                        bytesTransferred,
                        totalBytes,
                        state,
                        uploadTaskId: snapshot.ref.name,
                        timestamp: new Date().toISOString()
                    });

                    // This progress reporting is simplified. A more complex UI would track progress per file.
                    setUploadProgress(progress);
                },
                (error) => {
                    // Log upload error
                    logError('File upload failed', {
                        component: 'NewMemoryForm',
                        function: 'uploadFile',
                        action: 'upload-failed',
                        fileName: file.name,
                        filePath: path,
                        error: error.message,
                        errorCode: error.code,
                        errorStack: error.stack,
                        userId: userId,
                        timestamp: new Date().toISOString()
                    }, error);

                    console.error(`Upload failed for ${file.name}:`, error);
                    toast({
                        variant: 'destructive',
                        title: `Upload failed for ${file.name}`,
                        description: `Could not upload file. Please try again. Error: ${error.message}`,
                    });
                    reject(error);
                },
                async () => {
                    try {
                        // Log upload completion
                        logInfo('File upload completed successfully', {
                            component: 'NewMemoryForm',
                            function: 'uploadFile',
                            action: 'upload-completed',
                            fileName: file.name,
                            filePath: path,
                            uploadTaskId: uploadTask.snapshot.ref.name,
                            finalBytesTransferred: uploadTask.snapshot.bytesTransferred,
                            totalBytes: uploadTask.snapshot.totalBytes,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        });

                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        // Log download URL retrieval
                        logDebug('Download URL retrieved', {
                            component: 'NewMemoryForm',
                            function: 'uploadFile',
                            action: 'download-url-retrieved',
                            fileName: file.name,
                            downloadURL: downloadURL,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        });

                        resolve(downloadURL);
                    } catch (downloadError) {
                        // Log download URL error
                        logError('Failed to get download URL', {
                            component: 'NewMemoryForm',
                            function: 'uploadFile',
                            action: 'download-url-failed',
                            fileName: file.name,
                            filePath: path,
                            error: downloadError instanceof Error ? downloadError.message : 'Unknown error',
                            errorStack: downloadError instanceof Error ? downloadError.stack : undefined,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, downloadError instanceof Error ? downloadError : undefined);

                        reject(downloadError);
                    }
                }
            );
        });
    };

    try {
        // Log media upload start
        if (includeMedia && mediaFiles.length > 0) {
        logInfo('Starting media file uploads', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'media-upload-start',
          userId: userId,
          totalFiles: mediaFiles.length,
          timestamp: new Date().toISOString()
        });
        }

        const mediaItems: Memory['media'] = includeMedia && mediaFiles.length > 0 ? await Promise.all(
            mediaFiles.map(async (file, index) => {
                const fileId = uuidv4();
                const fileName = `${fileId}-${file.name}`;
                
                // Log individual file upload start with page context
                logDebug('Starting individual file upload', {
                  component: 'NewMemoryForm',
                  function: 'onSubmit',
                  action: 'individual-upload-start',
                  userId: userId,
                  pageContext: {
                    currentPath: pageInfo.currentPath,
                    sessionId: pageInfo.sessionId
                  },
                  fileIndex: index + 1,
                  totalFiles: mediaFiles.length,
                  fileName: file.name,
                  fileId: fileId,
                  storagePath: `memories/${userId}/${fileName}`,
                  timestamp: new Date().toISOString()
                });

                // Log page event for individual file upload
                logPageEvent('Individual File Upload Started', {
                  userId: userId,
                  fileIndex: index + 1,
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                  pagePath: pageInfo.currentPath
                });

                const url = await uploadFile(file, `memories/${userId}/${fileName}`);
                
                // Log individual file upload completion
                logDebug('Individual file upload completed', {
                  component: 'NewMemoryForm',
                  function: 'onSubmit',
                  action: 'individual-upload-completed',
                  userId: userId,
                  fileIndex: index + 1,
                  fileName: file.name,
                  fileId: fileId,
                  downloadUrl: url,
                  timestamp: new Date().toISOString()
                });

                return {
                    type: file.type.startsWith('image/') ? 'image' : 'video',
                    url: url,
                    dataAiHint: file.type.startsWith('image/') ? 'user uploaded' : undefined,
                };
            })
        ) : [];
        
        // Log all media uploads completed
        if (includeMedia && mediaItems.length > 0) {
        logInfo('All media files uploaded successfully', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'media-upload-completed',
          userId: userId,
          totalFiles: mediaFiles.length,
          mediaItems: mediaItems.map(item => ({
            type: item.type,
            hasUrl: !!item.url
          })),
          timestamp: new Date().toISOString()
        });
        }
        
        let audioUrl = '';
        if (audioBlob) {
            // Log audio upload start
            logInfo('Starting audio upload', {
              component: 'NewMemoryForm',
              function: 'onSubmit',
              action: 'audio-upload-start',
              userId: userId,
              audioBlobSize: audioBlob.size,
              audioType: audioBlob.type,
              timestamp: new Date().toISOString()
            });

            const audioId = uuidv4();
            audioUrl = await uploadFile(new File([audioBlob], `${audioId}.webm`, { type: 'audio/webm' }), `memories/${userId}/audio/${audioId}.webm`);
            
            // Log audio upload completion
            logInfo('Audio upload completed', {
              component: 'NewMemoryForm',
              function: 'onSubmit',
              action: 'audio-upload-completed',
              userId: userId,
              audioId: audioId,
              audioUrl: audioUrl,
              timestamp: new Date().toISOString()
            });
        }

        // Log database save preparation
        logInfo('Preparing to save memory to database', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'database-save-prep',
          userId: userId,
          memoryData: {
            title: data.title,
            summary: data.summary,
            date: data.date.toISOString(),
            location: data.location,
            tags: data.tags,
            mediaCount: includeMedia ? mediaItems.length : 0,
            hasAudio: !!audioUrl,
            latitude,
            longitude,
            sentiment
          },
          timestamp: new Date().toISOString()
        });

        const memoryDoc = await addDoc(collection(db, 'memories'), {
            ...data,
            userId,
            media: mediaItems,
            audioUrl,
            createdAt: serverTimestamp(),
            createdBy: userId,
            clientCreatedAt: new Date().toISOString(), // Client-side timestamp
            latitude: latitude,
            longitude: longitude,
            sentiment: sentiment,
        });

        // Log successful database save
        logInfo('Memory saved to database successfully', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'database-save-success',
          userId: userId,
          memoryId: memoryDoc.id,
          memoryData: {
            title: data.title,
            mediaCount: includeMedia ? mediaItems.length : 0,
            hasAudio: !!audioUrl
          },
          timestamp: new Date().toISOString()
        });

        toast({
            title: 'Memory Created!',
            description: 'Your new memory has been saved.',
        });
        
        // Log navigation with page context
        logInfo('Navigating to dashboard after successful memory creation', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'navigation-success',
          userId: userId,
          memoryId: memoryDoc.id,
          pageContext: {
            currentPath: pageInfo.currentPath,
            sessionId: pageInfo.sessionId
          },
          fromPath: '/memories/new',
          toPath: '/',
          timestamp: new Date().toISOString()
        });

        // Log page event for navigation
        logPageEvent('Memory Creation Success - Navigating to Dashboard', {
          userId: userId,
          memoryId: memoryDoc.id,
          fromPath: pageInfo.currentPath,
          toPath: '/',
          mediaCount: includeMedia ? mediaItems.length : 0,
          hasAudio: !!audioUrl
        });
        
        router.push('/');

    } catch (error) {
        // Log comprehensive error information
        logError('Memory creation failed', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'creation-failed',
          userId: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          context: {
            mediaFileCount: includeMedia ? mediaFiles.length : 0,
            hasAudioBlob: !!audioBlob,
            uploadProgress: uploadProgress,
            formData: {
              title: data.title,
              summary: data.summary,
              date: data.date.toISOString(),
              location: data.location,
              tags: data.tags
            }
          },
          timestamp: new Date().toISOString()
        }, error instanceof Error ? error : undefined);

        console.error("Error creating memory:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to create memory',
            description: 'There was an error saving your memory. Please ensure all files uploaded successfully and try again.',
        });
    } finally {
        // Log upload completion (success or failure)
        logInfo('Memory creation process completed', {
          component: 'NewMemoryForm',
          function: 'onSubmit',
          action: 'process-completed',
          userId: userId,
          uploadProgress: uploadProgress,
          timestamp: new Date().toISOString()
        });

        setIsUploading(false);
    }
  };

  const processAudioWithAI = async (audioBlob: Blob) => {
    setIsProcessingAI(true);
    
    try {
      const audioDataUri = await blobToDataUri(audioBlob);
      
      // Call transcribeAudio with proper error handling
      logAIServiceCall('TranscriptionService', 'transcribe', { audioDataUriLength: audioDataUri.length }, { userId });
      
      const transcriptionResult = await transcribeAudio({ audioDataUri });
      
      // Validate transcription result using utility function
      if (!validateTranscriptionResponse(transcriptionResult, { userId, audioDataUriLength: audioDataUri.length })) {
        throw new Error('Transcription service returned invalid response');
      }
      
      const { transcription } = transcriptionResult;
      
      // Log transcription success
      logInfo('Audio transcription completed', {
        component: 'NewMemoryForm',
        function: 'processAudioWithAI',
        action: 'transcription-completed',
        userId: userId,
        transcriptionLength: transcription.length
      });

      form.setValue('transcription', transcription);

      // Call AI services with proper error handling
      logAIServiceCall('TitleSummaryService', 'generate', { transcriptionLength: transcription.length }, { userId });
      logAIServiceCall('SentimentService', 'analyze', { transcriptionLength: transcription.length }, { userId });
      
      const [titleSummaryResult, sentimentResult] = await Promise.all([
        generateMemoryTitleSummaryTags({ transcription }),
        analyzeSentiment({ transcription })
      ]);
      
      // Validate results using utility functions
      if (!validateTitleSummaryResponse(titleSummaryResult, { userId, transcriptionLength: transcription.length })) {
        throw new Error('Title/summary generation service returned invalid response');
      }
      
      if (!validateSentimentResponse(sentimentResult, { userId, transcriptionLength: transcription.length })) {
        throw new Error('Sentiment analysis service returned invalid response');
      }
      
      const { title, summary, tags } = titleSummaryResult;
      const { sentiment } = sentimentResult;
      
      // Log AI generation success
      logInfo('AI content generation completed', {
        component: 'NewMemoryForm',
        function: 'processAudioWithAI',
        action: 'ai-generation-completed',
        userId: userId,
        generatedTitle: title,
        generatedSummary: summary,
        generatedTags: tags,
        generatedSentiment: sentiment
      });
      
      form.setValue('title', title);
      form.setValue('summary', summary);
      form.setValue('tags', tags);
      setSentiment(sentiment);

    } catch (error) {
      // Log AI processing error with detailed context
      logError('AI processing failed', {
        component: 'NewMemoryForm',
        function: 'processAudioWithAI',
        action: 'ai-processing-failed',
        userId: userId,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        context: {
          audioBlobSize: audioBlob.size,
          audioBlobType: audioBlob.type
        }
      }, error instanceof Error ? error : undefined);

      console.error("AI Processing Error:", error);
      
      // Provide more specific error messages based on the error type
      let errorTitle = 'AI Processing Failed';
      let errorDescription = 'Could not process audio. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Transcription service')) {
          errorTitle = 'Transcription Failed';
          errorDescription = 'Could not convert audio to text. Please try again.';
        } else if (error.message.includes('Title/summary generation')) {
          errorTitle = 'Content Generation Failed';
          errorDescription = 'Could not generate title and summary. Please try again.';
        } else if (error.message.includes('Sentiment analysis')) {
          errorTitle = 'Sentiment Analysis Failed';
          errorDescription = 'Could not analyze audio sentiment. Please try again.';
        }
      }
      
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorDescription,
      });
      
      // Log fallback behavior
      logInfo('AI processing failed, audio recording still available', {
        component: 'NewMemoryForm',
        function: 'processAudioWithAI',
        action: 'fallback-available',
        userId: userId,
        audioBlobSize: audioBlob.size,
        audioBlobType: audioBlob.type
      });
      
      // Create fallback values using utility function
      const fallbackValues = createFallbackValues(audioBlob);
      
      form.setValue('title', fallbackValues.title);
      form.setValue('summary', fallbackValues.summary);
      form.setValue('tags', fallbackValues.tags);
      setSentiment(fallbackValues.sentiment as Memory['sentiment']);
      
      // Log fallback values set
      logInfo('Fallback values set for failed AI processing', {
        component: 'NewMemoryForm',
        function: 'processAudioWithAI',
        action: 'fallback-values-set',
        userId: userId,
        fallbackValues
      });
      
    } finally {
      setIsProcessingAI(false);
      
      // Log AI processing completion
      logInfo('AI processing completed', {
        component: 'NewMemoryForm',
        function: 'processAudioWithAI',
        action: 'ai-processing-completed',
        userId: userId
      });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-24">
        
        {/* Audio Recording - Primary Focus */}
        <Card className="clean-card border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
                <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-white" />
                </div>
                Record Your Memory
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="text-xs text-muted-foreground space-y-2">
                    <div className="p-2 bg-muted/50 rounded border border-border/30">
                      <p className="font-medium text-foreground mb-1">Audio Recording Quality:</p>
                      <p>• <strong>Format:</strong> WebM (VP8 + Opus)</p>
                      <p>• <strong>Sample Rate:</strong> 44.1 kHz</p>
                      <p>• <strong>Bitrate:</strong> 128 kbps (optimized for speech)</p>
                      <p>• <strong>Duration Limit:</strong> 300 seconds (5 minutes)</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded border border-border/30">
                      <p className="font-medium text-foreground mb-1">Compression Benefits:</p>
                      <p>• <strong>File Size:</strong> ~1-2 MB per minute of audio</p>
                      <p>• <strong>Upload Speed:</strong> Optimized for mobile networks</p>
                      <p>• <strong>Storage:</strong> Efficient cloud storage usage</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded border border-border/30">
                      <p className="font-medium text-foreground mb-1">AI Processing:</p>
                      <p>• <strong>Transcription:</strong> High-accuracy speech-to-text</p>
                      <p>• <strong>Content Generation:</strong> AI-powered title, summary, and tags</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Record an audio note (up to 300s). We'll transcribe it and generate content for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Audio Recording Interface */}
            <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-3">
                  Tap the microphone to start recording. You can pause and resume as needed.
                </p>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center gap-4">
                {/* Record/Stop Button */}
                <Button 
                  type="button" 
                  onClick={isRecording ? stopRecording : startRecording} 
                  className={`w-24 h-24 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} shadow-lg transition-all duration-300 ${isRecording ? 'scale-110' : 'hover:scale-105'}`} 
                  disabled={isProcessingAI}
                >
                  {isRecording ? (
                    <Square className="w-9 h-9 text-white" />
                  ) : (
                    <Mic className="w-9 h-9 text-white" />
                  )}
                </Button>

                {/* Pause/Resume Button - Only show when recording */}
                {isRecording && (
                  <Button
                    type="button"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 rounded-full border-2 border-slate-300 hover:bg-slate-50"
                    disabled={isProcessingAI}
                  >
                    {isPaused ? (
                      <Play className="w-8 h-8" />
                    ) : (
                      <Pause className="w-8 h-8" />
                    )}
                  </Button>
                )}
              </div>

              {/* Recording Status and Timer */}
              {isRecording && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="text-lg font-mono font-semibold text-foreground">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="text-sm">
                    {isPaused ? 'Recording Paused' : 'Recording...'}
                  </div>
                  
                  {/* Audio Waves - Only animate when actively recording (not paused) */}
                  {!isPaused && (
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-destructive rounded-full animate-pulse" 
                          style={{ 
                            height: `${20 + Math.random() * 30}px`, 
                            animationDelay: `${i * 0.1}s` 
                          }} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Processing Indicator */}
              {isProcessingAI && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm">Processing audio with AI...</p>
                </div>
              )}

              {/* Audio Preview */}
              {audioBlob && !isRecording && !isProcessingAI && (
                <div className="w-full max-w-md">
                  <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-12" />
                </div>
              )}
            </div>

            {/* Transcription Field */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="transcription">
                <AccordionTrigger>
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="w-5 h-5"/> 
                    Transcription
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="transcription"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Your transcription will appear here..." 
                            {...field} 
                            rows={5} 
                            disabled={isProcessingAI} 
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Media Upload - Optional and right after audio */}
        <Card className="clean-card border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                        <Upload className="w-3.5 h-3.5 text-white" />
                        </div>
                        Media
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">
                        Add photos or videos to enhance your memory
                    </CardDescription>
                </div>
                                 <div className="flex items-center gap-2 pl-4">
                     <Switch
                       checked={includeMedia}
                       onCheckedChange={setIncludeMedia}
                       className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-slate-200 border-0 h-5 w-10 rounded-xl"
                     />
                 </div>
            </div>
          </CardHeader>
          
          {includeMedia && (
          <CardContent>
            <div className="space-y-4">
                {/* Media Grid */}
              <div className="space-y-3">
                {/* File Count and Validation Info */}
                {mediaFiles.length > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{mediaFiles.length} file(s) selected</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {mediaFiles.filter(f => f.type.startsWith('image/')).length} image(s)
                      </span>
                      {mediaFiles.filter(f => f.type.startsWith('video/')).length > 0 && (
                        <span className="text-xs">
                          {mediaFiles.filter(f => f.type.startsWith('video/')).length} video(s)
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to remove all media files?')) {
                            clearAllMedia();
                          }
                        }}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}

                  {/* Compression Progress */}
                  {isCompressing && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="font-medium text-blue-800">Compressing files...</span>
                        <span className="text-sm text-blue-600">{Math.round(compressionProgress)}%</span>
                      </div>
                      <Progress value={compressionProgress} className="h-2" />
                      <p className="text-xs text-blue-600 mt-2">
                        This will reduce file sizes for faster uploads
                      </p>
                  </div>
                )}

                {/* Media Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {mediaFiles.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border/40 bg-background">
                      {file.type.startsWith('image/') ? (
                        <Image 
                          src={URL.createObjectURL(file)} 
                          alt={file.name} 
                          layout="fill" 
                          objectFit="cover"
                          className="transition-transform hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                      )}
                      
                      {/* File Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs">
                        <div className="truncate font-medium">{file.name}</div>
                        <div className="text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                            {file.size < (file as any).originalSize && (
                              <span className="ml-1 text-green-400">
                                ↓{Math.round(((file as any).originalSize - file.size) / (file as any).originalSize * 100)}%
                              </span>
                            )}
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-lg hover:scale-110 transition-transform"
                        onClick={() => removeMediaFile(i)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                    {/* Add Media Button */}
                  {mediaFiles.length < 3 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                      <Upload className="w-8 h-8 text-primary/60 group-hover:text-primary/80 transition-colors" />
                      <span className="text-xs mt-1 text-primary/60 group-hover:text-primary/80 font-medium transition-colors">
                        Add Media
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {3 - mediaFiles.length} remaining
                      </span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*" 
                        className="sr-only" 
                        onChange={handleFileChange}
                        capture="environment"
                      />
                    </label>
                  )}
                </div>

                  {/* Compression Settings */}
                  <div className="mt-4">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="media-compression" className="border border-border/50 rounded-lg">
                        <AccordionTrigger className="px-3 py-2 hover:no-underline">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Badge variant="secondary" className="text-xs">
                              Auto-optimized
                            </Badge>
                            <span>File Compression Settings</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <div className="space-y-3">
                            {/* Compression Quality Selector */}
                            <div>
                              <label className="text-xs font-medium text-foreground mb-2 block">Compression Quality:</label>
                              <div className="flex gap-2">
                                {([
                                  { value: 0.9, label: 'High' },
                                  { value: 0.8, label: 'Medium' },
                                  { value: 0.7, label: 'Low' }
                                ] as const).map((quality) => (
                                  <Button
                                    key={quality.value}
                                    type="button"
                                    variant={Math.abs(compressionQuality - quality.value) < 0.1 ? "default" : "outline"}
                                    size="sm"
                                    className="text-xs h-7 px-2"
                                    onClick={() => setCompressionQuality(quality.value)}
                                  >
                                    {quality.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>• <strong>High:</strong> Minimal compression, best quality (20-40% size reduction)</p>
                              <p>• <strong>Medium:</strong> Balanced compression (40-70% size reduction)</p>
                              <p>• <strong>Low:</strong> Maximum compression (60-80% size reduction)</p>
                              <p>• Videos: Optimized for web viewing with reduced bitrate</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                </div>

                {/* File Type and Size Guidelines */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Supported: JPG, PNG, GIF, MP4, MOV (max 50MB per file)</p>
                  <p>• You can upload up to 3 images or 1 video</p>
                  <p>• Images and videos cannot be mixed</p>
                </div>
              </div>
            </div>
          </CardContent>
          )}
        </Card>

        {/* AI Generated Content */}
        <Card className="clean-card border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5 text-white" />
              </div>
              AI Generated Content
            </CardTitle>
                <CardDescription className="text-sm text-slate-600">Review and edit the AI-generated title, summary, and tags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <FormLabel className="flex items-center gap-2 font-medium">
                    <Tag className="w-5 h-5"/> 
                    Tags
                  </FormLabel>
                      <FormControl>
                          <div className="flex items-center gap-1.5 border rounded-md p-2 flex-wrap">
                              {tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs py-0.5 pl-2 pr-1 h-6 flex items-center">
                                  <span>{tag}</span>
                                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 flex items-center justify-center">
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </Badge>
                              ))}
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    onBlur={handleTagBlur}
                                    placeholder="Add a tag and press Enter..."
                                    className="bg-transparent outline-none flex-1 min-w-[150px] p-1 text-sm"
                                />
                          </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
        </Card>

        {/* Details */}
        <Card className="clean-card border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-3.5 h-3.5 text-white" />
              </div>
              Details
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">Add the date and location of your memory.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="flex items-center gap-2 font-medium">
                    <CalendarIcon className="w-5 h-5"/> 
                    Date
                  </FormLabel>
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
                    <FormLabel className="flex items-center gap-2 font-medium">
                      <MapPin className="w-5 h-5"/> 
                      Location
                    </FormLabel>
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

        {/* Submit Button - Mobile Optimized */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:bg-transparent sm:border-t-0 sm:shadow-none sm:p-0 sm:mt-6">
          <Button 
            type="submit" 
            disabled={isSubmitting || isProcessingAI} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 font-medium mb-16 sm:mb-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Memory...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Memory
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
