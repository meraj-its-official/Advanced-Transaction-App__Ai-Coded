"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Phone,
  RefreshCw,
} from "lucide-react";
import api, { authApi } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { authClient } from "@/lib/better-auth-client";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { GoogleIcon, GithubIcon } from "@/components/ui/social-icons";

const loginSchema = z.object({
  email: z.string().min(1, "Please enter your email or phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setWallet } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<
    "google" | "github" | null
  >(null);

  // Forgot password state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "reset">("request");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState<{
    maskedEmail?: string;
    maskedPhone?: string;
    emailSent?: boolean;
    smsSent?: boolean;
  }>({});
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSocialSignIn = async (provider: "google" | "github") => {
    try {
      setSocialLoading(provider);
      await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}/dashboard`,
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || `Failed to initiate ${provider} sign-in`);
      setSocialLoading(null);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true);

      // 1. Try Better Auth email sign in first
      let betterAuthSuccess = false;
      try {
        const { data, error } = await authClient.signIn.email({
          email: values.email.trim(),
          password: values.password,
        });

        if (!error && data?.user) {
          betterAuthSuccess = true;
          const sessionRes = await authClient.getSession();
          if (sessionRes?.data?.session?.token) {
            setTokens(
              sessionRes.data.session.token,
              sessionRes.data.session.token,
            );
          }

          try {
            const [profileRes, walletRes] = await Promise.all([
              api.get("/auth/profile"),
              api.get("/wallet"),
            ]);
            setUser(profileRes.data?.data || profileRes.data);
            setWallet(walletRes.data?.data || walletRes.data);
          } catch {
            setUser({
              id: data.user.id,
              name: data.user.name || "User",
              email: data.user.email,
              phone: (data.user as { phone?: string }).phone || "",
              avatar: data.user.image || undefined,
              isVerified:
                (data.user as { emailVerified?: boolean }).emailVerified ||
                false,
              hasPin: false,
              createdAt: data.user.createdAt
                ? new Date(data.user.createdAt).toISOString()
                : new Date().toISOString(),
            });
          }

          toast.success(`Welcome back, ${data.user.name || "User"}!`);
          router.push("/dashboard");
          return;
        }
      } catch {
        // Fallback to legacy custom auth
      }

      // 2. Fall back to custom auth API (for phone number or legacy seed users)
      if (!betterAuthSuccess) {
        const res = await authApi.login(values.email, values.password);
        const data = res.data?.data || res.data;

        if (!data?.accessToken) {
          throw new Error("Authentication tokens missing in response");
        }

        // Store tokens
        setTokens(data.accessToken, data.refreshToken || data.accessToken);

        // Populate store
        if (data.user) setUser(data.user);
        if (data.wallet) setWallet(data.wallet);

        toast.success(`Welcome back, ${data.user?.name || "User"}!`);
        router.push("/dashboard");
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
        "Failed to sign in. Please verify your credentials.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setForgotError("");
    if (!forgotIdentifier.trim()) {
      setForgotError("Please enter your email or phone number");
      return;
    }

    try {
      setIsSubmittingForgot(true);
      const res = await authApi.forgotPassword(forgotIdentifier.trim());
      const data = res.data?.data || res.data;
      toast.success(
        data?.message ||
          "Verification code sent to your email and mobile number!",
      );
      setDeliveryInfo({
        maskedEmail: data?.maskedEmail,
        maskedPhone: data?.maskedPhone,
        emailSent: data?.emailSent,
        smsSent: data?.smsSent,
      });
      setResendCooldown(60);
      setForgotStep("reset");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        error.response?.data?.message || error.message || "Account not found";
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (!newPassword || newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    try {
      setIsSubmittingForgot(true);
      await authApi.resetPassword({
        email: forgotIdentifier.trim(),
        newPassword,
        otp: forgotOtp,
      });

      toast.success(
        "Password reset successfully! Please sign in with your new password.",
      );
      setValue("email", forgotIdentifier.trim());
      setIsForgotOpen(false);
      setForgotStep("request");
      setNewPassword("");
      setConfirmNewPassword("");
      setForgotOtp("");
      setForgotError("");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to reset password";
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  return (
    <div className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Sign In
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Access your digital wallet and send money instantly
        </p>
      </div>

      {/* Social Logins */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleSocialSignIn("google")}
          disabled={loading || !!socialLoading}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#2d2d44] bg-[#161622] hover:bg-[#1e1e30] text-slate-200 text-sm font-medium transition-all hover:border-slate-500 disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          {socialLoading === "google" ? (
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialSignIn("github")}
          disabled={loading || !!socialLoading}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#2d2d44] bg-[#161622] hover:bg-[#1e1e30] text-slate-200 text-sm font-medium transition-all hover:border-slate-500 disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]"
        >
          {socialLoading === "github" ? (
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
          <span className="bg-[#12121a] px-3 text-slate-500 font-medium">
            Or continue with
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address or Phone Number"
          type="text"
          placeholder="name@example.com or 9856241536"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
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
          {...register("password")}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              className="rounded bg-[#1e1e2e] border-[#2d2d44] text-indigo-500 focus:ring-indigo-500"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => {
              setForgotIdentifier("");
              setForgotOtp("");
              setNewPassword("");
              setConfirmNewPassword("");
              setForgotError("");
              setForgotStep("request");
              setIsForgotOpen(true);
            }}
            className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2 py-3"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-[#1e1e2e] text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
        >
          Create one now
        </Link>
      </div>

      {/* Forgot / Reset Password Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => {
          setIsForgotOpen(false);
          setForgotError("");
        }}
        title="Reset Your Password"
        description="Recover access to your PayFlow account and digital wallet"
      >
        {forgotStep === "request" ? (
          <form onSubmit={handleRequestResetCode} className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                Enter your registered email address or phone number. We will
                send you a verification code to securely reset your password.
              </p>
            </div>

            <Input
              label="Email Address or Phone Number"
              type="text"
              placeholder="e.g. rahul@example.com or 9876543210"
              leftIcon={<Mail className="w-4 h-4" />}
              value={forgotIdentifier}
              onChange={(e) => setForgotIdentifier(e.target.value)}
              required
            />

            {forgotError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-center">
                {forgotError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setIsForgotOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isSubmittingForgot}
              >
                Send Verification Code
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 mt-2">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verification Code Dispatched!</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                A 6-digit verification code has been dispatched to your
                registered contacts:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1 text-[11px]">
                {deliveryInfo.maskedEmail && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{deliveryInfo.maskedEmail}</span>
                  </div>
                )}
                {deliveryInfo.maskedPhone && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{deliveryInfo.maskedPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <Input
              label="6-Digit Verification Code"
              type="text"
              maxLength={6}
              placeholder="Enter the 6-digit code received on Email/SMS"
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Didn&apos;t receive the code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || isSubmittingForgot}
                onClick={() => handleRequestResetCode()}
                className="text-indigo-400 hover:text-indigo-300 hover:underline disabled:opacity-50 disabled:no-underline font-medium cursor-pointer"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </button>
            </div>

            <Input
              label="New Password"
              type={showForgotNewPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                showForgotNewPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )
              }
              onRightIconClick={() =>
                setShowForgotNewPassword(!showForgotNewPassword)
              }
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type={showForgotNewPassword ? "text" : "password"}
              placeholder="Re-enter new password"
              leftIcon={<Lock className="w-4 h-4" />}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />

            {confirmNewPassword.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-xs">
                {newPassword === confirmNewPassword ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-medium bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" /> Passwords do not
                    match
                  </span>
                )}
              </div>
            )}

            {forgotError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-center">
                {forgotError}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setForgotStep("request")}
                className="text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                &larr; Change email or phone
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setIsForgotOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isSubmittingForgot}
                disabled={
                  !newPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmNewPassword
                }
              >
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
