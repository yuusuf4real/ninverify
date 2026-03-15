"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedLogoLoader } from "@/components/ui/animated-logo-loader";
import { getFriendlyErrorMessage } from "@/lib/utils";

export function AdminLoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch (error) {
      setError(
        getFriendlyErrorMessage(error, "Login failed. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Login Failed</p>
              <p className="mt-1 text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-semibold text-foreground"
        >
          Admin Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="admin@verifynin.ng"
          required
          disabled={loading}
          className="h-12"
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-semibold text-foreground"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            disabled={loading}
            className="h-12 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !formData.email || !formData.password}
        className="h-12 w-full text-base font-semibold"
      >
        {loading ? (
          <>
            <AnimatedLogoLoader size="sm" variant="inline" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            Sign In to Admin
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="rounded-xl bg-blue-50 p-4">
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <div className="h-2 w-2 rounded-full bg-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Security Notice</p>
            <p className="mt-1 text-xs text-blue-800">
              Admin access is logged and monitored. Only authorized personnel
              should access this portal.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
