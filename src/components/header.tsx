'use client';
import Link from 'next/link';
import { PlusCircle, Search, Home, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from './icons/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';

export function Header({ onSearch }: { onSearch: (query: string) => void }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Top Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 flex items-center mobile-header px-4 border-b bg-background/95 backdrop-blur-xl mobile-safe-top">
        <div className="flex items-center gap-3 flex-1">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">MemoryLane</h1>
          </Link>
        </div>
        
        {/* Search Bar - Mobile Optimized */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search memories..."
              className="w-full pl-10 pr-4 h-10 rounded-full bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* User Avatar */}
        <div className="flex items-center">
          <Link href="/profile">
            <Avatar className="w-9 h-9 border-2 border-primary/20">
              <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Bottom Navigation - Mobile App Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t mobile-safe-bottom">
        <div className="flex items-center justify-around mobile-bottom-nav px-2">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors">
            <Home className={`w-6 h-6 ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${pathname === '/' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Home
            </span>
          </Link>
          
          <Link href="/memories/new" className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xs text-primary font-medium">New</span>
          </Link>
          
          <Link href="/profile" className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors">
            <User className={`w-6 h-6 ${pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${pathname === '/profile' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
