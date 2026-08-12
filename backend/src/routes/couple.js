const express = require("express");
const { requireAuth } = require("../middleware/auth");
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
  togglePin,
} = require("../controllers/guestsController");
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
  deleteNotification
} = require("../controllers/notificationsController");

const router = express.Router();

router.get("/dashboard", requireAuth, getDashboard);
router.get("/invite", requireAuth, getInvite);
router.get("/invitation-template", requireAuth, getCoupleInvitationTemplate);
router.put("/invitation-template", requireAuth, updateCoupleInvitationTemplate);

router.get("/guests", requireAuth, listGuests);
router.get("/guests/:id", requireAuth, getGuest);
router.post("/guests", requireAuth, createGuest);
router.put("/guests/:id", requireAuth, updateGuest);
router.delete("/guests/:id", requireAuth, deleteGuest);
router.post("/guests/:id/cancel-rsvp", requireAuth, cancelRsvp);
router.post("/guests/:id/resend-invite", requireAuth, resendInvite);
router.post("/guests/:id/mark-invite-shared", requireAuth, markInviteShared);
router.post("/guests/:id/toggle-pin", requireAuth, togglePin);

router.get("/schedule", requireAuth, listSchedule);
router.get("/schedule/download", requireAuth, downloadSchedule);
router.get("/schedule/:id", requireAuth, getScheduleEvent);
router.post("/schedule", requireAuth, createScheduleEvent);
router.put("/schedule/:id", requireAuth, updateScheduleEvent);
router.delete("/schedule/:id", requireAuth, deleteScheduleEvent);

router.get("/notifications", requireAuth, listNotifications);
router.post("/notifications/mark-read", requireAuth, markAllRead);
router.post("/notifications/:id/mark-read", requireAuth, markOneRead);
router.put("/notifications/:id", requireAuth, updateNotification);
router.delete("/notifications/:id", requireAuth, deleteNotification);

module.exports = router;
