// Description: SignUpPage component for user registration with email and social media options (Google, GitHub).
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const GOOGLE_AUTH_URL = 'http://localhost:5000/auth/google';
const GITHUB_AUTH_URL = 'http://localhost:5000/auth/github';

// Define Zod schema
const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
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
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignUpFormInputs) => {
    setServerError(null);
    try {
      const res = await axios.post('http://localhost:5000/auth/signup', {
        email: data.email,
        password: data.password,
      });
      const { token } = res.data;
      localStorage.setItem('jwtToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/', { replace: true });
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Sign up failed');
    }
  };

  const openSocial = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4 text-center">Sign Up</h2>

          {/* Social Signup Buttons */}
          <div className="flex flex-col space-y-2 mb-4">
            <Button onClick={() => openSocial(GOOGLE_AUTH_URL)} className="w-full">
              Sign up with Google
            </Button>
            <Button onClick={() => openSocial(GITHUB_AUTH_URL)} className="w-full">
              Sign up with GitHub
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mb-2">or use your email</div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Server error */}
            {serverError && (
              <p className="text-red-600 text-sm text-center">{serverError}</p>
            )}

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

            <div>
              <label className="block mb-1 text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('confirm')}
              />
              {errors.confirm && (
                <p className="text-red-600 text-sm mt-1">{errors.confirm.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing up…' : 'Sign Up'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            Have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
