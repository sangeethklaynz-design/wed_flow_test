const fs = require("fs");
const path = require("path");

const ASSETS_ROOT = path.join(__dirname, "../../assets");
const VIDEO_DIR = path.join(ASSETS_ROOT, "invitation_video");
const IMAGES_DIR = path.join(ASSETS_ROOT, "couple_images");

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function coupleSlugFromNames(coupleNames) {
  const slug = String(coupleNames || "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "");
  return slug || null;
}

/** Build a URL-safe public path under /assets/... */
function toPublicAssetUrl(...segments) {
  const encoded = segments
    .filter(Boolean)
    .map((part) => encodeURIComponent(String(part)))
    .join("/");
  return `/assets/${encoded}`;
}

function listFiles(dir, allowedExts) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => allowedExts.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

/**
 * Resolve invitation intro video from assets/invitation_video/<slug>/
 * Falls back to first video file in that folder.
 */
function resolveInvitationVideoFromDisk(coupleNames) {
  const slug = coupleSlugFromNames(coupleNames);
  if (!slug) return null;

  const dir = path.join(VIDEO_DIR, slug);
  const files = listFiles(dir, VIDEO_EXTS);
  if (!files.length) return null;

  const fileName = files[0];
  return {
    slug,
    fileName,
    absolutePath: path.join(dir, fileName),
    url: toPublicAssetUrl("invitation_video", slug, fileName),
  };
}

/**
 * Resolve couple journey images from assets/couple_images/<slug>/
 * Ordered alphabetically by filename.
 */
function resolveCoupleImagesFromDisk(coupleNames) {
  const slug = coupleSlugFromNames(coupleNames);
  if (!slug) return [];

  const dir = path.join(IMAGES_DIR, slug);
  const files = listFiles(dir, IMAGE_EXTS);

  return files.map((fileName, index) => ({
    slug,
    fileName,
    absolutePath: path.join(dir, fileName),
    url: toPublicAssetUrl("couple_images", slug, fileName),
    caption: null,
    displayOrder: index + 1,
  }));
}

module.exports = {
  ASSETS_ROOT,
  coupleSlugFromNames,
  toPublicAssetUrl,
  resolveInvitationVideoFromDisk,
  resolveCoupleImagesFromDisk,
};
