"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mail, Users, Calendar, LogOut } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Invite", href: "/invite", icon: Mail },
  { name: "Guests", href: "/guests", icon: Users },
  { name: "Schedule", href: "/schedule", icon: Calendar },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fdfcf9]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#eef0f3] bg-white sticky top-0 h-screen">
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
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden border border-[#e69e46]">
                <Image src="/couple-avatar.png" alt="Kasun & Hiruni" width={40} height={40} className="object-cover" />
              </div>
              <div>
                <p className="font-serif font-bold text-navy text-sm">Kasun & Hiruni</p>
                <span className="text-[10px] bg-[#fcecd4] text-[#e69e46] px-2 py-0.5 rounded-full font-medium">Premium Membership</span>
              </div>
            </div>
            <button className="text-muted hover:text-red-500 transition-colors">
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
