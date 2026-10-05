/**
 * Wedding template-1 page module index.
 * Each pageId is tagged in InvitationExperience / InvitationPage via invitePage().
 * Dynamic fields are tagged with dynamicField(id) and listed in ./manifest.js.
 */
export {
  WEDDING_TEMPLATE_1_MANIFEST as default,
  WEDDING_TEMPLATE_1_MANIFEST,
  dynamicField,
  invitePage,
} from "./manifest";

export const PAGE_MODULES = {
  openingVideo: "InvitationExperience (video + music shell)",
  starting: "InvitationPage landing band",
  rsvp: "InvitationPage RSVP band",
  allDetails: "InvitationPage details band",
  ourStory: "InvitationPage story band",
  bigDay: "InvitationPage big day band",
  journey: "InvitationPage journey / gallery band",
  closing: "InvitationPage closing band",
};
