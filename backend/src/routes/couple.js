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
} = require("../controllers/guestsController");
const {
  listSchedule,
  getScheduleEvent,
  createScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
  downloadSchedule,
} = require("../controllers/scheduleController");

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

router.get("/schedule", requireAuth, listSchedule);
router.get("/schedule/download", requireAuth, downloadSchedule);
router.get("/schedule/:id", requireAuth, getScheduleEvent);
router.post("/schedule", requireAuth, createScheduleEvent);
router.put("/schedule/:id", requireAuth, updateScheduleEvent);
router.delete("/schedule/:id", requireAuth, deleteScheduleEvent);

module.exports = router;
