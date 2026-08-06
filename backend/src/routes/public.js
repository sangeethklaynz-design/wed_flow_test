const express = require("express");
const {
  getPublicInvite,
  submitPublicRsvp,
} = require("../controllers/publicInviteController");

const router = express.Router();

router.get("/invite/:token", getPublicInvite);
router.post("/invite/:token/rsvp", submitPublicRsvp);

module.exports = router;
