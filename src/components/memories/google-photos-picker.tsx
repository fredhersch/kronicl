'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getGooglePhotos } from '@/lib/google-photos';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { CheckCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface GooglePhotosPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (files: File[]) => void;
}

interface MediaItem {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
}

export function GooglePhotosPicker({ open, onOpenChange, onSelect }: GooglePhotosPickerProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const fetchPhotos = async () => {
        setIsLoading(true);
        try {
          console.log('🔄 Fetching Google Photos...');
          const items = await getGooglePhotos();
          console.log(`📸 Received ${items.length} items from Google Photos API`);
          setMediaItems(items);
          
          if (items.length === 0) {
            console.log('⚠️ No photos returned from API - this might indicate an authentication or permission issue');
          }
        } catch (error) {
          console.error('❌ Failed to fetch Google Photos:', error);
          toast({
            variant: 'destructive',
            title: 'Failed to fetch photos',
            description: 'Could not load your Google Photos library. Please check the console for details.',
          });
          onOpenChange(false);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPhotos();
    } else {
        // Reset state when closing
        setMediaItems([]);
        setSelectedItems([]);
    }
  }, [open, onOpenChange, toast]);

  const toggleSelection = (item: MediaItem) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleConfirm = async () => {
    if (selectedItems.length === 0) {
      onOpenChange(false);
      return;
    }
    
    // This is a simplified approach. In a real-world scenario, you might need to handle CORS and authentication more robustly.
    // We are fetching the image from its URL and converting it into a Blob, then a File object.
    const filePromises = selectedItems.map(async (item) => {
        const response = await fetch(item.baseUrl);
        const blob = await response.blob();
        return new File([blob], item.filename, { type: item.mimeType });
    });

    try {
        const files = await Promise.all(filePromises);
        onSelect(files);
        onOpenChange(false);
    } catch(error) {
        console.error("Error converting selected photos to files:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to add photos',
            description: 'There was an issue adding your selected photos. Please try again.',
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Google Photos</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-1">
            {isLoading ? (
              <div className="col-span-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading your photos...</p>
              </div>
            ) : mediaItems.length > 0 ? (
              mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square cursor-pointer group"
                  onClick={() => toggleSelection(item)}
                >
                  <Image
                    src={item.baseUrl}
                    alt={item.filename}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md transition-all duration-200"
                  />
                  {selectedItems.some((i) => i.id === item.id) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  )}
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-200" />
                </div>
              ))
            ) : (
                 <div className="col-span-full h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                    <p>No photos found in your library.</p>
                    <p className="text-xs mt-2">This could mean:</p>
                    <ul className="text-xs mt-1 space-y-1 text-left max-w-sm mx-auto">
                      <li>• You haven't connected your Google Photos account yet</li>
                      <li>• Your Google Photos account is empty</li>
                      <li>• There's an authentication issue</li>
                    </ul>
                    <p className="text-xs mt-2 text-blue-600">
                      💡 Check the browser console for detailed error information
                    </p>
                 </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
             <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={selectedItems.length === 0}>
            Add {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
