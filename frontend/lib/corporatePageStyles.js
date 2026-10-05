/**
 * Corporate invitation page gradient from template fields.
 * Uses only gradientTop / gradientMid / gradientBottom — never brand-color
 * fallbacks that would replace the soft page wash with solid accent hues.
 */

export const CORPORATE_GRADIENT_DEFAULTS = {
  gradientTop: "#D4E0F7",
  gradientMid: "#FFFFFF",
  gradientBottom: "#A5DBFD",
};

export const CORPORATE_TEXT_DEFAULTS = {
  colorTextPrimary: "#080480",
  colorTextHighlight: "#0084FF",
};

export function resolveCorporateGradient(fields = {}) {
  return {
    top: fields.gradientTop || CORPORATE_GRADIENT_DEFAULTS.gradientTop,
    mid: fields.gradientMid || CORPORATE_GRADIENT_DEFAULTS.gradientMid,
    bottom: fields.gradientBottom || CORPORATE_GRADIENT_DEFAULTS.gradientBottom,
  };
}

export function corporateThemeVars(fields = {}) {
  return {
    ["--corp-text-primary"]:
      fields.colorTextPrimary || CORPORATE_TEXT_DEFAULTS.colorTextPrimary,
    ["--corp-text-highlight"]:
      fields.colorTextHighlight || CORPORATE_TEXT_DEFAULTS.colorTextHighlight,
  };
}

export function corporatePageGradientStyle(fields = {}) {
  const g = resolveCorporateGradient(fields);
  return {
    ...corporateThemeVars(fields),
    background: `linear-gradient(180deg, ${g.top} 0%, ${g.mid} 40%, ${g.bottom} 100%)`,
    ["--corp-grad-top"]: g.top,
    ["--corp-grad-mid"]: g.mid,
    ["--corp-grad-bottom"]: g.bottom,
  };
}
