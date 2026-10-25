const express = require("express");
const {
  getPublicInvite,
  submitPublicRsvp,
  downloadPublicSchedule,
  submitChangeRequest,
} = require("../controllers/publicInviteController");
const {
  getGuestInvitationTemplate,
} = require("../controllers/invitationTemplateController");
const {
  createTicketCheckout,
  demoCompleteTicketOrder,
  startTicketOrderPay,
  confirmTicketPayment,
  getTicketOrder,
} = require("../controllers/publicTicketsController");
const {
  getPublicEventInvite,
  submitPublicEventRsvp,
} = require("../controllers/publicEventInviteController");
const {
  marketplacePay,
  getPaymentsPublicStatus,
} = require("../controllers/marketplaceCheckoutController");

const router = express.Router();

router.get("/p/:token", getPublicEventInvite);
router.post("/p/:token/rsvp", submitPublicEventRsvp);

router.get("/invite/:token/invitation-template", getGuestInvitationTemplate);
router.get("/invite/:token", getPublicInvite);
router.post("/invite/:token/rsvp", submitPublicRsvp);
router.get("/invite/:token/schedule/download", downloadPublicSchedule);
router.post("/invite/:token/rsvp-change-request", submitChangeRequest);
router.post("/invite/:token/ticket-checkout", createTicketCheckout);
router.post(
  "/invite/:token/ticket-orders/:orderId/demo-complete",
  demoCompleteTicketOrder
);
router.post("/ticket-orders/:orderId/pay", startTicketOrderPay);
router.post("/ticket-orders/:orderId/confirm-payment", confirmTicketPayment);
router.get("/ticket-orders/:orderId", getTicketOrder);

/** Marketplace Google Pay + Stripe Connect (gated by PAYMENTS_LIVE) */
router.get("/checkout/payments-status", getPaymentsPublicStatus);
router.post("/checkout/marketplace-pay", marketplacePay);

module.exports = router;
