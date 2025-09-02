import { WelcomeFlow } from '@/components/auth/welcome-flow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome - Kronicl',
  description: 'Welcome to Kronicl - Record the moments that matter so that the memories live on forever.'
};

export default function WelcomePage() {
  return <WelcomeFlow />;
}
