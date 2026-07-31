"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log("Login data:", data);
    // In a real app, you would authenticate here.
    // For now, redirect to dashboard.
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-md overflow-hidden bg-navy">
        <Image src="/app-logo.png" alt="Wed Flow Logo" width={64} height={64} className="object-cover" />
      </div>

      <h1 className="font-serif text-4xl font-bold text-navy mb-2">Wed Flow</h1>
      <p className="text-muted text-sm mb-10 text-center">Your wedding, beautifully organized</p>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted block">Email</label>
          <input
            type="email"
            placeholder="couple@email.com"
            {...register("email", { required: true })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted block">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("password", { required: true })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300 tracking-widest"
          />
        </div>

        <div className="flex justify-end">
          <Link href="#" className="text-sm text-[#e69e46] hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors mt-2"
        >
          Sign in
        </button>
      </form>

      <p className="text-sm text-muted mt-8">
        Need help? <Link href="#" className="text-[#e69e46] font-medium hover:underline">Contact support</Link>
      </p>
    </div>
  );
}
