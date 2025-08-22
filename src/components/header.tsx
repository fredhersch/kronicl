'use client';
import Link from 'next/link';
import { Search, User, LogOut, BookOpen, Heart, Settings, Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
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
          
          {/* Hamburger Menu - Hidden on mobile, visible on desktop */}
          <div className="hidden md:block ml-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-3 hover:bg-slate-100">
                  <Menu className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <Link href="/">
                  <DropdownMenuItem>
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                </Link>
                
                <Link href="/gallery">
                  <DropdownMenuItem>
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Gallery</span>
                  </DropdownMenuItem>
                </Link>
                
                <Link href="/memories/new">
                  <DropdownMenuItem>
                    <span className="mr-2 h-4 w-4 text-lg font-bold">+</span>
                    <span>New Memory</span>
                  </DropdownMenuItem>
                </Link>
                
                <DropdownMenuSeparator />
                
                <Link href="/profile">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                </Link>
                
                <Link href="/welcome">
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Welcome Screen</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
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

              <Link href="/profile">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
              </Link>

              <Link href="/welcome">
                <DropdownMenuItem>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>Welcome Screen</span>
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
      </header>


    </>
  );
}