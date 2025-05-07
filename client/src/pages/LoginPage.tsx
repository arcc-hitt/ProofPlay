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

  const openSocial = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4 text-center">Log In</h2>

          {/* Social Login Buttons */}
          <div className="flex flex-col space-y-2 mb-4">
            <Button onClick={() => openSocial(GOOGLE_AUTH_URL)} className="w-full">
              Continue with Google
            </Button>
            <Button onClick={() => openSocial(GITHUB_AUTH_URL)} className="w-full">
              Continue with GitHub
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mb-2">or use your email</div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in…' : 'Log In'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            New here?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
