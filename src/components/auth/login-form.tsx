'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '../icons/logo';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.022,44,30.034,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;


export function LoginForm() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    signInWithEmail(data.email, data.password);
  };
  
  const handleSignUp = () => {
    const data = form.getValues();
    const result = formSchema.safeParse(data);
    if (result.success) {
      signUpWithEmail(data.email, data.password);
    } else {
        // Manually trigger validation to show errors
        form.trigger();
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-lg bg-card/80 backdrop-blur-sm border-border/20">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="font-headline text-3xl">Welcome to MemoryLane</CardTitle>
        <CardDescription>
          Sign in to begin capturing and cherishing your memories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Email</Label>
                  <FormControl>
                    <Input id="email" type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                   <Label htmlFor="password">Password</Label>
                   <FormControl>
                    <Input id="password" type="password" placeholder="••••••••" {...field} />
                   </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                    Sign In
                </Button>
                <Button type="button" variant="secondary" className="w-full" onClick={handleSignUp} disabled={loading}>
                    Sign Up
                </Button>
            </div>
          </form>
        </Form>
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>
        <Button
          variant="outline"
          className="w-full h-12 text-base"
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          Sign in with Google
        </Button>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-center text-muted-foreground">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </CardFooter>
    </Card>
  );
}
