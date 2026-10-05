"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Mail, Users, Calendar, LogOut, Bell } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import { logout, getStoredUser, getAccessToken, clearAuthSession, setAuthSession } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Invite", href: "/invite", icon: Mail },
  { name: "Guests", href: "/guests", icon: Users },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

function buildInitials(name) {
  if (!name) return "W";
  const parts = String(name)
    .split(/\s*&\s*|\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
}

function formatSidebarLabel(user) {
  const eventName = String(user?.eventName || "").trim();
  if (eventName) return eventName;
  return user?.coupleNames || "Event";
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      clearAuthSession();
      router.replace("/login");
      setIsAuthorized(false);
      setAuthChecked(true);
      return;
    }

    const stored = getStoredUser();
    if (stored?.role === "ADMIN") {
      router.replace("/admin/dashboard");
      setIsAuthorized(false);
      setAuthChecked(true);
      return;
    }

    setUser(stored);
    setIsAuthorized(true);
    setAuthChecked(true);

    // Refresh user from API so bride/groom display order stays current
    (async () => {
      try {
        const data = await apiRequest("/api/auth/me", { token });
        if (data?.user) {
          if (data.user.role === "ADMIN") {
            setAuthSession({ user: data.user });
            router.replace("/admin/dashboard");
            return;
          }
          setAuthSession({ user: data.user });
          setUser(data.user);
        }
      } catch {
        // Keep stored session if refresh fails
      }
    })();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Prevent dashboard “glimpse” for unauthenticated users.
  if (!authChecked || !isAuthorized) return null;

  const displayName = formatSidebarLabel(user);
  const initials = buildInitials(displayName);

  return (
    <div className="min-h-screen-zoom flex flex-col md:flex-row bg-[#EAF5FF]">
      {/* Desktop Sidebar */}
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
            <p className="text-xs text-white/80 mt-2 text-center">Events. People. Possibilities.</p>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#eef0f3] z-50 px-6 py-3 flex justify-between items-center safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center space-y-1 w-16",
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
