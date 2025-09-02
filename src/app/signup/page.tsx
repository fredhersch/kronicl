import { SignUpForm } from '@/components/auth/sign-up-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Kronicl',
  description: 'Create your Kronicl account to start capturing and preserving your precious memories with AI-powered insights.'
};

export default function SignUpPage() {
  return <SignUpForm />;
}
