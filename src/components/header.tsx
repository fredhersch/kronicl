'use client';
import Link from 'next/link';
import { PlusCircle, Search, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from './icons/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

export function Header({ onSearch }: { onSearch: (query: string) => void }) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex items-center h-16 px-4 border-b shrink-0 bg-background/90 backdrop-blur-sm sm:px-6 md:px-8">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold sm:text-base mr-4">
        <Logo className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-headline hidden md:block">MemoryLane</h1>
        <span className="sr-only">MemoryLane</span>
      </Link>
      <div className="flex-1 w-full">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search memories by title, tag, or text..."
            className="w-full pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-card"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <Link href="/memories/new">
          <Button>
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline ml-2">New Memory</span>
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative w-10 h-10 rounded-full">
              <Avatar>
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? 'User'} />
                <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>{user?.displayName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
                <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
                </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
