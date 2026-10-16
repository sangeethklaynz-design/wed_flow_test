"use client";
import React, { useState } from "react";
import CorporateInvitationExperience from "@/components/invite/corporate/template-1/InvitationWrapper";
import PartyInvitationExperience from "@/components/invite/party/template-1/InvitationWrapper";
import PaymentSuccessOverlay from "@/components/invite/corporate/template-1/overlays/PaymentSuccessOverlay";
import TicketQrOverlay from "@/components/invite/corporate/template-1/overlays/TicketQrOverlay";

export default function TicketingFlowVerificationPage() {
  const [activeTab, setActiveTab] = useState("corporate-full");

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
      </div>

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
            ticketId="LN2026-0001"
            tickets={[
              { id: "LN2026-0001-1", typeName: "Standard Ticket", price: 1000 },
              { id: "LN2026-0001-2", typeName: "Standard Ticket", price: 1000 },
              { id: "LN2026-0001-3", typeName: "Standard Ticket", price: 1000 },
            ]}
            eventName="Annual Business Summit – 2026"
            eventDescription="An evening celebration, networking, & entertainment."
            eventDate="Thursday, 12 November 2026"
            eventTime="6.00 PM Onwards"
            eventVenue="Cinnamon Lakeside Colombo"
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
      </div>
    </div>
  );
}
