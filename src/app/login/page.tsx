import { LoginForm } from '@/components/auth/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Memory Lane',
  description: 'Sign in to Memory Lane to continue capturing and cherishing your precious memories.',
};

export default function LoginPage() {
  return <LoginForm />;
}
