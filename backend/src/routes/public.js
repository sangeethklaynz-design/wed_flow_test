const express = require("express");
const {
  getPublicInvite,
  submitPublicRsvp,
  downloadPublicSchedule,
} = require("../controllers/publicInviteController");
const {
  getGuestInvitationTemplate,
} = require("../controllers/invitationTemplateController");

const router = express.Router();

router.get("/invite/:token/invitation-template", getGuestInvitationTemplate);
router.get("/invite/:token", getPublicInvite);
router.post("/invite/:token/rsvp", submitPublicRsvp);
router.get("/invite/:token/schedule/download", downloadPublicSchedule);

module.exports = router;
