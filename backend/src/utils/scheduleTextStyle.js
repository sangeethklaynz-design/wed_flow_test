/**
 * Shared schedule PDF text-style defaults + merge helpers.
 * Admin can override via update_schedule_template.js text file.
 */

const path = require("path");
const fs = require("fs");

const FONT_DIR = path.join(__dirname, "../../assets/fonts");

/** Current production defaults — also documented in sample template txt */
const DEFAULT_SCHEDULE_TEXT_STYLE = {
  name_font: "BonheurRoyale-Regular.ttf",
  name_font_size: 48,
  name_line_height: 44,
  name_second_line_indent: 22,
  subtitle_font: "CormorantGaramond-Regular.ttf",
  subtitle_font_size: 9.5,
  subtitle_tracking: 2.8,
  time_font: "PlayfairDisplay-Medium.ttf",
  time_font_size: 11,
  event_font: "CormorantGaramond-SemiBold.ttf",
  event_font_size: 11,
  footer_font: "CormorantGaramond-Regular.ttf",
  footer_font_size: 10.5,
};

const STYLE_KEYS = Object.keys(DEFAULT_SCHEDULE_TEXT_STYLE);

const NUMERIC_STYLE_KEYS = new Set([
  "name_font_size",
  "name_line_height",
  "name_second_line_indent",
  "subtitle_font_size",
  "subtitle_tracking",
  "time_font_size",
  "event_font_size",
  "footer_font_size",
]);

const FONT_STYLE_KEYS = new Set([
  "name_font",
  "subtitle_font",
  "time_font",
  "event_font",
  "footer_font",
]);

function parseStoredStyle(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

function resolveFontFile(fileName) {
  const base = path.basename(String(fileName || "").trim());
  if (!base || base.includes("..")) return null;
  if (!/\.(ttf|otf)$/i.test(base)) return null;
  const absolute = path.join(FONT_DIR, base);
  if (!fs.existsSync(absolute)) return null;
  return { fileName: base, absolutePath: absolute };
}

function assertFontExists(fileName, fieldName) {
  const resolved = resolveFontFile(fileName);
  if (!resolved) {
    throw new Error(
      `${fieldName}=${fileName} not found. Place the file in assets/fonts/`
    );
  }
  return resolved.fileName;
}

function coerceStyleValue(key, value) {
  if (NUMERIC_STYLE_KEYS.has(key)) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new Error(`Invalid number for ${key}: ${value}`);
    }
    return num;
  }
  if (FONT_STYLE_KEYS.has(key)) {
    if (String(value).includes("/") || String(value).includes("\\")) {
      throw new Error(`${key} must be a file name only (under assets/fonts/)`);
    }
    return assertFontExists(value, key);
  }
  return value;
}

/**
 * Pull style overrides from a parsed key=value map (template file).
 * Returns { stylePatch, hasStyleKeys }.
 */
function extractStylePatchFromData(data) {
  const stylePatch = {};
  let hasStyleKeys = false;

  for (const key of STYLE_KEYS) {
    if (data[key] === undefined || data[key] === "") continue;
    hasStyleKeys = true;
    stylePatch[key] = coerceStyleValue(key, data[key]);
  }

  return { stylePatch, hasStyleKeys };
}

function mergeScheduleTextStyle(storedRaw, patch = {}) {
  return {
    ...DEFAULT_SCHEDULE_TEXT_STYLE,
    ...parseStoredStyle(storedRaw),
    ...patch,
  };
}

module.exports = {
  FONT_DIR,
  DEFAULT_SCHEDULE_TEXT_STYLE,
  STYLE_KEYS,
  NUMERIC_STYLE_KEYS,
  FONT_STYLE_KEYS,
  parseStoredStyle,
  resolveFontFile,
  assertFontExists,
  coerceStyleValue,
  extractStylePatchFromData,
  mergeScheduleTextStyle,
};
