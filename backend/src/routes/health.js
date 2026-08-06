const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

module.exports = router;

