/**
 * Party template-1 page registry (gala CSS pages).
 */

import LandingPage from "./LandingPage";
import AboutPage from "./AboutPage";
import RsvpPage from "./RsvpPage";
import SchedulePage from "./SchedulePage";
import LocationPage from "./LocationPage";
import DetailsPage from "./DetailsPage";
import SaveTheDatePage from "./SaveTheDatePage";
import RsvpChangeRequestPage from "./RsvpChangeRequestPage";

export const PARTY_PAGE_WIDTH = 390;
export const PARTY_PAGE_HEIGHT = 844;

export const PARTY_PAGE_ORDER = [
  "landing",
  "about",
  "rsvp",
  "schedule",
  "location",
  "details",
  "saveTheDate",
];

export const PARTY_PAGE_COMPONENTS = {
  landing: LandingPage,
  about: AboutPage,
  rsvp: RsvpPage,
  schedule: SchedulePage,
  location: LocationPage,
  details: DetailsPage,
  saveTheDate: SaveTheDatePage,
};

export const PARTY_PAGE_LABELS = {
  landing: "Landing",
  about: "About the event",
  rsvp: "RSVP",
  schedule: "Event schedule",
  location: "Location",
  details: "Important details",
  saveTheDate: "Save the date",
};

export {
  LandingPage,
  AboutPage,
  RsvpPage,
  SchedulePage,
  LocationPage,
  DetailsPage,
  SaveTheDatePage,
  RsvpChangeRequestPage,
};

export default PARTY_PAGE_COMPONENTS;
