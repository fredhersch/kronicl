
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, ArrowLeft, Save, Images, Folder } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateUserProfileClient, type UserProfile } from '@/lib/user-profile-client';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, signOut, db } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [galleryFolder, setGalleryFolder] = useState('photos-demo');
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Check if user should be redirected to login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load user profile data
  useEffect(() => {
    async function loadUserProfile() {
      if (!user?.uid || !db) return;
      
      try {
        setProfileLoading(true);
        const docRef = doc(db, 'user-profiles', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          setUserProfile(profile);
          setGalleryFolder(profile.settings?.galleryFolder || 'photos-demo');
        } else {
          // Set default if no profile exists
          setGalleryFolder('photos-demo');
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile settings',
          variant: 'destructive'
        });
      } finally {
        setProfileLoading(false);
      }
    }
    
    loadUserProfile();
  }, [user?.uid, db, toast]);

  // Save gallery folder setting
  async function handleSaveSettings() {
    if (!user?.uid) return;
    
    try {
      setIsSaving(true);
      
      const updates: Partial<UserProfile> = {
        settings: {
          ...userProfile?.settings,
          privacy: userProfile?.settings?.privacy || 'private',
          autoBackup: userProfile?.settings?.autoBackup || false,
          storageQuota: userProfile?.settings?.storageQuota || 1000,
          galleryFolder: galleryFolder.trim()
        }
      };
      
      await updateUserProfileClient(user.uid, updates);
      
      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        settings: {
          ...prev.settings,
          galleryFolder: galleryFolder.trim()
        }
      } : null);
      
      toast({
        title: 'Settings Saved',
        description: 'Your gallery folder has been updated successfully'
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (loading || !user) {
    return (
        <div className="flex flex-col min-h-screen bg-white">
             <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm sm:px-6 md:px-8">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-32 ml-4" />
            </header>
            <main className="flex flex-1 items-center justify-center p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="text-center">
                        <Skeleton className="h-8 w-48 mx-auto" />
                        <Skeleton className="h-4 w-64 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <div className="flex flex-col items-center gap-4">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="text-center">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-40 mt-2" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="flex justify-end">
                            <Skeleton className="h-10 w-24" />
                         </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
       <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm sm:px-6 md:px-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="ml-4 text-xl font-headline">Profile Settings</h1>
      </header>
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Info Card */}
          <Card>
            <CardHeader className="text-center border-b">
              <CardTitle className="text-3xl font-headline">Profile</CardTitle>
              <CardDescription>Manage your account settings.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-indigo-200">
                  <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
                  <AvatarFallback className="text-4xl bg-indigo-600 text-white">
                    {user.displayName ? user.displayName.charAt(0) : <User />}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold">{user.displayName || 'Anonymous User'}</h2>
                  <p className="text-slate-600">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images className="w-5 h-5 text-indigo-600" />
                Gallery Settings
              </CardTitle>
              <CardDescription>
                Configure where your gallery photos are stored in Firebase Storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gallery-folder" className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Gallery Folder Path
                </Label>
                <Input
                  id="gallery-folder"
                  value={galleryFolder}
                  onChange={(e) => setGalleryFolder(e.target.value)}
                  placeholder="e.g., photos-demo, gallery/my-photos"
                  className="font-mono text-sm"
                  disabled={profileLoading}
                />
                <p className="text-xs text-slate-600">
                  This is the path in Firebase Storage where your gallery photos are located.
                  Default: <code className="bg-slate-100 px-1 rounded">photos-demo</code>
                </p>
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={isSaving || profileLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end">
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
