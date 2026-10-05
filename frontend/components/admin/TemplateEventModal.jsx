"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Plus, Trash2, Upload, X } from "lucide-react";
import { apiRequest, getApiBaseUrl } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { buildAdminInvitePreviewData } from "@/lib/adminInvitePreview";
import { resolvePageBand } from "@/lib/inviteLayoutMetrics";
import InvitationPage from "@/components/invite/InvitationPage";
import CorporateInvitationExperience, {
  CorporatePagePreview,
} from "@/components/invite/corporate/template-1/InvitationWrapper";
import PartyInvitationExperience, {
  PartyPagePreview,
} from "@/components/invite/party/template-1/InvitationWrapper";
import InvitationBackgroundMusic from "@/components/invite/InvitationBackgroundMusic";
import InvitationSchedule from "@/components/invite/InvitationSchedule";
import InvitationThankYou from "@/components/invite/InvitationThankYou";
import { RsvpConfirmationOverlay } from "@/components/invite/corporate/template-1/overlays/RsvpConfirmationOverlay";
import { PaymentSuccessOverlay } from "@/components/invite/corporate/template-1/overlays/PaymentSuccessOverlay";
import PartyRsvpConfirmationPage from "@/components/invite/party/template-1/pages/RsvpConfirmationPage";
import PartyPaymentSuccessPage from "@/components/invite/party/template-1/pages/PaymentSuccessPage";
import InvitationVideoIntro, {
  INVITE_FRAME_H,
} from "@/components/invite/InvitationVideoIntro";

function emptyConfigFromManifest(manifest) {
  const pages = {};
  for (const page of manifest?.pages || []) {
    pages[page.id] = page.defaultEnabled !== false;
  }
  const fields = {};
  for (const field of manifest?.dynamicFields || []) {
    if (field.defaultValue !== undefined) {
      fields[field.id] = structuredClone
        ? structuredClone(field.defaultValue)
        : JSON.parse(JSON.stringify(field.defaultValue));
    }
  }
  return { pages, fields };
}

/** App-navy tokens previously forced onto wedding invites — map back to legacy defaults. */
const WEDDING_NAVY_TO_LEGACY = {
  "#054380": "#7732A4",
  "#eaf5ff": "#FAF6F0",
};

function normalizeWeddingColorFields(fields, eventType) {
  if (String(eventType || "").toLowerCase() !== "wedding" || !fields) {
    return fields || {};
  }
  const next = { ...fields };
  const colorKeys = [
    "colorLandingNames",
    "colorPageTitle",
    "colorSubtitle",
    "colorBodyText",
    "colorIconFill",
    "colorPrimary",
    "colorAccent",
    "colorSurface",
    "gradientTop",
    "gradientMid",
    "gradientBottom",
  ];
  for (const key of colorKeys) {
    const raw = String(next[key] || "").trim();
    if (!raw) continue;
    const mapped = WEDDING_NAVY_TO_LEGACY[raw.toLowerCase()];
    if (mapped) next[key] = mapped;
  }
  if (next.colorPrimary && !next.colorLandingNames) {
    next.colorLandingNames = next.colorPrimary;
  }
  if (next.colorPrimary && !next.colorPageTitle) {
    next.colorPageTitle = next.colorPrimary;
  }
  return next;
}

function pagesForPageDropdown(manifest, eventType) {
  const pages = manifest?.pages || [];
  if (String(eventType || "").toLowerCase() !== "wedding") {
    return pages;
  }
  return pages.filter((p) => p.id !== "openingVideo");
}

function defaultSelectedPageId(manifest, eventType) {
  const pages = pagesForPageDropdown(manifest, eventType);
  return pages[0]?.id || "";
}

function mediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getApiBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

const INVITE_WIDTH = 390;

const FULL_TEMPLATE_ID = "fullTemplate";

const FULL_TEMPLATE_FIELDS_BY_TYPE = {
  wedding: new Set([
    "openingVideo",
    "backgroundMusic",
    "landingBackground",
    "colorLandingNames",
    "colorPageTitle",
    "colorSubtitle",
    "colorBodyText",
    "colorIconFill",
    "colorAccent",
    "colorSurface",
    "gradientTop",
    "gradientMid",
    "gradientBottom",
  ]),
  corporate: new Set([
    "openingVideo",
    "backgroundMusic",
    "landingBackground",
    "colorTextPrimary",
    "colorTextHighlight",
    "gradientTop",
    "gradientMid",
    "gradientBottom",
  ]),
  party: new Set([
    "openingVideo",
    "backgroundMusic",
    "landingBackground",
    "colorLandingEyebrow",
    "colorPageTitle",
    "colorPageAccent",
    "colorBodyText",
    "gradientTop",
    "gradientMid",
    "gradientBottom",
  ]),
};

