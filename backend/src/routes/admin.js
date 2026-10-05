const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  getDashboard,
  listEvents,
  createEvent,
  updateEvent,
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

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", getDashboard);
router.get("/templates", getTemplates);
router.get("/templates/:type/:templateKey/manifest", getTemplateManifest);
router.get("/events", listEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
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
