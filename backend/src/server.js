const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const { createCorsOptions } = require("./config/cors");
const { ASSETS_ROOT } = require("./utils/invitationMedia");
const { EVENTS_ROOT } = require("./utils/eventTemplates");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const coupleRoutes = require("./routes/couple");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");

function createServer() {
  const app = express();

  app.use(express.json({ limit: "2mb" }));

  if (env.FRONTEND_ORIGIN) {
    app.use(cors(createCorsOptions(env.FRONTEND_ORIGIN)));
  } else {
    app.use(cors());
  }

  // Invitation video + couple photos (and other backend assets)
  app.use(
    "/assets",
    express.static(ASSETS_ROOT, {
      maxAge: "1d",
      setHeaders(res) {
        res.setHeader("Accept-Ranges", "bytes");
      },
    })
  );

  // Event templates + per-event resource packs
  app.use(
    "/assets/events",
    express.static(EVENTS_ROOT, {
      maxAge: "1d",
      setHeaders(res) {
        res.setHeader("Accept-Ranges", "bytes");
      },
    })
  );

  app.get("/", (req, res) => res.json({ ok: true }));
  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/couple", coupleRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/admin", adminRoutes);

  return app;
}

module.exports = { createServer };

