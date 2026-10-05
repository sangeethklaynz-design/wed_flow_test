/**
 * Corporate template-1 page module index (mirrors wedding template-1/pages).
 * Each pageId maps to a React page under
 * components/invite/corporate/template-1/pages/.
 */

export {
  CORPORATE_TEMPLATE_1_MANIFEST as default,
  CORPORATE_TEMPLATE_1_MANIFEST,
  dynamicField,
  invitePage,
} from "../manifest";

export const PAGE_MODULES = {
  landing: "pages/LandingPage.jsx",
  eventDetails: "pages/EventDetailsPage.jsx",
  rsvp: "pages/RsvpPage.jsx",
  agenda: "pages/EventAgendaPage.jsx",
  location: "pages/EventLocationPage.jsx",
  resources: "pages/EventResourcesPage.jsx",
  addToCalendar: "pages/AddToCalendarPage.jsx",
};

export const PAGE_ORDER = [
  "landing",
  "eventDetails",
  "rsvp",
  "agenda",
  "location",
  "resources",
  "addToCalendar",
];
