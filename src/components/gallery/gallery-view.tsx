'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { fetchGalleryItems, type GalleryItem } from '@/lib/firebase-gallery';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/user-profile-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Images,
  Video,
  Plus,
  Loader2,
  Check,
  X,
  Calendar,
  FileImage,
  Home,
  Settings,
  LogOut,
  User,
  BookOpen,
  Heart
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function GalleryView() {
  const { user, storage, db, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<GalleryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [galleryFolder, setGalleryFolder] = useState<string>('photos-demo');

  // Load user profile to get gallery folder setting
  useEffect(() => {
    async function loadUserProfile() {
      if (!user?.uid || !db) return;
      
      try {
        const docRef = doc(db, 'user-profiles', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          const userGalleryFolder = profile.settings?.galleryFolder || 'photos-demo';
          setGalleryFolder(userGalleryFolder);
          console.log('User gallery folder loaded:', userGalleryFolder);
        } else {
          console.log('No user profile found, using default gallery folder');
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Continue with default folder
      }
    }
    
    loadUserProfile();
  }, [user?.uid, db]);

  // Fetch gallery items when user and gallery folder are ready
  useEffect(() => {
    async function loadGalleryItems() {
      if (!user?.uid || !storage || !galleryFolder) {
        console.log('Gallery load skipped:', { 
          hasUser: !!user?.uid, 
          hasStorage: !!storage, 
          hasGalleryFolder: !!galleryFolder 
        });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Loading gallery items for user:', user.uid, 'from folder:', galleryFolder);
        const items = await fetchGalleryItems(storage, user.uid, galleryFolder);
        console.log('Gallery items loaded:', items.length);
        setGalleryItems(items);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load gallery. Please try again.';
        console.error('Gallery loading error:', err);
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }

    loadGalleryItems();
  }, [user?.uid, storage, galleryFolder, toast]);

  // Handle create memory with selected items
  const handleCreateMemory = useCallback(() => {
    if (selectedItems.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one item to create a memory',
        variant: 'destructive'
      });
      return;
    }

    // Navigate to new memory form with selected items as URL params
    const selectedUrls = selectedItems.map(item => item.url);
    const urlParams = new URLSearchParams({
      preselectedMedia: JSON.stringify(selectedUrls)
    });
    
    router.push(`/memories/new?${urlParams.toString()}`);
  }, [selectedItems, toast, router]);

  // Intercept "New" button clicks when items are selected
  useEffect(() => {
    if (selectedItems.length === 0) return;

    const handleNewButtonClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const newButton = target.closest('a[href="/memories/new"]');
      
      if (newButton) {
        e.preventDefault();
        handleCreateMemory();
      }
    };

    // Add event listener to capture clicks on the "New" button
    document.addEventListener('click', handleNewButtonClick, true);
    
    return () => {
      document.removeEventListener('click', handleNewButtonClick, true);
    };
  }, [selectedItems.length, handleCreateMemory]);

  // Handle item selection
  const handleItemSelect = (item: GalleryItem) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    } else {
      // Check selection limits
      const currentImages = selectedItems.filter(item => item.type === 'image').length;
      const currentVideos = selectedItems.filter(item => item.type === 'video').length;
      
      if (item.type === 'image') {
        if (currentVideos > 0) {
          toast({
            title: 'Selection Error',
            description: 'Cannot mix images and videos in the same memory',
            variant: 'destructive'
          });
          return;
        }
        if (currentImages >= 3) {
          toast({
            title: 'Selection Limit',
            description: 'You can select up to 3 images maximum',
            variant: 'destructive'
          });
          return;
        }
      } else if (item.type === 'video') {
        if (currentImages > 0) {
          toast({
            title: 'Selection Error',
            description: 'Cannot mix images and videos in the same memory',
            variant: 'destructive'
          });
          return;
        }
        if (currentVideos >= 1) {
          toast({
            title: 'Selection Limit',
            description: 'You can select only 1 video maximum',
            variant: 'destructive'
          });
          return;
        }
      }
      
      // Add to selection
      setSelectedItems(prev => [...prev, item]);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading your gallery...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <X className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={async () => {
                    if (!storage || !user?.uid) {
                      console.log('Test failed: missing storage or user', { storage: !!storage, user: !!user?.uid });
                      return;
                    }
                    try {
                      console.log('Testing Firebase connection to folder:', galleryFolder);
                      const { ref, listAll } = await import('firebase/storage');
                      const testRef = ref(storage, galleryFolder);
                      console.log('Created reference to', galleryFolder);
                      const result = await listAll(testRef);
                      console.log('ListAll result:', { items: result.items.length, prefixes: result.prefixes.length });
                      alert(`Connection test successful! Found ${result.items.length} items in ${galleryFolder} folder.`);
                    } catch (err) {
                      console.error('Connection test failed:', err);
                      alert(`Connection test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    }
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Test Connection
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center h-16 px-4">
          {/* Logo and Title - Left */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-sm flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <Heart className="w-2 h-2 text-white" />
                </div>
              </div>
              <h1 className="hidden sm:block text-xl font-semibold text-slate-900">Memory Lane</h1>
            </Link>
            
            {/* Gallery Info */}
            <div className="hidden sm:block">
              <div className="w-px h-6 bg-slate-300 mx-3"></div>
              <div className="flex items-center gap-2">
                <Images className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">Gallery</span>
                <code className="bg-slate-100 px-1 rounded text-xs text-slate-600">{galleryFolder}</code>
              </div>
            </div>
          </div>

          {/* Center - Gallery Status (Mobile) */}
          <div className="flex-1 flex justify-center sm:hidden">
            <div className="flex items-center gap-2">
              <Images className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Gallery</span>
            </div>
          </div>

          {/* Right - Profile Menu */}
          <div className="flex items-center gap-2">
            {/* Selection Info */}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                  {selectedItems.length} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border-2 border-indigo-200">
                    <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
                    <AvatarFallback className="bg-indigo-600 text-white text-sm">
                      {user?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
                    <AvatarFallback className="text-xs">
                      {user?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.displayName || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <Link href="/">
                  <DropdownMenuItem>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </DropdownMenuItem>
                </Link>

                <Link href="/profile">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Gallery Stats Bar */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {galleryItems.length} item{galleryItems.length !== 1 ? 's' : ''} from{' '}
              <code className="bg-white px-1 rounded text-xs border">{galleryFolder}</code>
            </p>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-indigo-600 font-medium">
                  {selectedItems.length} selected for memory
                </p>
                <span className="hidden sm:inline text-xs text-slate-500">
                  → Tap "New" to create
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {galleryItems.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileImage className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No items available</h3>
              <p className="text-slate-600 mb-4">
                Photos will appear here once they're uploaded to the{' '}
                <code className="bg-slate-100 px-1 rounded text-xs">{galleryFolder}</code> folder.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {galleryItems.map((item) => {
              const isSelected = selectedItems.some(selected => selected.id === item.id);
              
              return (
                <Card 
                  key={item.id} 
                  className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-indigo-500 shadow-lg' 
                      : 'hover:ring-1 hover:ring-slate-300'
                  }`}
                  onClick={() => handleItemSelect(item)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      {item.type === 'image' ? (
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                      )}
                      
                      {/* Selection indicator */}
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white scale-110' 
                          : 'bg-black/50 text-white/80'
                      }`}>
                        {isSelected ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-3 h-3 border-2 border-white rounded-full" />
                        )}
                      </div>
                      
                      {/* Type indicator */}
                      <div className="absolute bottom-2 left-2">
                        <Badge 
                          variant="secondary" 
                          className="bg-black/70 text-white text-xs py-0.5 px-1"
                        >
                          {item.type === 'video' ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <FileImage className="w-3 h-3" />
                          )}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Item info */}
                    <div className="p-2">
                      <p className="text-xs text-slate-600 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">
                          {item.lastModified.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}
