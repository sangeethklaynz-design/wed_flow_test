"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Mail, CreditCard, LogOut, Users, QrCode } from "lucide-react";
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
  { name: "Events", href: "/admin/events", icon: Mail },
  { name: "Guests", href: "/admin/guests", icon: Users },
  { name: "Finance", href: "/admin/finance", icon: CreditCard },
  { name: "QR Check-in", href: "/admin/qr-checkin", icon: QrCode },
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
    // Allow guest preview and admin finance preview without forcing login
    if (pathname?.includes("/guest-preview") || pathname?.startsWith("/admin/finance") || pathname?.startsWith("/admin/qr-checkin")) {
      setIsAuthorized(true);
      setAuthChecked(true);
      const stored = getStoredUser();
      setUser(stored || { name: "Admin", role: "ADMIN", initials: "" });
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
        <div className="p-8 pb-6">
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

        <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none text-[15px]",
                  isActive
                    ? "bg-[#0B72E7] text-white font-medium shadow-sm"
                    : "text-white/90 hover:bg-white/10"
                )}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-full shrink-0 bg-white shadow-sm" />
              <p className="font-sans font-bold text-white text-[15px]">
                {displayName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="text-white/80 hover:text-white transition-colors p-1"
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
                isActive ? "text-[#0B72E7] font-semibold" : "text-muted hover:text-[#054380]"
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
