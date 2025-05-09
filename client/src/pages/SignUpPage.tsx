// Description: SignUpPage component for user registration with email and social media options (Google, GitHub).
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { signup } from '@/lib/auth';
import { GOOGLE_AUTH_URL, GITHUB_AUTH_URL } from '@/config';
import { SocialAuthButton } from '@/components/SocialButton';

// Define Zod schema
const signupSchema = z
  .object({
    email: z.string().nonempty('Email is required').email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });

type SignUpFormInputs = z.infer<typeof signupSchema>;

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignUpFormInputs) => {
    try {
      await signup({ email: data.email, password: data.password });
      navigate('/', { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 500) toast.error('Email already registered');
      else toast.error('Sign up failed. Try again later.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md lg:max-w-lg p-6">
        <CardContent className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Sign Up</h2>

          <div className="space-y-3">
            <SocialAuthButton provider="google" url={GOOGLE_AUTH_URL} />
            <SocialAuthButton provider="github" url={GITHUB_AUTH_URL} />
          </div>

          <div className="text-center text-sm text-gray-500">or use your email</div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full md:col-span-2">
              <label htmlFor="email" className="block mb-1 text-sm font-medium">Email</label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium">Password</label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirm" className="block mb-1 text-sm font-medium">Confirm Password</label>
              <Input id="confirm" type="password" placeholder="••••••••" {...register('confirm')} />
              {errors.confirm && <p className="text-red-600 text-sm mt-1">{errors.confirm.message}</p>}
            </div>

            <div className="col-span-full md:col-span-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing up…' : 'Sign Up'}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm">
            Have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
};
