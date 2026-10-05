/**
 * Party template-1 page module index.
 * Each pageId maps to a React page under
 * components/invite/party/template-1/pages/.
 */

export {
  PARTY_TEMPLATE_1_MANIFEST as default,
  PARTY_TEMPLATE_1_MANIFEST,
  dynamicField,
  invitePage,
} from "../manifest";

export const PAGE_MODULES = {
  landing: "pages/LandingPage.jsx",
  about: "pages/AboutPage.jsx",
  rsvp: "pages/RsvpPage.jsx",
  schedule: "pages/SchedulePage.jsx",
  location: "pages/LocationPage.jsx",
  details: "pages/DetailsPage.jsx",
  saveTheDate: "pages/SaveTheDatePage.jsx",
};

export const PAGE_ORDER = [
  "landing",
  "about",
  "rsvp",
  "schedule",
  "location",
  "details",
  "saveTheDate",
];
