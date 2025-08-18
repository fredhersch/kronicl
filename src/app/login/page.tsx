import { LoginForm } from '@/components/auth/login-form';
import { AuthDebug } from '@/components/debug/auth-debug';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center w-full min-h-screen bg-background font-body">
      <div className="flex gap-8 items-start">
        <LoginForm />
        <AuthDebug />
      </div>
    </main>
  );
}
