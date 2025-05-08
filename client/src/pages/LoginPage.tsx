// Description: Login page component for user authentication using email/password and social login (Google, GitHub).
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { login } from '@/lib/auth';
import { GOOGLE_AUTH_URL, GITHUB_AUTH_URL } from '@/config';
import { SocialAuthButton } from '@/components/SocialButton';


// Define Zod schema
const loginSchema = z.object({
  email: z.string().nonempty('Email is required').email('Invalid email'),
  password: z.string().nonempty('Password is required'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      await login(data);
      navigate('/', { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 400) toast.error('Bad request');
      else if (status === 401) toast.error('Invalid credentials');
      else toast.error('Login failed. Try again later.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md lg:max-w-lg p-6">
        <CardContent className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Log In</h2>

          <div className="space-y-3">
            <SocialAuthButton provider="google" url={GOOGLE_AUTH_URL} />
            <SocialAuthButton provider="github" url={GITHUB_AUTH_URL} />
          </div>

          <div className="text-center text-sm text-gray-500">or use your email</div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="email" className="block mb-1 text-sm font-medium">Email</label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label htmlFor="password" className="block mb-1 text-sm font-medium">Password</label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in…' : 'Log In'}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm">
            New here?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
};
