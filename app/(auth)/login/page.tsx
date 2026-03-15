"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async () => {
    // Validate
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Unable to login");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full max-w-md space-y-6 border-border/70 bg-white p-6 shadow-lg sm:p-8">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-sm">
            <Image
              src="/images/logo-mark.svg"
              alt="VerifyNIN logo"
              fill
              className="object-contain"
            />
          </div>
          <Image
            src="/images/logo-wordmark.svg"
            alt="VerifyNIN wordmark"
            width={150}
            height={40}
            className="h-8 w-auto"
          />
        </div>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your wallet and verifications
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
            onKeyPress={handleKeyPress}
            className="h-11"
            autoComplete="email"
          />
          {emailError && (
            <p className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {emailError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
              onKeyPress={handleKeyPress}
              className="h-11 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {passwordError && (
            <p className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {passwordError}
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-900">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            "Signing in..."
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign In
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="space-y-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-muted-foreground">
              New to VerifyNIN?
            </span>
          </div>
        </div>

        <Button variant="outline" size="lg" className="w-full" asChild>
          <Link href="/register">Create Account</Link>
        </Button>
      </div>
    </Card>
  );
}
