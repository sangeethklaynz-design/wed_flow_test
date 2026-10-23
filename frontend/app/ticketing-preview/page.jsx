"use client";
import React, { useState } from "react";
import CorporateInvitationExperience from "@/components/invite/corporate/template-1/InvitationWrapper";
import PartyInvitationExperience from "@/components/invite/party/template-1/InvitationWrapper";
import PaymentSuccessOverlay from "@/components/invite/corporate/template-1/overlays/PaymentSuccessOverlay";
import TicketQrOverlay from "@/components/invite/corporate/template-1/overlays/TicketQrOverlay";
import { RsvpPage as CorporateRsvpPage } from "@/components/invite/corporate/template-1/pages/RsvpPage";
import PartyRsvpPage from "@/components/invite/party/template-1/pages/RsvpPage";
import FinanceTab from "@/components/finance/FinanceTab";
import AdminFinanceTab from "@/components/admin/AdminFinanceTab";
import { Home, Mail, Users, Calendar, CreditCard, Ticket, Bell, LogOut, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function TicketingFlowVerificationPage() {
  const [activeTab, setActiveTab] = useState("admin-finance");
  const [financeDeviceWidth, setFinanceDeviceWidth] = useState("100%");

  const mockCorporateTemplate = {
    eventType: "corporate",
    templateKey: "template-1",
    isTicketingEnabled: true,
    ticketTypes: [
      { id: "1", name: "Standard", price: 1000, maxQuantity: 5 },
      { id: "2", name: "VIP", price: 2000, maxQuantity: 3 },
    ],
    event: {
      name: "Annual Business Summit 2026",
      date: "Thu, 12 Nov 2026",
      time: "6:00 PM",
      venue: "Cinnamon Lakeside Colombo",
      enableTicketing: true,
      tickets: [
        { id: "1", name: "Standard", price: 1000, maxQuantity: 5 },
        { id: "2", name: "VIP", price: 2000, maxQuantity: 3 },
      ],
    },
    guest: {
      name: "Kavindu Perera",
      email: "kavindu@gmail.com",
    },
  };

  const mockPartyTemplate = {
    eventType: "party",
    templateKey: "template-1",
    isTicketingEnabled: true,
    ticketTypes: [
      { id: "1", name: "Standard", price: 1000, maxQuantity: 5 },
      { id: "2", name: "VIP", price: 2000, maxQuantity: 3 },
    ],
    event: {
      name: "Annual Gala Night 2026",
      date: "Thu, 12 Nov 2026",
      time: "6:00 PM",
      venue: "Cinnamon Lakeside Colombo",
      enableTicketing: true,
      tickets: [
        { id: "1", name: "Standard", price: 1000, maxQuantity: 5 },
        { id: "2", name: "VIP", price: 2000, maxQuantity: 3 },
      ],
    },
    guest: {
      name: "Kavindu Perera",
      email: "kavindu@gmail.com",
    },
  };

  const sampleBookingData = {
    fullName: "Kavindu Perera",
    email: "kavindu@gmail.com",
    bookingRef: "LN2026-0001",
    selectedTickets: [
      { id: "1", name: "Standard", price: 1000, quantity: 3 },
      { id: "2", name: "VIP", price: 2000, quantity: 1 },
      { id: "3", name: "Premium", price: 5000, quantity: 1 },
    ],
    totalAmount: 10000,
    totalCount: 5,
    ticketsSummary: "3 x Standard, 1 x VIP, 1 x Premium",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 24, background: "#0f172a", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          id="btn-tab-corporate-direct"
          onClick={() => setActiveTab("corporate-direct")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "corporate-direct" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          1. Corporate Ticketing Success (Direct)
        </button>
        <button
          id="btn-tab-party-direct"
          onClick={() => setActiveTab("party-direct")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "party-direct" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          2. Party Ticketing Success (Direct)
        </button>
        <button
          id="btn-tab-rsvp-corporate"
          onClick={() => setActiveTab("rsvp-corporate")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "rsvp-corporate" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          3. Corporate RSVP Success (Preserved)
        </button>
        <button
          id="btn-tab-corporate-full"
          onClick={() => setActiveTab("corporate-full")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "corporate-full" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          4. Corporate Full Flow
        </button>
        <button
          id="btn-tab-party-full"
          onClick={() => setActiveTab("party-full")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "party-full" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          5. Party Full Flow
        </button>
        <button
          id="btn-tab-corporate-tickets"
          onClick={() => setActiveTab("corporate-tickets")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "corporate-tickets" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          6. Corporate Tickets/QR (Direct)
        </button>
        <button
          id="btn-tab-party-tickets"
          onClick={() => setActiveTab("party-tickets")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "party-tickets" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          7. Party Tickets/QR (Direct)
        </button>
        <button
          id="btn-tab-corporate-rsvp"
          onClick={() => setActiveTab("corporate-rsvp")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "corporate-rsvp" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          8. Corporate RSVP (Screenshot 1)
        </button>
        <button
          id="btn-tab-party-rsvp"
          onClick={() => setActiveTab("party-rsvp")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "party-rsvp" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          9. Party RSVP (Screenshot 1)
        </button>
        <button
          id="btn-tab-finance"
          onClick={() => setActiveTab("finance")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "finance" ? "#2563eb" : "#334155",
            color: "#fff",
          }}
        >
          8. Host Finance Tab
        </button>
        <button
          id="btn-tab-admin-finance"
          onClick={() => setActiveTab("admin-finance")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            background: activeTab === "admin-finance" ? "#0B72E7" : "#334155",
            color: "#fff",
            boxShadow: activeTab === "admin-finance" ? "0 0 12px rgba(11,114,231,0.5)" : "none",
          }}
        >
          9. Super Admin Finance Tab (Screenshots 1-4)
        </button>
      </div>

      {activeTab === "admin-finance" ? (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Responsive Device Width Switcher */}
          <div className="flex items-center gap-2 bg-[#1e293b] p-1.5 rounded-xl border border-slate-700 flex-wrap justify-center">
            <span className="text-xs text-slate-400 font-semibold px-2">Preview Screen Size:</span>
            {[
              { label: "Full Width (100%)", width: "100%" },
              { label: "Desktop (1440px)", width: "1440px" },
              { label: "Laptop (1024px)", width: "1024px" },
              { label: "Tablet (768px)", width: "768px" },
              { label: "Mobile (390px)", width: "390px" },
            ].map((device) => (
              <button
                key={device.label}
                type="button"
                onClick={() => setFinanceDeviceWidth(device.width)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: financeDeviceWidth === device.width ? 700 : 500,
                  cursor: "pointer",
                  background: financeDeviceWidth === device.width ? "#0B72E7" : "#334155",
                  color: "#fff",
                  transition: "all 0.15s ease",
                }}
              >
                {device.label}
              </button>
            ))}
          </div>

          {/* Super Admin Dashboard Container (Screenshot 1) */}
          <div
            style={{
              width: financeDeviceWidth,
              maxWidth: "100%",
              minHeight: 900,
              borderRadius: financeDeviceWidth === "100%" ? 0 : 16,
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "width 0.3s ease",
            }}
            className="flex flex-col md:flex-row bg-[#EAF5FF]"
          >
            {/* Super Admin Sidebar (Screenshot 1: Wed Flow, Dashboard, Events, Finance, Admin) */}
            {financeDeviceWidth !== "390px" && (
              <aside
                className={`flex flex-col border-r border-white/10 bg-[#054380] shrink-0 transition-all duration-300 ${
                  financeDeviceWidth === "768px" ? "w-48" : "w-64"
                }`}
              >
                <div className={`p-6 pb-4 ${financeDeviceWidth === "768px" ? "p-4 pb-2" : "p-8 pb-4"}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center mb-3">
                      <Image
                        src="/wedflow-logo.png"
                        alt="Wed Flow"
                        width={48}
                        height={48}
                        className="object-contain"
                        priority
                        unoptimized
                      />
                    </div>
                    <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">Wed Flow</h1>
                    <p className="text-[11px] md:text-xs text-white/80 mt-1.5 text-center">
                      Events. People. Possibilities.
                    </p>
                  </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto">
                  {[
                    { name: "Dashboard", icon: Home, active: false },
                    { name: "Events", icon: Mail, active: false },
                    { name: "Finance", icon: CreditCard, active: true },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-[15px] ${
                        item.active
                          ? "bg-[#0B72E7] text-white font-medium shadow-sm"
                          : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" strokeWidth={item.active ? 2.5 : 2} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </nav>

                <div className="p-5 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-full shrink-0 bg-white shadow-sm" />
                      <p className="font-sans font-bold text-white text-[15px]">
                        Admin
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Log out"
                      className="text-white/80 hover:text-white transition-colors p-1"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </aside>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
              <AdminFinanceTab hideNotificationBell={false} />
            </main>

            {/* Mobile Bottom Navigation for 390px preview */}
            {financeDeviceWidth === "390px" && (
              <nav className="bg-white border-t border-[#EEF0F3] px-6 py-3 flex items-center justify-around shadow-lg">
                {[
                  { name: "Dashboard", icon: Home, active: false },
                  { name: "Events", icon: Mail, active: false },
                  { name: "Finance", icon: CreditCard, active: true },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`flex flex-col items-center gap-1 px-3 py-1 cursor-pointer ${
                      item.active ? "text-[#0B72E7] font-bold" : "text-gray-400"
                    }`}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={item.active ? 2.5 : 2} />
                    <span className="text-[11px] font-medium">{item.name}</span>
                  </div>
                ))}
              </nav>
            )}
          </div>
        </div>
      ) : activeTab === "finance" ? (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Responsive Device Width Switcher */}
          <div className="flex items-center gap-2 bg-[#1e293b] p-1.5 rounded-xl border border-slate-700 flex-wrap justify-center">
            <span className="text-xs text-slate-400 font-semibold px-2">Preview Screen Size:</span>
            {[
              { label: "Full Width (100%)", width: "100%" },
              { label: "Desktop (1440px)", width: "1440px" },
              { label: "Laptop (1024px)", width: "1024px" },
              { label: "Tablet (768px)", width: "768px" },
              { label: "Mobile (390px)", width: "390px" },
            ].map((device) => (
              <button
                key={device.label}
                type="button"
                onClick={() => setFinanceDeviceWidth(device.width)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: financeDeviceWidth === device.width ? 700 : 500,
                  cursor: "pointer",
                  background: financeDeviceWidth === device.width ? "#0B72E7" : "#334155",
                  color: "#fff",
                  transition: "all 0.15s ease",
                }}
              >
                {device.label}
              </button>
            ))}
          </div>

          {/* Admin Dashboard Container */}
          <div
            style={{
              width: financeDeviceWidth,
              maxWidth: "100%",
              minHeight: 900,
              borderRadius: financeDeviceWidth === "100%" ? 0 : 16,
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "width 0.3s ease",
            }}
            className="flex flex-col md:flex-row bg-[#EAF5FF]"
          >
            {/* Admin Sidebar (Screenshot 1) - adapts to preview device width */}
            {financeDeviceWidth !== "390px" && (
              <aside
                className={`flex flex-col border-r border-white/10 bg-[#054380] shrink-0 transition-all duration-300 ${
                  financeDeviceWidth === "768px" ? "w-48" : "w-64"
                }`}
              >
                <div className={`p-6 pb-4 ${financeDeviceWidth === "768px" ? "p-4 pb-2" : "p-8 pb-4"}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center mb-3">
                      <Image
                        src="/wedflow-logo.png"
                        alt="Wed Flow"
                        width={48}
                        height={48}
                        className="object-contain"
                        priority
                        unoptimized
                      />
                    </div>
                    <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">Wed Flow</h1>
                    <p className="text-[11px] md:text-xs text-white/80 mt-1.5 text-center">
                      Events. People. Possibilities.
                    </p>
                  </div>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
                  {[
                    { name: "Home", icon: Home, active: false },
                    { name: "Invitation Preview", icon: Mail, active: false },
                    { name: "Guests", icon: Users, active: false },
                    { name: "Schedule", icon: Calendar, active: false },
                    { name: "Finance", icon: CreditCard, active: true },
                    { name: "Ticketing", icon: Ticket, active: false },
                    { name: "Notifications", icon: Bell, active: false },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                        item.active
                          ? "bg-[#0B72E7] text-white font-medium shadow-sm"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" strokeWidth={item.active ? 2.5 : 2} />
                      <span className="text-xs md:text-sm truncate">{item.name}</span>
                    </div>
                  ))}
                </nav>

                <div className="p-3.5 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm" />
                      <div>
                        <p className="font-serif font-bold text-white text-xs md:text-sm">Event 001</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Log out"
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </aside>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 p-3 sm:p-5 md:p-8 lg:px-10 lg:py-8 overflow-y-auto">
              <FinanceTab hideNotificationBell={false} />
            </main>

            {/* Mobile Bottom Navigation for 390px preview */}
            {financeDeviceWidth === "390px" && (
              <nav className="bg-white border-t border-[#EEF0F3] px-3 py-2 flex items-center justify-around shadow-lg">
                {[
                  { name: "Home", icon: Home, active: false },
                  { name: "Guests", icon: Users, active: false },
                  { name: "Finance", icon: CreditCard, active: true },
                  { name: "Tickets", icon: Ticket, active: false },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`flex flex-col items-center gap-1 px-2 py-1 ${
                      item.active ? "text-[#0B72E7] font-bold" : "text-gray-400"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px]">{item.name}</span>
                  </div>
                ))}
              </nav>
            )}
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", width: 390, height: 844, borderRadius: 26, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", background: "#fff" }}>
          {activeTab === "corporate-direct" && (
            <PaymentSuccessOverlay
              isOpen={true}
              onClose={() => {}}
              onBackToRsvp={() => alert("Back Clicked")}
              onAddToCalendar={() => alert("Add to Calendar Clicked")}
              onViewTicket={() => alert("View Tickets Clicked")}
              bookingData={sampleBookingData}
              theme="corporate"
            />
          )}

          {activeTab === "party-direct" && (
            <PaymentSuccessOverlay
              isOpen={true}
              onClose={() => {}}
              onBackToRsvp={() => alert("Back Clicked")}
              onAddToCalendar={() => alert("Add to Calendar Clicked")}
              onViewTicket={() => alert("View Tickets Clicked")}
              bookingData={sampleBookingData}
              theme="party"
            />
          )}

          {activeTab === "rsvp-corporate" && (
            <PaymentSuccessOverlay
              isOpen={true}
              onClose={() => {}}
              onBackToRsvp={() => alert("Back to RSVP Clicked")}
              onAddToCalendar={() => alert("Add to Calendar Clicked")}
              onViewTicket={() => alert("View Ticket Clicked")}
              bookingData={null}
              attendeeName="Kavindu Perera"
              bookingRef="LN2026-0001"
              theme="corporate"
            />
          )}

          {activeTab === "corporate-full" && (
            <CorporateInvitationExperience
              templateData={mockCorporateTemplate}
              embedded={false}
              interactive={true}
            />
          )}

          {activeTab === "party-full" && (
            <PartyInvitationExperience
              templateData={mockPartyTemplate}
              embedded={false}
              interactive={true}
            />
          )}

          {activeTab === "corporate-tickets" && (
            <TicketQrOverlay
              isOpen={true}
              onClose={() => alert("Back Clicked")}
              onBackToPayment={() => alert("Back to Payment Clicked")}
              onAddToCalendar={() => alert("Add to Calendar Clicked")}
              onScrollNext={() => alert("Explore Invitation Clicked")}
              attendeeName="Kavindu Perera"
              ticketId="WL 2026-001"
              tickets={[
                { id: "WL 2026-001-1", typeName: "STANDARD", price: 2000, quantity: 2, seatNo: "GENERAL ADMISSION" },
                { id: "WL 2026-001-2", typeName: "STANDARD", price: 2000, quantity: 2, seatNo: "GENERAL ADMISSION" },
              ]}
              eventName="Annual Business Summit   2026"
              eventDescription="IDEAS TODAY. OPPORTUNITIES TOMORROW"
              eventDate="12 November 2026"
              eventTime="6.00 PM Onwards"
              eventVenue="Cinnamon Lakeside Colombo"
              paymentReference="TXN987514213"
              bookingDateTime="21 Oct 2026,  03:14 PM"
              paymentMethod="Google Pay"
              theme="corporate"
            />
          )}

          {activeTab === "party-tickets" && (
            <TicketQrOverlay
              isOpen={true}
              onClose={() => alert("Back Clicked")}
              onBackToPayment={() => alert("Back to Payment Clicked")}
              onAddToCalendar={() => alert("Add to Calendar Clicked")}
              onScrollNext={() => alert("Scroll to Explore Clicked")}
              attendeeName="Kavindu Perera"
              ticketId="LN2026-0001"
              tickets={[
                { id: "LN2026-0001-1", typeName: "Standard Ticket", price: 1000 },
                { id: "LN2026-0001-2", typeName: "Standard Ticket", price: 1000 },
                { id: "LN2026-0001-3", typeName: "Standard Ticket", price: 1000 },
              ]}
              eventName="Annual Gala Night 2026"
              eventDescription="An evening celebration, networking, & entertainment."
              eventDate="Thursday, 12 November 2026"
              eventTime="6.00 PM Onwards"
              eventVenue="Cinnamon Lakeside Colombo"
              theme="party"
            />
          )}

          {activeTab === "corporate-rsvp" && (
            <div className="w-[390px] h-[844px] overflow-y-auto overflow-x-hidden relative rounded-[26px]">
              <CorporateRsvpPage
                previewBypassValidation={true}
                onRsvpSuccess={(data) => alert("Corporate RSVP Confirmed: " + JSON.stringify(data))}
              />
            </div>
          )}

          {activeTab === "party-rsvp" && (
            <div className="w-[390px] h-[844px] overflow-y-auto overflow-x-hidden relative rounded-[26px]">
              <PartyRsvpPage
                previewBypassValidation={true}
                onRsvpSuccess={(data) => alert("Party RSVP Confirmed: " + JSON.stringify(data))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
