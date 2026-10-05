/**
 * Resolve invitation renderer by event type + template key.
 */

import InvitationExperienceSafe from "@/components/invite/InvitationExperienceSafe";
import CorporateInvitationExperience from "@/components/invite/corporate/template-1/InvitationWrapper";
import PartyInvitationExperience from "@/components/invite/party/template-1/InvitationWrapper";

export function resolveInviteRenderer(eventType, templateKey = "template-1") {
  const type = String(eventType || "wedding").toLowerCase();
  const key = String(templateKey || "template-1").toLowerCase();

  if (type === "corporate" && (key === "template-1" || !key)) {
    return {
      kind: "corporate",
      Experience: CorporateInvitationExperience,
    };
  }

  if (type === "party" && (key === "template-1" || !key)) {
    return {
      kind: "party",
      Experience: PartyInvitationExperience,
    };
  }

  return {
    kind: "wedding",
    Experience: InvitationExperienceSafe,
  };
}

export function InviteByType({
  eventType,
  templateKey,
  templateData,
  guestToken = null,
  interactive = false,
  embedded = false,
  templateConfig = null,
}) {
  const { kind, Experience } = resolveInviteRenderer(eventType, templateKey);

  if (kind === "corporate" || kind === "party") {
    return (
      <Experience
        templateData={templateData}
        templateConfig={
          templateConfig ||
          templateData?.static?.templateConfig ||
          templateData?.templateConfig ||
          null
        }
        embedded={embedded}
        interactive={interactive}
        guestToken={guestToken}
      />
    );
  }

  return (
    <Experience
      templateData={templateData}
      guestToken={guestToken}
      interactive={interactive}
    />
  );
}

export default resolveInviteRenderer;
