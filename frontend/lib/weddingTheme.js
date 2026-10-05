/** Wedding invitation colors — must match manifest full-template fields. */

export const WEDDING_THEME_DEFAULTS = {
  colorLandingNames: "#7732A4",
  colorPageTitle: "#7732A4",
  colorSubtitle: "#B54AB6",
  colorBodyText: "#1B3601",
  colorIconFill: "#473284",
  colorAccent: "#FAF6F0",
  colorSurface: "#FFFFFF",
  gradientTop: "#FAF6F0",
  gradientMid: "#FFFFFF",
  gradientBottom: "#FAF6F0",
};

const LEGACY_NAVY = {
  "#054380": "#7732A4",
  "#eaf5ff": "#FAF6F0",
};

function normHex(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const mapped = LEGACY_NAVY[raw.toLowerCase()];
  return mapped || raw;
}

/** @param {Record<string, unknown>} fields templateConfig.fields */
export function resolveWeddingTheme(fields = {}) {
  const legacyPrimary = fields.colorPrimary;
  return {
    landingNames: normHex(
      fields.colorLandingNames || legacyPrimary,
      WEDDING_THEME_DEFAULTS.colorLandingNames
    ),
    pageTitle: normHex(
      fields.colorPageTitle || legacyPrimary,
      WEDDING_THEME_DEFAULTS.colorPageTitle
    ),
    subtitle: normHex(fields.colorSubtitle, WEDDING_THEME_DEFAULTS.colorSubtitle),
    body: normHex(fields.colorBodyText, WEDDING_THEME_DEFAULTS.colorBodyText),
    iconFill: normHex(fields.colorIconFill, WEDDING_THEME_DEFAULTS.colorIconFill),
    accent: normHex(fields.colorAccent, WEDDING_THEME_DEFAULTS.colorAccent),
    surface: normHex(fields.colorSurface, WEDDING_THEME_DEFAULTS.colorSurface),
    gradientTop: normHex(
      fields.gradientTop || fields.colorAccent,
      WEDDING_THEME_DEFAULTS.gradientTop
    ),
    gradientMid: normHex(
      fields.gradientMid || fields.colorSurface,
      WEDDING_THEME_DEFAULTS.gradientMid
    ),
    gradientBottom: normHex(
      fields.gradientBottom || fields.colorAccent,
      WEDDING_THEME_DEFAULTS.gradientBottom
    ),
  };
}
