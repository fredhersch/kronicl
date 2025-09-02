'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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

export function SignUpForm() {
  const { signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignUpClick = () => {
    if (termsAccepted) {
      handleGoogleSignUp();
    } else {
      setShowTerms(true);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSigningUp(true);
    try {
      await signInWithGoogle();
      // The AuthProvider will handle redirecting to the welcome flow
      router.push('/welcome');
    } catch (error) {
      console.error('Sign up failed:', error);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTerms(false);
    handleGoogleSignUp();
  };

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
              Welcome to Kronicl
            </CardTitle>
            <CardDescription className="text-slate-600">
              Create your account to start capturing and preserving your precious memories
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Terms Checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-2 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 small-checkbox flex-shrink-0"
            />
            <div className="text-sm leading-6 text-slate-600">
              <label htmlFor="terms" className="cursor-pointer select-none">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2 font-medium transition-colors"
                >
                  Terms & Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2 font-medium transition-colors"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>

          {/* Sign Up Button */}
          <Button
            onClick={handleSignUpClick}
            disabled={loading || isSigningUp}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200 h-12 text-base font-medium flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            {isSigningUp ? 'Creating account...' : 'Sign up with Google'}
          </Button>

          {/* Login Link */}
          <div className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Terms & Conditions and Privacy Policy
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Please review our terms and privacy policy before creating your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Terms & Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Terms & Conditions</h3>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  By using Kronicl, you agree to these terms and conditions. Kronicl is a service 
                  designed to help you capture, organize, and preserve your personal memories.
                </p>
                <p>
                  <strong>Account Usage:</strong> You are responsible for maintaining the security of your 
                  account and for all activities that occur under your account.
                </p>
                <p>
                  <strong>Content:</strong> You retain ownership of all content you upload to Kronicl. 
                  We will not share your personal memories with third parties without your consent.
                </p>
                <p>
                  <strong>Service Availability:</strong> We strive to keep Kronicl available 24/7, 
                  but we cannot guarantee uninterrupted service.
                </p>
                <p>
                  <strong>Prohibited Use:</strong> You may not use Kronicl for any illegal activities 
                  or to store content that violates our community guidelines.
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Privacy Policy</h3>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Your privacy is important to us. This policy explains how we collect, use, and 
                  protect your information.
                </p>
                <p>
                  <strong>Information Collection:</strong> We collect information you provide directly 
                  (photos, audio recordings, text) and usage information to improve our service.
                </p>
                <p>
                  <strong>Data Security:</strong> We use industry-standard security measures to protect 
                  your data, including encryption and secure storage.
                </p>
                <p>
                  <strong>Data Sharing:</strong> We do not sell or share your personal memories with 
                  third parties. Anonymous usage statistics may be used to improve our service.
                </p>
                <p>
                  <strong>Your Rights:</strong> You can request access to, modification of, or deletion 
                  of your data at any time by contacting us.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowTerms(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTermsAccept}
              disabled={isSigningUp}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Accept & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
