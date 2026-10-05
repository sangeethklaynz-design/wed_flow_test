/**
 * Shared party page background / gradient helpers.
 */

export const PARTY_GRADIENT_DEFAULTS = {
  gradientTop: "#588dcf",
  gradientMid: "#e5f2fd",
  gradientBottom: "#4377bd",
};

export const PARTY_TEXT_DEFAULTS = {
  colorLandingEyebrow: "#F5F9FF",
  colorPageTitle: "#0c1e48",
  colorPageAccent: "#1e75c8",
  colorBodyText: "#162646",
};

export function partyThemeVars(fields = {}) {
  return {
    ["--party-landing-eyebrow"]:
      fields.colorLandingEyebrow || PARTY_TEXT_DEFAULTS.colorLandingEyebrow,
    ["--party-text-title"]:
      fields.colorPageTitle || PARTY_TEXT_DEFAULTS.colorPageTitle,
    ["--party-text-accent"]:
      fields.colorPageAccent || PARTY_TEXT_DEFAULTS.colorPageAccent,
    ["--party-text-body"]:
      fields.colorBodyText || PARTY_TEXT_DEFAULTS.colorBodyText,
  };
}

export function resolvePartyGradient(fields = {}) {
  return {
    top: fields.gradientTop || PARTY_GRADIENT_DEFAULTS.gradientTop,
    mid: fields.gradientMid || PARTY_GRADIENT_DEFAULTS.gradientMid,
    bottom: fields.gradientBottom || PARTY_GRADIENT_DEFAULTS.gradientBottom,
  };
}

/**
 * Inline style for a full-bleed page section (no nested content box).
 * Only sets minHeight — never height:auto. Absolute-stage pages (landing /
 * location / save-the-date) collapse when height is auto because abspos
 * children do not contribute to parent size and % tops resolve against 0.
 */
export function partyPageSurfaceStyle(fields = {}, pageHeight = null) {
  const g = resolvePartyGradient(fields);
  const style = {
    width: "100%",
    ...partyThemeVars(fields),
    background: `linear-gradient(180deg, ${g.top} 0%, ${g.mid} 45%, ${g.bottom} 100%)`,
    ["--party-grad-top"]: g.top,
    ["--party-grad-mid"]: g.mid,
    ["--party-grad-bottom"]: g.bottom,
  };
  if (pageHeight != null) {
    style.minHeight = pageHeight;
  }
  return style;
}

/** Fixed 390×844 abspos pages (landing / location / save-the-date). */
export function partyFixedPageStyle(fields = {}, height = 844) {
  return {
    ...partyPageSurfaceStyle(fields, height),
    height,
    minHeight: height,
  };
}
