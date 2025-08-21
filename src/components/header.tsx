'use client';
import Link from 'next/link';
import { PlusCircle, Search, Home, User, Plus, LogOut, Settings, BookOpen, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header({ onSearch }: { onSearch: (query: string) => void }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Top Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center h-16 px-4">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-sm flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                <Heart className="w-2 h-2 text-white fill-current" />
              </div>
            </div>
            <h1 className="hidden sm:block text-lg font-semibold text-slate-900">Memory Lane</h1>
          </Link>
          
          {/* Search Bar - Center on mobile, right on desktop */}
          <div className="flex-1 flex justify-center sm:justify-end sm:mr-4">
            <div className="relative w-full max-w-xs sm:max-w-sm mx-2 sm:mx-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search memories..."
                className="w-full sm:w-64 pl-10 pr-4 h-10 rounded-lg bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
          
          {/* User Avatar - Right */}
          <div className="flex-shrink-0">
            {/* User Avatar with Logout Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative w-9 h-9 rounded-full p-0 hover:bg-slate-100">
                  <Avatar className="w-9 h-9 border-2 border-indigo-200">
                    <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
                    <AvatarFallback className="bg-indigo-600 text-white font-medium">
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

              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Mobile App Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg mobile-bottom-nav">
        <div className="flex items-center justify-around h-16 px-2">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors">
            <Home className={`w-6 h-6 ${pathname === '/' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className={`text-xs ${pathname === '/' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
              Home
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
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-xl border-4 border-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white text-xs font-bold">+</span>
              </div>
            </div>
            <span className="text-sm text-indigo-600 font-bold mt-4">New</span>
          </Link>
        </div>
      </nav>
    </>
  );
}