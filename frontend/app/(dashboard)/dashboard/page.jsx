import { Bell } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RsvpBreakdown from "@/components/dashboard/RsvpBreakdown";
import Countdown from "@/components/dashboard/Countdown";
import Image from "next/image";

export default function DashboardPage() {
  const stats = [
    { title: "Guests invited", value: "248", dotColor: "bg-navy" },
    { title: "RSVP confirmed", value: "186", dotColor: "bg-green-500" },
    { title: "Pending", value: "42", dotColor: "bg-orange-400" },
    { title: "Declined", value: "20", dotColor: "bg-red-500" },
  ];

  const breakdownStats = [
    { label: "Confirmed", value: "186", color: "bg-green-500" },
    { label: "Pending", value: "42", color: "bg-orange-400" },
    { label: "Declined", value: "20", color: "bg-red-500" },
  ];

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      {/* Mobile Header (Hidden on Desktop since Desktop has Sidebar Profile) */}
      <div className="md:hidden flex justify-between items-center mb-8">
        <div>
          <p className="text-muted text-sm mb-1">Welcome back</p>
          <h1 className="font-serif font-bold text-2xl text-navy">Kasun & Hiruni</h1>
          <span className="inline-block mt-2 text-[10px] bg-[#fcecd4] text-[#e69e46] px-3 py-1 rounded-full font-medium">Premium Membership</span>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md overflow-hidden border border-[#e69e46]">
          <Image src="/couple-avatar.png" alt="Kasun & Hiruni" width={48} height={48} className="object-cover" />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <h1 className="font-serif font-bold text-2xl text-navy">Dashboard</h1>
        <button className="text-navy p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Title (Only visible on Mobile) */}
      <h2 className="md:hidden font-serif font-bold text-3xl text-navy mb-6">Dashboard</h2>

      {/* Main Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <Countdown days="47" hours="11" minutes="05" seconds="59" />
        <RsvpBreakdown stats={breakdownStats} />
      </div>
    </div>
  );
}
