'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { BookOpen, Heart, ArrowRight } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.022,44,30.034,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

export function WelcomeFlow() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [isAnimated, setIsAnimated] = useState(false);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'signin'>('welcome');
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(10);
  const [showAutoRedirect, setShowAutoRedirect] = useState(false);
  
  // Check if this is a new user visit (from sign-up) vs manual navigation
  const isFromSignUp = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('fromSignUp') === 'true';

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only show auto-redirect for new users (from sign-up), not manual navigation
    if (user && currentStep === 'welcome' && isFromSignUp) {
      setShowAutoRedirect(true);
      
      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setAutoRedirectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [user, router, currentStep, isFromSignUp]);

  const handleContinue = () => {
    if (user) {
      // If user is signed in, go to dashboard
      router.push('/');
    } else {
      // If no user, go to sign-in step
      setCurrentStep('signin');
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // The AuthProvider will handle redirecting to dashboard
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  if (currentStep === 'signin') {
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
                Ready to get started?
              </CardTitle>
              <CardDescription className="text-slate-600">
                Sign in with Google to begin your memory journey
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 h-12 text-base font-medium flex items-center justify-center gap-2"
            >
              <GoogleIcon />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => setCurrentStep('welcome')}
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4">
      <div className="w-full max-w-2xl text-center space-y-8">
        {/* Logo and Brand */}
        <div 
          className={`flex justify-center transition-all duration-1000 ease-out ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="relative">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl shadow-sm flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
              <Heart className="w-3 h-3 text-white fill-current" />
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div 
          className={`space-y-6 transition-all duration-1000 ease-out delay-300 ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">
            {user ? `Welcome${user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!` : 'Welcome to Kronicl'}
          </h1>
          
          <div className="space-y-4">
            <p className="text-xl md:text-2xl text-slate-700 font-medium">
              Record the moments that matter
            </p>
            <p className="text-xl md:text-2xl text-slate-700 font-medium">
              so that the memories live on forever
            </p>
          </div>

          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            {user ? 
              (isFromSignUp ? 
                "You're all set! Start capturing your precious moments with AI-powered insights, organize them beautifully, and relive them whenever you want." :
                "Welcome back! Here's a reminder of what makes Kronicl special. Continue capturing and organizing your precious memories with AI-powered insights."
              ) :
              "Capture your precious moments with AI-powered insights, organize them beautifully, and relive them whenever you want. Your memories deserve to be preserved."
            }
          </p>
        </div>

        {/* Features Preview */}
        <div 
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto transition-all duration-1000 ease-out delay-500 ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Voice Recording</h3>
            <p className="text-sm text-slate-600">Capture moments with simple voice notes that preserve the emotion and context</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Photos & Videos</h3>
            <p className="text-sm text-slate-600">Add visual memories with automatic organization and smart tagging</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">AI Insights</h3>
            <p className="text-sm text-slate-600">Get smart summaries, tags, and sentiment analysis for your memories</p>
          </div>
        </div>

        {/* Continue Button */}
        <div 
          className={`transition-all duration-1000 ease-out delay-700 ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {showAutoRedirect && user ? (
            <div className="text-center space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 max-w-md mx-auto">
                <p className="text-slate-600 mb-4 text-sm">
                  Welcome! You'll be automatically redirected to your dashboard in:
                </p>
                <div className="text-3xl font-bold text-indigo-600 mb-4">
                  {autoRedirectTimer}s
                </div>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 h-11 text-base font-medium flex items-center justify-center gap-2"
                >
                  Continue Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleContinue}
              className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 px-8 py-4 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {user ? 'Back to Dashboard' : 'Get Started'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