function fullTemplateFieldIds(eventType) {
  const type = String(eventType || "wedding").toLowerCase();
  return FULL_TEMPLATE_FIELDS_BY_TYPE[type] || FULL_TEMPLATE_FIELDS_BY_TYPE.wedding;
}

/** Preview chrome for post-RSVP screens (one page at a time). */
function PreviewFlowChrome({ title, onBack, onContinue, continueLabel, children }) {
  return (
    <div className="w-full" style={{ width: INVITE_WIDTH }}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-white">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-medium text-[#054380] hover:underline"
        >
          ← Back to RSVP
        </button>
        <span className="text-[11px] text-muted">{title}</span>
        {onContinue ? (
          <button
            type="button"
            onClick={onContinue}
            className="text-xs font-medium text-[#054380] hover:underline"
          >
            {continueLabel || "Continue →"}
          </button>
        ) : (
          <span className="w-[88px]" />
        )}
      </div>
      {children}
    </div>
  );
}

/** Single-page preview: wedding band clip, or corporate strict 390×844 page. */
function PageOnlyPreview({
  templateData,
  config,
  pageId,
  onRsvpSuccess,
  eventType,
}) {
  const type = String(eventType || "").toLowerCase();
  if (type === "corporate") {
    return (
      <CorporatePagePreview
        pageId={pageId}
        templateData={templateData}
        templateConfig={config}
        interactive={pageId === "rsvp"}
        onRsvpSuccess={pageId === "rsvp" ? onRsvpSuccess : null}
        previewBypassValidation={pageId === "rsvp"}
        documentFiles={templateData?.static?.documents || []}
      />
    );
  }
  if (type === "party") {
    return (
      <PartyPagePreview
        pageId={pageId}
        templateData={templateData}
        templateConfig={config}
        interactive={pageId === "rsvp"}
        onRsvpSuccess={pageId === "rsvp" ? onRsvpSuccess : null}
        previewBypassValidation={pageId === "rsvp"}
      />
    );
  }

  const band = resolvePageBand(pageId, config);
  const allowInteract = pageId === "rsvp";

  return (
    <div
      className="relative overflow-hidden bg-[#FAF6F0]"
      style={{ width: INVITE_WIDTH, height: band.height }}
    >
      <div
        className="absolute left-0 top-0"
        style={{ transform: `translateY(-${band.top}px)` }}
      >
        <InvitationPage
          data={templateData}
          interactive={allowInteract}
          embedded
          templateConfig={config}
          onRsvpSuccess={allowInteract ? onRsvpSuccess : null}
          previewBypassValidation={allowInteract}
        />
      </div>
    </div>
  );
}

function FullTemplatePreview({ templateData, config, onRsvpSuccess, eventType }) {
  const type = String(eventType || "").toLowerCase();
  if (type === "corporate") {
    return (
      <div className="relative w-full bg-[#E5F3FD]" style={{ width: INVITE_WIDTH }}>
        <CorporateInvitationExperience
          templateData={templateData}
          templateConfig={config}
          embedded
          interactive
          onRsvpSuccess={onRsvpSuccess}
          previewBypassValidation
        />
      </div>
    );
  }
  if (type === "party") {
    return (
      <div className="relative w-full bg-[#0a1628]" style={{ width: INVITE_WIDTH }}>
        <PartyInvitationExperience
          templateData={templateData}
          templateConfig={config}
          embedded
          interactive
          onRsvpSuccess={onRsvpSuccess}
          previewBypassValidation
        />
      </div>
    );
  }

  const musicUrl =
    templateData?.static?.music?.hasMusic && templateData?.static?.music?.url
      ? templateData.static.music.url
      : null;

  return (
    <div className="relative w-full bg-[#FAF6F0]" style={{ width: INVITE_WIDTH }}>
      <InvitationBackgroundMusic
        musicUrl={musicUrl}
        active={Boolean(musicUrl)}
        showMuteButton
        usePortal={false}
      />
      <InvitationPage
        data={templateData}
        interactive
        embedded
        templateConfig={config}
        onRsvpSuccess={onRsvpSuccess}
        previewBypassValidation
      />
    </div>
  );
}

