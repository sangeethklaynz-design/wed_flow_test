const express = require("express");
const {
  requireAuth,
  requirePermission,
  requireOrgOwner,
} = require("../middleware/auth");
const { getDashboard } = require("../controllers/dashboardController");
const { getInvite } = require("../controllers/inviteController");
const {
  getCoupleInvitationTemplate,
  updateCoupleInvitationTemplate,
} = require("../controllers/invitationTemplateController");
const {
  listGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
  cancelRsvp,
  resendInvite,
  markInviteShared,
  sendInviteToAll,
  togglePin,
} = require("../controllers/guestsController");
const {
  getTicketingSettings,
  toggleTicketing,
  updateTicketingSettings,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} = require("../controllers/ticketingController");
const {
  listSchedule,
  getScheduleEvent,
  createScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
  downloadSchedule,
} = require("../controllers/scheduleController");
const {
  listNotifications,
  markAllRead,
  markOneRead,
  updateNotification,
  deleteNotification,
} = require("../controllers/notificationsController");
const {
  getCouplePayments,
  connectCouplePayments,
  refreshCouplePaymentsConnect,
} = require("../controllers/eventPaymentsController");
const {
  listClientEvents,
  selectClientEvent,
} = require("../controllers/authController");
const {
  listRoles,
  updateRole,
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} = require("../controllers/staffRolesController");
const {
  getCoupleFinances,
  getCoupleFinanceTicketDetail,
} = require("../controllers/financesController");

const router = express.Router();

router.get(
  "/dashboard",
  requireAuth,
  requirePermission("viewDashboard"),
  getDashboard
);

router.get("/events", requireAuth, listClientEvents);
router.post("/events/select", requireAuth, selectClientEvent);

router.get("/roles", requireAuth, requireOrgOwner, listRoles);
router.patch("/roles/:id", requireAuth, requireOrgOwner, updateRole);
router.get("/staff", requireAuth, requireOrgOwner, listStaff);
router.post("/staff", requireAuth, requireOrgOwner, createStaff);
router.patch("/staff/:id", requireAuth, requireOrgOwner, updateStaff);
router.delete("/staff/:id", requireAuth, requireOrgOwner, deleteStaff);

router.get(
  "/finances",
  requireAuth,
  requirePermission("viewPayments"),
  getCoupleFinances
);
router.get(
  "/finances/tickets/:ticketId",
  requireAuth,
  requirePermission("viewPayments"),
  getCoupleFinanceTicketDetail
);

router.get(
  "/payments",
  requireAuth,
  requirePermission("viewPayments"),
  getCouplePayments
);
router.post(
  "/payments/connect",
  requireAuth,
  requirePermission("editPayments"),
  connectCouplePayments
);
router.post(
  "/payments/connect/refresh",
  requireAuth,
  requirePermission("editPayments"),
  refreshCouplePaymentsConnect
);

router.get("/invite", requireAuth, requirePermission("viewInvitation"), getInvite);
router.get(
  "/invitation-template",
  requireAuth,
  requirePermission("viewInvitation"),
  getCoupleInvitationTemplate
);
router.put(
  "/invitation-template",
  requireAuth,
  requirePermission("editInvitation"),
  updateCoupleInvitationTemplate
);

router.get("/guests", requireAuth, requirePermission("viewGuests"), listGuests);
router.post(
  "/guests/send-all",
  requireAuth,
  requirePermission("editGuests"),
  sendInviteToAll
);
router.get("/guests/:id", requireAuth, requirePermission("viewGuests"), getGuest);
router.post("/guests", requireAuth, requirePermission("addGuests"), createGuest);
router.put(
  "/guests/:id",
  requireAuth,
  requirePermission("editGuests"),
  updateGuest
);
router.delete(
  "/guests/:id",
  requireAuth,
  requirePermission("deleteGuests"),
  deleteGuest
);
router.post(
  "/guests/:id/cancel-rsvp",
  requireAuth,
  requirePermission("editGuests"),
  cancelRsvp
);
router.post(
  "/guests/:id/resend-invite",
  requireAuth,
  requirePermission("editGuests"),
  resendInvite
);
router.post(
  "/guests/:id/mark-invite-shared",
  requireAuth,
  requirePermission("editGuests"),
  markInviteShared
);
router.post(
  "/guests/:id/toggle-pin",
  requireAuth,
  requirePermission("editGuests"),
  togglePin
);

router.get(
  "/ticketing",
  requireAuth,
  requirePermission("viewPayments"),
  getTicketingSettings
);
router.put(
  "/ticketing/toggle",
  requireAuth,
  requireOrgOwner,
  toggleTicketing
);
router.put(
  "/ticketing/settings",
  requireAuth,
  requireOrgOwner,
  updateTicketingSettings
);
router.post(
  "/ticketing/types",
  requireAuth,
  requirePermission("editPayments"),
  createTicketType
);
router.put(
  "/ticketing/types/:id",
  requireAuth,
  requirePermission("editPayments"),
  updateTicketType
);
router.delete(
  "/ticketing/types/:id",
  requireAuth,
  requirePermission("editPayments"),
  deleteTicketType
);

router.get(
  "/schedule",
  requireAuth,
  requirePermission("viewSchedule"),
  listSchedule
);
router.get(
  "/schedule/download",
  requireAuth,
  requirePermission("viewSchedule"),
  downloadSchedule
);
router.get(
  "/schedule/:id",
  requireAuth,
  requirePermission("viewSchedule"),
  getScheduleEvent
);
router.post(
  "/schedule",
  requireAuth,
  requirePermission("editSchedule"),
  createScheduleEvent
);
router.put(
  "/schedule/:id",
  requireAuth,
  requirePermission("editSchedule"),
  updateScheduleEvent
);
router.delete(
  "/schedule/:id",
  requireAuth,
  requirePermission("editSchedule"),
  deleteScheduleEvent
);

router.get(
  "/notifications",
  requireAuth,
  requirePermission("viewNotifications"),
  listNotifications
);
router.post(
  "/notifications/mark-read",
  requireAuth,
  requirePermission("editNotifications"),
  markAllRead
);
router.post(
  "/notifications/:id/mark-read",
  requireAuth,
  requirePermission("editNotifications"),
  markOneRead
);
router.put(
  "/notifications/:id",
  requireAuth,
  requirePermission("editNotifications"),
  updateNotification
);
router.delete(
  "/notifications/:id",
  requireAuth,
  requirePermission("editNotifications"),
  deleteNotification
);

module.exports = router;
