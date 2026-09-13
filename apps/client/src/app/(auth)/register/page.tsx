"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/index";
import { api } from "@/lib/axios";
import { loginWithGoogle } from "@/lib/api/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/AuthLayout";
import { Eye, EyeOff } from "lucide-react";

type Step = "register" | "verify";

// Register Page
export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<Step>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { mutate: register, isPending: registering } = useMutation({
    mutationFn: () => api.post("/auth/register", { name, email, password }),
    onSuccess: (res) => {
      setUserId(res.data.user.id);
      setStep("verify");
      setError("");
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setError("Email already in use");
      } else {
        setError("Something went wrong");
      }
    },
  });

  const { mutate: verify, isPending: verifying } = useMutation({
    mutationFn: () => api.post("/auth/verify-email", { userId, otp }),
    onSuccess: (res) => {
      setUser(res.data.user);
      router.push("/dashboard");
    },
    onError: () => {
      setError("Invalid or expired code");
    },
  });

  const { mutate: resend, isPending: resending } = useMutation({
    mutationFn: () => api.post("/auth/resend-otp", { userId, email }),
    onSuccess: () => setError(""),
    onError: (err: any) => {
      if (err?.response?.status === 429) {
        setError("Please wait before requesting another code");
      }
    },
  });

  if (step === "verify") {
    return (
      <AuthLayout>
        <div className="mb-8">
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-[#525252] text-sm mt-1.5">
            We sent a 6-digit code to{" "}
            <span className="text-white">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-[#a3a3a3] text-xs mb-1.5 block">
              Verification code
            </Label>
            <Input
              autoFocus
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(e) =>
                e.key === "Enter" && otp.length === 6 && verify()
              }
              maxLength={6}
              className="bg-[#141414] border-[#262626] text-white text-center text-2xl tracking-[0.5em] placeholder:text-[#525252] focus:border-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 rounded-lg transition-colors font-mono"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
            <div className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={() => verify()}
          disabled={verifying || otp.length < 6}
          className="mt-4 w-full bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-4 py-2.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? "Verifying..." : "Verify email"}
        </button>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => {
              setStep("register");
              setOtp("");
              setError("");
            }}
            className="text-[#525252] hover:text-white text-xs transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => resend()}
            disabled={resending}
            className="text-[#525252] hover:text-white text-xs transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-[#525252] text-sm mt-1.5">
          Start sending notifications in minutes
        </p>
      </div>

      {/* google */}
      <button
        onClick={loginWithGoogle}
        className="w-full flex items-center justify-center gap-2.5 bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#333] text-[#a3a3a3] hover:text-white text-sm rounded-lg px-4 py-2.5 transition-all duration-150"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      {/* divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#262626]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#0d0d0d] px-3 text-[#525252] text-xs">or</span>
        </div>
      </div>

      {/* fields */}
      <div className="space-y-4">
        <div>
          <Label className="text-[#a3a3a3] text-xs mb-1.5 block">Name</Label>
          <Input
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#141414] border-[#262626] text-white placeholder:text-[#525252] focus:border-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm rounded-lg transition-colors"
          />
        </div>
        <div>
          <Label className="text-[#a3a3a3] text-xs mb-1.5 block">Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#141414] border-[#262626] text-white placeholder:text-[#525252] focus:border-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm rounded-lg transition-colors"
          />
        </div>
        <div>
          <Label className="text-[#a3a3a3] text-xs mb-1.5 block">
            Password
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && register()}
              className="bg-[#141414] border-[#262626] text-white placeholder:text-[#525252] focus:border-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm rounded-lg transition-colors pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#a3a3a3] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
          <div className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={() => register()}
        disabled={registering}
        className="mt-4 w-full bg-white hover:bg-zinc-100 text-black text-sm font-medium rounded-lg px-4 py-2.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {registering ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-[#525252] text-xs mt-5">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-white hover:text-zinc-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
