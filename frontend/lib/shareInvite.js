export function getInviteBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function buildGuestInviteShare(guest, baseUrl = getInviteBaseUrl()) {
  const inviteUrl = guest?.uniqueToken
    ? `${baseUrl}/i/${guest.uniqueToken}`
    : "";
  const text = inviteUrl
    ? `You're invited to our wedding! Open your invitation and RSVP here:\n${inviteUrl}`
    : `You're invited! Please RSVP — ${guest?.name || "Guest"}`;

  return {
    inviteUrl,
    text,
    title: "Wedding Invite",
    subject: "You're invited to our wedding",
  };
}

export async function shareGuestInviteNative(guest, baseUrl = getInviteBaseUrl()) {
  const { inviteUrl, text, title } = buildGuestInviteShare(guest, baseUrl);

  if (typeof navigator === "undefined" || !navigator.share) {
    return { ok: false, reason: "unsupported" };
  }

  const shareData = inviteUrl
    ? {
        title,
        text: "You're invited to our wedding! Open your invitation and RSVP here:",
        url: inviteUrl,
      }
    : { title, text };

  if (navigator.canShare && !navigator.canShare(shareData)) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    await navigator.share(shareData);
    return { ok: true, reason: "shared" };
  } catch (err) {
    if (err?.name === "AbortError") {
      return { ok: false, reason: "cancelled" };
    }
    return { ok: false, reason: "failed" };
  }
}

export function getWhatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getMessengerShareUrl(url) {
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&display=popup&redirect_uri=${encodeURIComponent(url)}`;
}

export function getFacebookShareUrl(url) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getEmailShareUrl(subject, body) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyInviteText(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}
