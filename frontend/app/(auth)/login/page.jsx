"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { setAuthSession } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: {
          email: data.email.trim(),
          password: data.password,
        },
      });

      setAuthSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-md overflow-hidden bg-navy">
        <Image
          src="/app-logo.png"
          alt="Wed Flow Logo"
          width={64}
          height={64}
          className="object-cover"
        />
      </div>

      <h1 className="font-serif text-4xl font-bold text-navy mb-2">Wed Flow</h1>
      <p className="text-muted text-sm mb-10 text-center">
        Your wedding, beautifully organized
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-6"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted block">Email</label>
          <input
            type="email"
            placeholder="couple@email.com"
            {...register("email", { required: true })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300"
          />
          {errors.email && (
            <p className="text-xs text-red-500">Email is required</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted block">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("password", { required: true })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300 tracking-widest"
          />
          {errors.password && (
            <p className="text-xs text-red-500">Password is required</p>
          )}
        </div>

        {submitError ? (
          <p className="text-sm text-red-500 text-center">{submitError}</p>
        ) : null}

        <div className="flex justify-end">
          <Link
            href="#"
            className="text-sm text-[#e69e46] hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors mt-2 disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-muted mt-8">
        Need help?{" "}
        <Link
          href="#"
          className="text-[#e69e46] font-medium hover:underline"
        >
          Contact support
        </Link>
      </p>
    </div>
  );
}
