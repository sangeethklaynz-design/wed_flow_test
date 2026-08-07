const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const { ASSETS_ROOT } = require("./utils/invitationMedia");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const coupleRoutes = require("./routes/couple");
const publicRoutes = require("./routes/public");

function createServer() {
  const app = express();

  app.use(express.json());

  if (env.FRONTEND_ORIGIN) {
    app.use(
      cors({
        origin: env.FRONTEND_ORIGIN,
        credentials: true,
      })
    );
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

  app.get("/", (req, res) => res.json({ ok: true }));
  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/couple", coupleRoutes);
  app.use("/api/public", publicRoutes);

  return app;
}

module.exports = { createServer };

