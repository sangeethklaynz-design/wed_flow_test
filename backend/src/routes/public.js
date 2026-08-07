const express = require("express");
const {
  getPublicInvite,
  submitPublicRsvp,
} = require("../controllers/publicInviteController");
const {
  getGuestInvitationTemplate,
} = require("../controllers/invitationTemplateController");

const router = express.Router();

router.get("/invite/:token/invitation-template", getGuestInvitationTemplate);
router.get("/invite/:token", getPublicInvite);
router.post("/invite/:token/rsvp", submitPublicRsvp);

module.exports = router;
