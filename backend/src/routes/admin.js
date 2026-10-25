const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  getDashboard,
  listEvents,
  listOrganizations,
  createVendorOrganization,
  createEvent,
  updateEvent,
  replaceEventTicketTiers,
  deleteEvent,
  getEventCredentials,
  regenerateEventPassword,
  getTemplates,
  getTemplateManifest,
  updateTemplateConfig,
  listEventResources,
  uploadResourceMiddleware,
  uploadEventResource,
  deleteEventResource,
} = require("../controllers/adminEventsController");
const {
  listEventTickets,
  scanEventTicket,
} = require("../controllers/adminTicketsController");
const {
  getEventPayments,
  connectEventPayments,
  refreshEventPaymentsConnect,
} = require("../controllers/eventPaymentsController");
const {
  getAdminFinances,
  getAdminFinanceTicketDetail,
  getAdminFinancesMeta,
} = require("../controllers/financesController");
const {
  getTicketingSettings,
  toggleTicketing,
  updateTicketingSettings,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} = require("../controllers/ticketingController");
const {
  listAdminGuests,
  getAdminGuestsMeta,
  getAdminGuest,
  updateAdminGuest,
  deleteAdminGuest,
} = require("../controllers/adminGuestsController");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", getDashboard);
router.get("/guests/meta", getAdminGuestsMeta);
router.get("/guests", listAdminGuests);
router.get("/guests/:id", getAdminGuest);
router.put("/guests/:id", updateAdminGuest);
router.delete("/guests/:id", deleteAdminGuest);
router.get("/finances/meta", getAdminFinancesMeta);
router.get("/finances", getAdminFinances);
router.get("/finances/tickets/:ticketId", getAdminFinanceTicketDetail);
router.get("/templates", getTemplates);
router.get("/templates/:type/:templateKey/manifest", getTemplateManifest);
router.get("/events", listEvents);
router.get("/organizations", listOrganizations);
router.post("/organizations", createVendorOrganization);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.put("/events/:id/ticket-tiers", replaceEventTicketTiers);
router.get("/events/:eventId/ticketing", getTicketingSettings);
router.put("/events/:eventId/ticketing/toggle", toggleTicketing);
router.put("/events/:eventId/ticketing/settings", updateTicketingSettings);
router.post("/events/:eventId/ticketing/types", createTicketType);
router.put("/events/:eventId/ticketing/types/:id", updateTicketType);
router.delete("/events/:eventId/ticketing/types/:id", deleteTicketType);
router.get("/events/:id/tickets", listEventTickets);
router.post("/events/:id/tickets/scan", scanEventTicket);
router.get("/events/:id/payments", getEventPayments);
router.post("/events/:id/payments/connect", connectEventPayments);
router.post("/events/:id/payments/connect/refresh", refreshEventPaymentsConnect);
router.delete("/events/:id", deleteEvent);
router.get("/events/:id/credentials", getEventCredentials);
router.post("/events/:id/credentials/regenerate", regenerateEventPassword);
router.put("/events/:id/template-config", updateTemplateConfig);
router.get("/events/:id/resources", listEventResources);
router.post(
  "/events/:id/resources/:kind",
  uploadResourceMiddleware,
  uploadEventResource
);
router.delete("/events/:id/resources/:kind/:filename", deleteEventResource);

module.exports = router;
