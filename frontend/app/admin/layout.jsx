"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, CalendarDays, LogOut } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import {
  logout,
  getStoredUser,
  getAccessToken,
  clearAuthSession,
  setAuthSession,
} from "@/lib/auth";
import { apiRequest } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Events", href: "/admin/events", icon: CalendarDays },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Guest preview opens in a new tab; sessionStorage auth is not shared.
    // Allow this route without forcing login — page loads stashed preview data.
    if (pathname?.includes("/guest-preview")) {
      setIsAuthorized(true);
      setAuthChecked(true);
      const stored = getStoredUser();
      if (stored) setUser(stored);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      clearAuthSession();
      router.replace("/login");
      setIsAuthorized(false);
      setAuthChecked(true);
      return;
    }

    const stored = getStoredUser();
    if (stored?.role !== "ADMIN") {
      router.replace("/dashboard");
      setIsAuthorized(false);
      setAuthChecked(true);
      return;
    }

    setUser(stored);
    setIsAuthorized(true);
    setAuthChecked(true);

    (async () => {
      try {
        const data = await apiRequest("/api/auth/me", { token });
        if (data?.user) {
          if (data.user.role !== "ADMIN") {
            setAuthSession({ user: data.user });
            router.replace("/dashboard");
            return;
          }
          setAuthSession({ user: data.user });
          setUser(data.user);
        }
      } catch {
        // Keep stored session if refresh fails
      }
    })();
  }, [router, pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!authChecked || !isAuthorized) return null;

  const displayName = "Admin";
  const initials = user?.initials || "AD";
  const isGuestPreview = pathname?.includes("/guest-preview");

  if (isGuestPreview) {
    return (
      <div className="min-h-screen-zoom bg-[#EAF5FF]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen-zoom flex flex-col md:flex-row bg-[#EAF5FF]">
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#054380] sticky top-0 h-screen-zoom shrink-0">
        <div className="p-8 pb-4">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 flex items-center justify-center mb-4">
              <Image
                src="/wedflow-logo.png"
                alt="Wed Flow"
                width={56}
                height={56}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <h1 className="font-serif text-3xl font-bold text-white">Wed Flow</h1>
            <p className="text-xs text-white/80 mt-2 text-center">
              Events. People. Possibilities.
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none",
                  isActive
                    ? "bg-[#EAF5FF] text-[#054380] font-medium"
                    : "text-white hover:bg-white/10"
                )}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm">
                <span className="font-serif font-bold text-[#054380] text-[11px] leading-none tracking-tight">
                  {initials}
                </span>
              </div>
              <div>
                <p className="font-serif font-bold text-white text-sm">
                  {displayName}
                </p>
                <p className="text-[10px] text-white/70 mt-0.5">System Admin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="text-white/70 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#eef0f3] z-50 px-6 py-3 flex justify-around items-center safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center space-y-1 w-20",
                isActive ? "text-[#054380]" : "text-muted"
              )}
            >
              <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
