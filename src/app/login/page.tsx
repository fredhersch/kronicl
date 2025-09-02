import { LoginForm } from '@/components/auth/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Kronicl',
  description: 'Sign in to Kronicl to continue capturing and cherishing your precious memories.'
};

export default function LoginPage() {
  return <LoginForm />;
}