/** Standard preview pane — scrollable, invitation-width, black frame on all sides. */
function PreviewPane({ children }) {
  return (
    <div className="w-full h-full min-h-[360px] overflow-y-auto overflow-x-auto rounded-2xl border border-border bg-white">
      <div className="min-h-full flex justify-center p-4 sm:p-5">
        <div
          className="shrink-0 box-border bg-white"
          style={{
            width: INVITE_WIDTH + 2,
            border: "1px solid #000000",
          }}
        >
          <div
            className="overflow-hidden"
            style={{ width: INVITE_WIDTH }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplateEventModal({ open, onClose, event, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [manifest, setManifest] = useState(null);
  const [config, setConfig] = useState({ pages: {}, fields: {} });
  const [resources, setResources] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState("");
  /** "page" | "schedule" | "thankYou" — post-RSVP flow, one screen at a time */
  const [previewFlow, setPreviewFlow] = useState("page");

  const resourcePackId = event?.resourcePackId || event?.id || "";

  const load = useCallback(async () => {
    if (!event?.id) return;
    const token = getAccessToken();
    setLoading(true);
    setError("");
    try {
      const templatesRes = await apiRequest(
        `/api/admin/templates?type=${encodeURIComponent(event.type)}`,
        { token }
      );

      if (
        !event.templateKey ||
        !(templatesRes.templates || []).includes(event.templateKey)
      ) {
        setManifest(null);
        setError(
          templatesRes.templates?.length
            ? "Selected template is missing a manifest."
            : "No invitation templates are available for this event type yet."
        );
        return;
      }

      const packId = event.resourcePackId || event.id;
      const [manifestRes, resourcesRes] = await Promise.all([
        apiRequest(
          `/api/admin/templates/${encodeURIComponent(event.type)}/${encodeURIComponent(event.templateKey)}/manifest`,
          { token }
        ),
        apiRequest(`/api/admin/events/${event.id}/resources`, { token }),
      ]);

      const m = manifestRes.manifest;
      setManifest(m);
      const defaults = emptyConfigFromManifest(m);
      const existing = event.templateConfig || {};
      setConfig({
        pages: { ...defaults.pages, ...(existing.pages || {}) },
        fields: normalizeWeddingColorFields(
          { ...defaults.fields, ...(existing.fields || {}) },
          event.type
        ),
      });
      setResources(resourcesRes);
      setSelectedPageId(defaultSelectedPageId(m, event.type));
      void packId;
    } catch (err) {
      setManifest(null);
      setError(err.message || "Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prev;
    };
  }, [open, load]);

  useEffect(() => {
    setPreviewFlow("page");
  }, [selectedPageId, open]);

  const isFullTemplate = selectedPageId === FULL_TEMPLATE_ID;

  const pageFields = useMemo(() => {
    if (!manifest || !selectedPageId) return [];
    const fields = manifest.dynamicFields || [];
    const fullIds = fullTemplateFieldIds(event?.type);
    if (selectedPageId === FULL_TEMPLATE_ID) {
      return fields.filter((f) => fullIds.has(f.id));
    }
    return fields.filter(
      (f) => f.pageId === selectedPageId && !fullIds.has(f.id)
    );
  }, [manifest, selectedPageId, event?.type]);

  const previewData = useMemo(
    () => buildAdminInvitePreviewData(event, config, resources),
    [event, config, resources]
  );

  const pageEnabled =
    isFullTemplate || config.pages?.[selectedPageId] !== false;
  const hasOpeningVideo = Boolean(previewData?.static?.video?.hasVideo);

  const previewScheduleEvents = useMemo(() => {
    return previewData?.static?.scheduleEvents || [];
  }, [previewData?.static?.scheduleEvents]);

  const handlePreviewRsvpSuccess = useCallback(() => {
    const type = String(event?.type || "wedding").toLowerCase();
    if (type === "corporate" || type === "party") {
      setPreviewFlow("confirm");
      return;
    }
    setPreviewFlow("schedule");
  }, [event?.type]);

  const eventTypeLower = String(event?.type || "wedding").toLowerCase();
  const isSnapInvite =
    eventTypeLower === "corporate" || eventTypeLower === "party";

  const setFieldValue = (fieldId, value) => {
    setConfig((prev) => ({
      ...prev,
      fields: { ...prev.fields, [fieldId]: value },
    }));
  };

  const handleUpload = async (kind, file) => {
    if (!file || !event?.id) return null;
    const token = getAccessToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `${getApiBaseUrl()}/api/admin/events/${event.id}/resources/${kind}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Upload failed");
    }
    setResources(data.resources);
    return data.file?.filename || null;
  };

  const handleSave = async () => {
    if (!event?.id) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/admin/events/${event.id}/template-config`, {
        method: "PUT",
        token: getAccessToken(),
        body: {
          templateConfig: config,
          resourcePackId,
        },
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save template config");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-event-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="absolute inset-0 md:left-64 p-4 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto relative w-full h-full bg-cream rounded-[28px] card-shadow flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-4 shrink-0">
          <div className="min-w-0 flex-1">
            <h2
              id="template-event-title"
              className="font-serif font-bold text-xl text-navy mb-1"
            >
              Template
            </h2>
            <p className="text-muted text-sm">
              Configure invitation pages and dynamic content for{" "}
              <span className="font-medium text-navy">{event?.name}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-11 h-11 rounded-xl border border-border bg-white hover:bg-cream transition-colors flex items-center justify-center text-navy"
            aria-label="Close"
          >
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-6 sm:px-8 pb-2">
          {loading ? (
            <p className="text-sm text-muted text-center py-8">Loading template…</p>
          ) : null}

          {error ? (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
              {error}
            </div>
          ) : null}

          {manifest ? (
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 h-full min-h-0">
              <div className="space-y-5 order-2 lg:order-1 overflow-y-auto min-h-0 pr-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted block">
                    Page
                  </label>
                  <select
                    value={selectedPageId}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50"
                  >
                    <option value={FULL_TEMPLATE_ID}>Full template</option>
                    {pagesForPageDropdown(manifest, event?.type).map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPageId && !isFullTemplate ? (
                  <div className="bg-white rounded-2xl border border-border p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-navy">Page enabled</p>
                      <p className="text-xs text-muted mt-0.5">
                        Disabled pages are hidden from the guest invitation.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pageEnabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            pages: {
                              ...prev.pages,
                              [selectedPageId]: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded border-border text-navy focus:ring-[#054380]/50"
                      />
                      <span className="text-sm text-navy">
                        {pageEnabled ? "On" : "Off"}
                      </span>
                    </label>
                  </div>
                ) : null}

                {isFullTemplate ? (
                  <div className="bg-white rounded-2xl border border-border p-4">
                    <p className="text-sm font-medium text-navy">Global template settings</p>
                    <p className="text-xs text-muted mt-1">
                      {eventTypeLower === "wedding"
                        ? "Global media, gradients, landing background, and text colors used on the invitation (names, titles, subtitles, body, icons)."
                        : eventTypeLower === "corporate"
                          ? "Global media, gradients, landing background, and corporate text colors (headings and highlight)."
                          : "Global media, gradients, landing background, and party text colors (landing eyebrow, titles, accent, body)."}
                    </p>
                  </div>
                ) : selectedPageId === "location" &&
                  (eventTypeLower === "party" || eventTypeLower === "corporate") ? (
                  <div className="bg-white rounded-2xl border border-border p-4">
                    <p className="text-sm font-medium text-navy">Location page</p>
                    <p className="text-xs text-muted mt-1">
                      Venue, address, and maps come from Edit event. Page title and
                      optional area label are editable below.
                    </p>
                  </div>
                ) : selectedPageId === "saveTheDate" &&
                  eventTypeLower === "party" ? (
                  <div className="bg-white rounded-2xl border border-border p-4">
                    <p className="text-sm font-medium text-navy">Save the date</p>
                    <p className="text-xs text-muted mt-1">
                      Title and subtitle are fixed. Add or remove calendar options
                      (Google, Apple, Outlook, or a custom link) below. Event name
                      and details for calendar invites come from the event.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {pageFields.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">
                      {isFullTemplate
                        ? "No global fields available."
                        : "No dynamic fields on this page (static content only)."}
                    </p>
                  ) : (
                    pageFields.map((field) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        value={config.fields?.[field.id]}
                        onChange={(v) => setFieldValue(field.id, v)}
                        resources={resources}
                        onUpload={handleUpload}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="order-1 lg:order-2 flex flex-col gap-3 min-h-[420px] lg:min-h-0 h-full overflow-hidden">
                <p className="text-sm font-medium text-muted shrink-0">Live preview</p>
                <div className="flex-1 min-h-0">
                  <PreviewPane>
                    {previewFlow === "schedule" && !isSnapInvite ? (
                      <PreviewFlowChrome
                        title="Schedule"
                        onBack={() => setPreviewFlow("page")}
                        onContinue={() => setPreviewFlow("thankYou")}
                        continueLabel="Thank you →"
                      >
                        <InvitationSchedule events={previewScheduleEvents} />
                      </PreviewFlowChrome>
                    ) : previewFlow === "thankYou" && !isSnapInvite ? (
                      <PreviewFlowChrome
                        title="Thank you"
                        onBack={() => setPreviewFlow("page")}
                        onContinue={() => setPreviewFlow("page")}
                        continueLabel="Back to RSVP"
                      >
                        <InvitationThankYou />
                      </PreviewFlowChrome>
                    ) : previewFlow === "confirm" &&
                      eventTypeLower === "corporate" ? (
                      <PreviewFlowChrome
                        title="RSVP confirmation"
                        onBack={() => setPreviewFlow("page")}
                        onContinue={() => setPreviewFlow("payment")}
                        continueLabel="Payment →"
                      >
                        <div
                          className="relative overflow-hidden"
                          style={{ width: INVITE_WIDTH, height: 844 }}
                        >
                          <RsvpConfirmationOverlay
                            isOpen
                            onClose={() => setPreviewFlow("page")}
                            onProceedToPayment={() => setPreviewFlow("payment")}
                          />
                        </div>
                      </PreviewFlowChrome>
                    ) : previewFlow === "payment" &&
                      eventTypeLower === "corporate" ? (
                      <PreviewFlowChrome
                        title="Payment success"
                        onBack={() => setPreviewFlow("confirm")}
                        onContinue={() => setPreviewFlow("page")}
                        continueLabel="Back to invite"
                      >
                        <div
                          className="relative overflow-hidden"
                          style={{ width: INVITE_WIDTH, height: 844 }}
                        >
                          <PaymentSuccessOverlay
                            isOpen
                            onClose={() => setPreviewFlow("page")}
                            onBackToRsvp={() => setPreviewFlow("confirm")}
                            onAddToCalendar={() => setPreviewFlow("page")}
                            onViewTicket={() => setPreviewFlow("page")}
                          />
                        </div>
                      </PreviewFlowChrome>
                    ) : previewFlow === "confirm" &&
                      eventTypeLower === "party" ? (
                      <PreviewFlowChrome
                        title="RSVP confirmation"
                        onBack={() => setPreviewFlow("page")}
                        onContinue={() => setPreviewFlow("payment")}
                        continueLabel="Payment →"
                      >
                        <div
                          className="relative overflow-hidden bg-[#0a1628]"
                          style={{ width: INVITE_WIDTH, height: 844 }}
                        >
                          <PartyRsvpConfirmationPage
                            contentScale={1}
                            canAttend
                            onBackToInvite={() => setPreviewFlow("page")}
                            onProceedToPayment={() => setPreviewFlow("payment")}
                            onSaveSchedule={() => {}}
                          />
                        </div>
                      </PreviewFlowChrome>
                    ) : previewFlow === "payment" &&
                      eventTypeLower === "party" ? (
                      <PreviewFlowChrome
                        title="Payment success"
                        onBack={() => setPreviewFlow("confirm")}
                        onContinue={() => setPreviewFlow("page")}
                        continueLabel="Back to invite"
                      >
                        <div
                          className="relative overflow-hidden bg-[#0a1628]"
                          style={{ width: INVITE_WIDTH, height: 844 }}
                        >
                          <PartyPaymentSuccessPage
                            contentScale={1}
                            onAddToCalendar={() => setPreviewFlow("page")}
                            onBackToInvite={() => setPreviewFlow("page")}
                          />
                        </div>
                      </PreviewFlowChrome>
                    ) : isFullTemplate ? (
                      <FullTemplatePreview
                        key={`full-${event?.type}-${JSON.stringify(config.fields)}-${resources?.music?.[0]?.url || ""}`}
                        templateData={previewData}
                        config={config}
                        eventType={event?.type}
                        onRsvpSuccess={handlePreviewRsvpSuccess}
                      />
                    ) : !pageEnabled ? (
                      <div
                        className="flex items-center justify-center p-8 text-center bg-[#EAF5FF]"
                        style={{ width: INVITE_WIDTH, minHeight: 320 }}
                      >
                        <div>
                          <p className="font-serif font-bold text-navy text-lg mb-2">
                            Page disabled
                          </p>
                          <p className="text-sm text-muted">
                            Turn the page on to preview it in the invitation.
                          </p>
                        </div>
                      </div>
                    ) : selectedPageId === "openingVideo" ? (
                      hasOpeningVideo ? (
                        <div
                          className="relative w-full overflow-hidden bg-black"
                          style={{
                            width: INVITE_WIDTH,
                            height: INVITE_FRAME_H,
                          }}
                        >
                          <InvitationVideoIntro
                            key={previewData.static.video.url}
                            videoUrl={previewData.static.video.url}
                            autoPlay
                            showSkipButton={false}
                            onFadeStart={() => {}}
                            onComplete={() => {}}
                            onSkip={() => {}}
                          />
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center p-8 text-center bg-[#EAF5FF]"
                          style={{ width: INVITE_WIDTH, minHeight: 320 }}
                        >
                          <p className="text-sm text-muted">
                            Upload an opening video to preview this page.
                          </p>
                        </div>
                      )
                    ) : (
                      <PageOnlyPreview
                        key={`${selectedPageId}-${event?.type}-${JSON.stringify(config.fields)}-${resources?.images?.length || 0}`}
                        templateData={previewData}
                        config={config}
                        pageId={selectedPageId}
                        eventType={event?.type}
                        onRsvpSuccess={handlePreviewRsvpSuccess}
                      />
                    )}
                  </PreviewPane>
                </div>
                <p className="text-[11px] text-muted shrink-0">
                  {previewFlow !== "page"
                    ? "Post-RSVP screen — one page at a time. Use Continue or Back to RSVP."
                    : isFullTemplate
                      ? ["corporate", "party"].includes(
                          String(event?.type || "").toLowerCase()
                        )
                        ? `Full ${event.type} invitation. Scroll the pages. Payment overlays stay mocked where applicable.`
                        : "Full invitation preview. Scroll to review every page. RSVP controls work here."
                      : ["corporate", "party"].includes(
                          String(event?.type || "").toLowerCase()
                        )
                        ? `Selected ${event.type} page. List pages grow with items; bottom décor stays below content.`
                        : "Selected page only. On RSVP, click Submit / Send RSVP to preview the next step — no form fill required."}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-border bg-cream px-6 sm:px-8 py-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#e8e8e8] text-muted font-medium py-3.5 rounded-xl hover:bg-[#dedede] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !manifest}
            onClick={handleSave}
            className="flex-1 bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save template"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

function FieldEditor({ field, value, onChange, resources, onUpload }) {
  if (field.type === "color") {
    return (
      <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
        <label className="text-sm font-medium text-navy block">
          {field.label}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value || field.defaultValue || "#054380"}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 rounded-lg border border-border bg-white cursor-pointer"
          />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-border text-sm text-navy"
          />
        </div>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
        <label className="text-sm font-medium text-navy block">
          {field.label}
        </label>
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? field.defaultValue ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-4 py-3 rounded-xl border border-border text-navy"
        />
      </div>
    );
  }

  if (field.type === "media") {
    const kind = field.mediaKind || "images";
    const files = resources?.[kind] || [];
    const selectedName =
      typeof value === "string" && value
        ? value
        : files[0]?.filename || "";

    return (
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-navy">{field.label}</label>
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#054380] cursor-pointer hover:underline">
            <Upload className="w-3.5 h-3.5" />
            Upload
            <input
              type="file"
              className="hidden"
              accept={
                kind === "video"
                  ? "video/*"
                  : kind === "music"
                    ? "audio/*"
                    : "image/*"
              }
              multiple={Boolean(field.multiple)}
              onChange={async (e) => {
                const list = Array.from(e.target.files || []);
                let lastName = selectedName;
                for (const file of list) {
                  const uploadedName = await onUpload(kind, file);
                  if (uploadedName) lastName = uploadedName;
                }
                if (lastName) onChange(lastName);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {files.length === 0 ? (
          <p className="text-xs text-muted">No files uploaded for this event yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => {
              const isSelected = file.filename === selectedName;
              return (
                <li key={file.filename}>
                  <button
                    type="button"
                    onClick={() => onChange(file.filename)}
                    className={`w-full text-left text-xs break-all flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                      isSelected
                        ? "border-[#054380] bg-[#EAF5FF] text-navy"
                        : "border-border bg-white text-navy hover:bg-cream"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-3.5 h-3.5 rounded-full border ${
                        isSelected
                          ? "border-[#054380] bg-[#054380]"
                          : "border-border bg-white"
                      }`}
                      aria-hidden
                    />
                    <span className="flex-1">{file.filename}</span>
                    {file.url ? (
                      <a
                        href={mediaUrl(file.url)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#054380] hover:underline shrink-0"
                      >
                        Open
                      </a>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  if (field.type === "list") {
    const items = Array.isArray(value) ? value : field.defaultValue || [];
    const schemaKeys = Object.keys(field.itemSchema || {});
    const isRsvpQuestions = field.id === "rsvpQuestions";
    const isJourneyImages = field.id === "journeyImages";
    const isDetailNodes = field.id === "detailNodes";
    const maxItems = Number(field.maxItems) || 0;
    const hasContact = items.some(
      (item) => String(item?.kind || "").toLowerCase() === "contact"
    );

    const updateItem = (index, key, next) => {
      const copy = items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [key]: next };
        // Clear choice lists when switching away from dropdown/radio.
        if (
          key === "inputType" &&
          next !== "dropdown" &&
          next !== "radio" &&
          Object.prototype.hasOwnProperty.call(updated, "options")
        ) {
          updated.options = "";
        }
        return updated;
      });
      onChange(copy);
    };

    const addItem = () => {
      if (maxItems > 0 && items.length >= maxItems) return;
      const blank = {};
      for (const key of schemaKeys) {
        if (key === "phones") continue;
        blank[key] = "";
      }
      if (schemaKeys.includes("inputType")) blank.inputType = "text";
      if (schemaKeys.includes("orientation")) blank.orientation = "portrait";
      if (schemaKeys.includes("caption")) blank.caption = "";
      // Party detail items: always start with the standard icon (never reuse prior).
      if (field.id === "detailItems") {
        blank.kind = "text";
        blank.icon = "info";
        blank.title = "";
        blank.body = "";
      }
      // Save-the-date: new option is a custom link the admin can fill in.
      if (field.id === "calendarLinks") {
        blank.provider = "custom";
        blank.label = "Custom calendar";
        blank.url = "";
      }
      // About features: default to standard "group" icon.
      if (field.id === "aboutFeatures" && schemaKeys.includes("icon")) {
        blank.icon = "group";
      }
      onChange([...items, blank]);
    };

    const addContactItem = () => {
      if (hasContact) return;
      onChange([
        ...items,
        {
          label: "Contact",
          kind: "contact",
          iconKey: "contact",
          phones: [{ name: "", phone: "" }],
        },
      ]);
    };

    const removeItem = (index) => {
      onChange(items.filter((_, i) => i !== index));
    };

    const schemaVisible = (schema, item) => {
      const when = schema?.showWhen;
      if (!when?.field) return true;
      const current = String(item?.[when.field] || "");
      if (Array.isArray(when.in)) {
        return when.in.map(String).includes(current);
      }
      return current === String(when.equals);
    };

    const selectOptions = (schema) =>
      (schema.options || []).map((opt) =>
        typeof opt === "string"
          ? { value: opt, label: opt }
          : { value: opt.value, label: opt.label || opt.value }
      );

    const parseDropdownItems = (raw) => {
      if (Array.isArray(raw)) {
        return raw.map((o) => String(o ?? ""));
      }
      if (raw == null || raw === "") return [];
      return String(raw)
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    };

    const itemLabel = (index, item) => {
      if (isRsvpQuestions) return `Question ${index + 1}`;
      if (isJourneyImages) return `Image ${index + 1}`;
      if (String(item?.kind || "").toLowerCase() === "contact") return "Contact";
      return `Item ${index + 1}`;
    };

    return (
      <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-navy flex items-center gap-2">
            {field.addedItemIcon === "info" ? (
              <Info className="w-4 h-4 text-[#054380]" />
            ) : null}
            {field.label}
          </label>
          <div className="flex items-center gap-3">
            {isDetailNodes && !hasContact ? (
              <button
                type="button"
                onClick={addContactItem}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#054380] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add contact
              </button>
            ) : null}
            <button
              type="button"
              onClick={addItem}
              disabled={maxItems > 0 && items.length >= maxItems}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#054380] hover:underline disabled:opacity-40 disabled:no-underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const isContact =
              String(item?.kind || "").toLowerCase() === "contact";
            return (
            <div
              key={index}
              className="rounded-xl border border-border bg-cream/50 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted">
                  {field.addedItemIcon === "info" ? (
                    <Info className="w-3.5 h-3.5 text-[#054380]" />
                  ) : null}
                  {itemLabel(index, item)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-600"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {schemaKeys.map((key) => {
                const schema = field.itemSchema[key];
                if (!schemaVisible(schema, item)) return null;
                if (key === "value" && isContact) return null;
                if (key === "phones" && !isContact) return null;

                if (schema.type === "contactPhones") {
                  const maxPhones = Math.min(2, Number(schema.max) || 2);
                  const phones = Array.isArray(item.phones) ? item.phones : [];
                  const setPhones = (next) => updateItem(index, "phones", next);
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-muted">{schema.label}</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (phones.length >= maxPhones) return;
                            setPhones([...phones, { name: "", phone: "" }]);
                          }}
                          disabled={phones.length >= maxPhones}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#054380] hover:underline disabled:opacity-40 disabled:no-underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add number
                        </button>
                      </div>
                      <p className="text-[11px] text-muted">
                        Up to {maxPhones} numbers.
                      </p>
                      {phones.length === 0 ? (
                        <p className="text-[11px] text-muted">
                          Add one or two contact numbers.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {phones.slice(0, maxPhones).map((phoneRow, phoneIndex) => (
                            <li
                              key={`phone-${index}-${phoneIndex}`}
                              className="space-y-2 rounded-lg border border-border bg-white p-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-muted">
                                  Number {phoneIndex + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhones(
                                      phones.filter((_, i) => i !== phoneIndex)
                                    )
                                  }
                                  className="text-red-500 hover:text-red-600"
                                  aria-label="Remove number"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={phoneRow?.name || ""}
                                placeholder="Name"
                                onChange={(e) => {
                                  const next = phones.map((row, i) =>
                                    i === phoneIndex
                                      ? { ...row, name: e.target.value }
                                      : row
                                  );
                                  setPhones(next);
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-navy"
                              />
                              <input
                                type="text"
                                value={phoneRow?.phone || ""}
                                placeholder="Phone"
                                onChange={(e) => {
                                  const next = phones.map((row, i) =>
                                    i === phoneIndex
                                      ? { ...row, phone: e.target.value }
                                      : row
                                  );
                                  setPhones(next);
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-navy"
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }

                if (schema.type === "select") {
                  const opts = selectOptions(schema);
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-muted">{schema.label}</label>
                      <select
                        value={item[key] || opts[0]?.value || ""}
                        onChange={(e) => updateItem(index, key, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-navy"
                      >
                        {opts.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (schema.type === "imageRef") {
                  const kind = schema.mediaKind || "images";
                  const files = resources?.[kind] || [];
                  const selectedName = item[key] || "";
                  const selectedFile = files.find((f) => f.filename === selectedName);

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-muted">{schema.label}</label>
                        <label className="inline-flex items-center gap-1 text-xs font-medium text-[#054380] cursor-pointer hover:underline">
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const uploadedName = await onUpload(kind, file);
                              if (uploadedName) updateItem(index, key, uploadedName);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {selectedFile?.url ? (
                        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mediaUrl(selectedFile.url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                      {files.length === 0 ? (
                        <p className="text-[11px] text-muted">
                          Upload an image for this slot.
                        </p>
                      ) : (
                        <select
                          value={selectedName}
                          onChange={(e) => updateItem(index, key, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-navy"
                        >
                          <option value="">Select image…</option>
                          {files.map((file) => (
                            <option key={file.filename} value={file.filename}>
                              {file.filename}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                }

                if (schema.type === "fileRef") {
                  const kind = schema.mediaKind || "documents";
                  const files = resources?.[kind] || [];
                  const selectedName = item[key] || "";
                  const selectedFile = files.find((f) => f.filename === selectedName);
                  const formatBytes = (n) => {
                    const bytes = Number(n);
                    if (!Number.isFinite(bytes) || bytes < 0) return "";
                    if (bytes < 1024) return `${bytes} B`;
                    if (bytes < 1024 * 1024) {
                      return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
                    }
                    return `${(bytes / (1024 * 1024)).toFixed(
                      bytes < 10485760 ? 1 : 0
                    )} MB`;
                  };

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-muted">{schema.label}</label>
                        <label className="inline-flex items-center gap-1 text-xs font-medium text-[#054380] cursor-pointer hover:underline">
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,application/pdf"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const uploadedName = await onUpload(kind, file);
                              if (uploadedName) {
                                const copy = items.map((row, i) => {
                                  if (i !== index) return row;
                                  return {
                                    ...row,
                                    [key]: uploadedName,
                                    size:
                                      formatBytes(file.size) ||
                                      selectedFile?.sizeLabel ||
                                      row.size ||
                                      "",
                                    name: row.name || file.name || uploadedName,
                                  };
                                });
                                onChange(copy);
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {selectedFile ? (
                        <p className="text-[11px] text-muted truncate">
                          {selectedFile.filename}
                          {selectedFile.sizeLabel
                            ? ` · ${selectedFile.sizeLabel}`
                            : ""}
                        </p>
                      ) : null}
                      {files.length === 0 ? (
                        <p className="text-[11px] text-muted">
                          Upload a document for this resource.
                        </p>
                      ) : (
                        <select
                          value={selectedName}
                          onChange={(e) => {
                            const name = e.target.value;
                            const file = files.find((f) => f.filename === name);
                            const copy = items.map((row, i) => {
                              if (i !== index) return row;
                              return {
                                ...row,
                                [key]: name,
                                size: file?.sizeLabel || row.size || "",
                              };
                            });
                            onChange(copy);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-navy"
                        >
                          <option value="">Select document…</option>
                          {files.map((file) => (
                            <option key={file.filename} value={file.filename}>
                              {file.filename}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                }

                if (schema.type === "readonly") {
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-muted">{schema.label}</label>
                      <p className="text-sm text-navy px-3 py-2 rounded-xl border border-border bg-cream/40">
                        {item[key] || "—"}
                      </p>
                    </div>
                  );
                }

                if (schema.type === "dropdownItems") {
                  const menuItems = parseDropdownItems(item[key]);
                  const setMenuItems = (nextList) =>
                    updateItem(index, key, nextList);

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-muted">{schema.label}</label>
                        <button
                          type="button"
                          onClick={() => setMenuItems([...menuItems, ""])}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#054380] hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add item
                        </button>
                      </div>
                      {menuItems.length === 0 ? (
                        <p className="text-[11px] text-muted">
                          Add choices guests can select from this{" "}
                          {String(item?.inputType || "") === "radio"
                            ? "radio group"
                            : "dropdown"}
                          .
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {menuItems.map((menuItem, menuIndex) => (
                            <li
                              key={`${index}-opt-${menuIndex}`}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={menuItem}
                                placeholder={`Option ${menuIndex + 1}`}
                                onChange={(e) => {
                                  const next = [...menuItems];
                                  next[menuIndex] = e.target.value;
                                  setMenuItems(next);
                                }}
                                className="flex-1 px-3 py-2 rounded-xl border border-border bg-white text-sm text-navy"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setMenuItems(
                                    menuItems.filter((_, i) => i !== menuIndex)
                                  )
                                }
                                className="text-red-500 hover:text-red-600 shrink-0"
                                aria-label="Remove dropdown item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }

                if (schema.type === "textarea") {
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-muted">{schema.label}</label>
                      <textarea
                        value={item[key] || ""}
                        onChange={(e) => updateItem(index, key, e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-navy resize-none"
                      />
                    </div>
                  );
                }
                return (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-muted">{schema.label}</label>
                    <input
                      type="text"
                      value={item[key] || ""}
                      onChange={(e) => updateItem(index, key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-navy"
                    />
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
      <label className="text-sm font-medium text-navy block">{field.label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-border text-navy"
      />
    </div>
  );
}
