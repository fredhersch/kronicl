'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { BookOpen, Heart } from 'lucide-react';
import Link from 'next/link';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.022,44,30.034,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export function LoginForm() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4">
      <Card className="clean-card w-full max-w-md">
        <CardHeader className="text-center space-y-6">
          {/* Logo and Brand */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl shadow-sm flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                <Heart className="w-2.5 h-2.5 text-white fill-current" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              Welcome back to Memory Lane
            </CardTitle>
            <CardDescription className="text-slate-600">
              Sign in to continue capturing and cherishing your memories
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sign In Button */}
          <Button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 h-12 text-base font-medium flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Sign up
            </Link>
          </div>
        </CardContent>

        <CardFooter>
          <p className="text-xs text-center text-slate-500 w-full">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}