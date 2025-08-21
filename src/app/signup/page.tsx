import { SignUpForm } from '@/components/auth/sign-up-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Memory Lane',
  description: 'Create your Memory Lane account to start capturing and preserving your precious memories with AI-powered insights.',
};

export default function SignUpPage() {
  return <SignUpForm />;
}
