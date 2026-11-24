'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { authApi } from '@/lib/api';
import { authClient } from '@/lib/better-auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleIcon, GithubIcon } from '@/components/ui/social-icons';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^(?:\+91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);

  const handleSocialSignUp = async (provider: 'google' | 'github') => {
    try {
      setSocialLoading(provider);
      await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}/dashboard`,
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || `Failed to initiate ${provider} sign-up`);
      setSocialLoading(null);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setLoading(true);

      // Try Better Auth sign up first
      let betterAuthSuccess = false;
      try {
        const { data, error } = await authClient.signUp.email({
          email: values.email.trim(),
          password: values.password,
          name: values.name.trim(),
        });
        if (!error && data?.user) {
          betterAuthSuccess = true;
          toast.success('Account created successfully! Please sign in to continue.');
          router.push('/login');
          return;
        }
      } catch {
        // Fallback to custom register
      }

      if (!betterAuthSuccess) {
        await authApi.register({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.replace(/^\+91/, '').replace(/\D/g, ''),
          password: values.password,
        });

        toast.success('Account created successfully! Please sign in to continue.');
        router.push('/login');
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to register account. Please check your details.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
        <p className="text-sm text-slate-400 mt-1">
          Open a zero-fee digital wallet with PayFlow
        </p>
      </div>

      {/* Social Registration */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleSocialSignUp('google')}
          disabled={loading || !!socialLoading}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#2d2d44] bg-[#161622] hover:bg-[#1e1e30] text-slate-200 text-sm font-medium transition-all hover:border-slate-500 disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          {socialLoading === 'google' ? (
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialSignUp('github')}
          disabled={loading || !!socialLoading}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#2d2d44] bg-[#161622] hover:bg-[#1e1e30] text-slate-200 text-sm font-medium transition-all hover:border-slate-500 disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          {socialLoading === 'github' ? (
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <GithubIcon className="w-5 h-5 text-white" />
          )}
          <span>GitHub</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1e1e2e]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#12121a] px-3 text-slate-500 font-medium">Or register with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Rahul Sharma"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Mobile Phone"
          type="tel"
          placeholder="9876543210"
          hint="10-digit Indian mobile number"
          leftIcon={<Phone className="w-4 h-4" />}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min 8 characters, 1 uppercase, 1 number"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            showPassword ? (
              <EyeOff className="w-4 h-4 text-slate-400" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400" />
            )
          }
          onRightIconClick={() => setShowPassword(!showPassword)}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="mt-2 py-3"
        >
          Create PayFlow Account
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-[#1e1e2e] text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}
