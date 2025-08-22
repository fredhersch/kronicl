'use client';
import Link from 'next/link';
import { Home, Plus, Images, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function BottomNavigation() {
  const pathname = usePathname();
  const isGalleryPage = pathname === '/gallery';

  // Don't show bottom nav on auth pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg sm:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        <Link href="/" className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors">
          <Home className={`w-6 h-6 ${pathname === '/' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className={`text-xs ${pathname === '/' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
            Home
          </span>
        </Link>
        
        <Link href="/gallery" className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors">
          <Images className={`w-6 h-6 ${pathname === '/gallery' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className={`text-xs ${pathname === '/gallery' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
            Gallery
          </span>
        </Link>
        
        <Link href="/welcome" className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors">
          <Sparkles className={`w-6 h-6 ${pathname === '/welcome' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className={`text-xs ${pathname === '/welcome' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
            Welcome
          </span>
        </Link>
        
        <Link href="/memories/new" className="flex flex-col items-center p-2 rounded-xl transition-all duration-300 hover:scale-105 -translate-y-7">
          <div className="relative">
            <div className={`w-16 h-16 bg-gradient-to-br rounded-full flex items-center justify-center shadow-xl border-4 border-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
              isGalleryPage 
                ? 'from-green-500 to-green-700' 
                : 'from-indigo-500 to-indigo-700'
            }`}>
              <Plus className="w-8 h-8 text-white" />
            </div>
            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
              isGalleryPage 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500 animate-pulse'
            }`}>
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>
          <span className={`text-sm font-bold mt-4 ${
            isGalleryPage ? 'text-green-600' : 'text-indigo-600'
          }`}>
            {isGalleryPage ? 'Create' : 'New'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
