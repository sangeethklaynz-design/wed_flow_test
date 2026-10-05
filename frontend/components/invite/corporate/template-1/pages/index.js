/**
 * Corporate template-1 strict page registry.
 * Each pageId is a fixed 390×844 snap screen (tagged with data-invite-page).
 */

import { LandingPage } from "./LandingPage";
import { EventDetailsPage } from "./EventDetailsPage";
import { RsvpPage } from "./RsvpPage";
import { EventAgendaPage } from "./EventAgendaPage";
import { EventLocationPage } from "./EventLocationPage";
import { EventResourcesPage } from "./EventResourcesPage";
import { AddToCalendarPage } from "./AddToCalendarPage";

export const CORPORATE_PAGE_WIDTH = 390;
export const CORPORATE_PAGE_HEIGHT = 844;

/** Guest scroll order (matches manifest pages). */
export const CORPORATE_PAGE_ORDER = [
  "landing",
  "eventDetails",
  "rsvp",
  "agenda",
  "location",
  "resources",
  "addToCalendar",
];

export const CORPORATE_PAGE_COMPONENTS = {
  landing: LandingPage,
  eventDetails: EventDetailsPage,
  rsvp: RsvpPage,
  agenda: EventAgendaPage,
  location: EventLocationPage,
  resources: EventResourcesPage,
  addToCalendar: AddToCalendarPage,
};

export const CORPORATE_PAGE_LABELS = {
  landing: "Landing",
  eventDetails: "Event details",
  rsvp: "RSVP",
  agenda: "Event agenda",
  location: "Location",
  resources: "Resources",
  addToCalendar: "Add to calendar",
};

export {
  LandingPage,
  EventDetailsPage,
  RsvpPage,
  EventAgendaPage,
  EventLocationPage,
  EventResourcesPage,
  AddToCalendarPage,
};

export default CORPORATE_PAGE_COMPONENTS;
