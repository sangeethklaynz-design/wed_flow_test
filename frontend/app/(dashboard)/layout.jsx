"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Mail, Users, Calendar, LogOut, Bell } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import { logout, getStoredUser } from "@/lib/auth";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Invite", href: "/invite", icon: Mail },
  { name: "Guests", href: "/guests", icon: Users },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

function buildInitials(coupleNames) {
  if (!coupleNames) return "W";
  const parts = String(coupleNames)
    .split("&")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}&${parts[1][0] || ""}`.toUpperCase();
  }
  return coupleNames.slice(0, 2).toUpperCase();
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const coupleNames = user?.coupleNames || "Couple";
  const initials = buildInitials(coupleNames);

  return (
    <div className="min-h-screen-zoom flex flex-col md:flex-row bg-[#fdfcf9]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#eef0f3] bg-white sticky top-0 h-screen-zoom shrink-0">
        <div className="p-8 pb-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-sm overflow-hidden bg-navy">
              <Image src="/app-logo.png" alt="Wed Flow" width={48} height={48} className="object-cover" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy">Wed Flow</h1>
            <p className="text-xs text-muted mt-2 text-center">Your wedding, beautifully organized</p>
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
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[#fcecd4] text-[#e69e46] font-medium"
                    : "text-navy hover:bg-[#fdfcf9]"
                )}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#eef0f3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#1A1D2E] border-2 border-[#e69e46] shadow-sm"
                title="Premium member"
              >
                <span className="font-serif font-bold text-[#e69e46] text-[11px] leading-none tracking-tight">
                  {initials}
                </span>
              </div>
              <div>
                <p className="font-serif font-bold text-navy text-sm">
                  {coupleNames}
                </p>
                <span className="text-[10px] bg-[#fcecd4] text-[#e69e46] px-2 py-0.5 rounded-full font-medium">Premium Membership</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="text-muted hover:text-red-500 transition-colors"
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
                isActive ? "text-[#e69e46]" : "text-muted"
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
