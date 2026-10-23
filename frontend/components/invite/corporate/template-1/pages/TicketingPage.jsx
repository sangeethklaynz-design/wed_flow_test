"use client";

import React from "react";
import TicketingSelectionPage from "@/components/invite/common/TicketingSelectionPage";
import TicketQrOverlay from "@/components/invite/corporate/template-1/overlays/TicketQrOverlay";

export function TicketingPage(props) {
  if (props.mode === "ticket" || props.showPurchasedTickets || props.isTicketView) {
    return <TicketQrOverlay theme="corporate" isOpen={true} {...props} />;
  }
  return <TicketingSelectionPage theme="corporate" {...props} />;
}

export default TicketingPage;
