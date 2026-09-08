const fs = require("fs");
const path = require("path");

const ASSETS_ROOT = path.join(__dirname, "../../assets");
const VIDEO_DIR = path.join(ASSETS_ROOT, "invitation_video");
const IMAGES_DIR = path.join(ASSETS_ROOT, "couple_images");
const MUSIC_DIR = path.join(ASSETS_ROOT, "couple_music");
const BACKGROUND_DIR = path.join(ASSETS_ROOT, "background_image");

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MUSIC_EXTS = new Set([".mp3", ".m4a", ".aac", ".ogg", ".wav"]);

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

function pickNewestFile(dir, files) {
  if (!files.length) return null;
  if (files.length === 1) return files[0];
  return files
    .map((fileName) => ({
      fileName,
      mtimeMs: fs.statSync(path.join(dir, fileName)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0].fileName;
}

/**
 * Map filenames like Image_1.jpg / image-2.png / img3.webp → slot 1, 2, 3.
 * Returns null when the name has no explicit image slot number.
 */
function imageSlotFromFileName(fileName) {
  const base = path.basename(String(fileName || ""), path.extname(fileName));
  const match = base.match(/^(?:image|img)[_\s-]*(\d+)$/i);
  if (!match) return null;
  const slot = Number(match[1]);
  return Number.isInteger(slot) && slot >= 1 ? slot : null;
}

function videoFromFolder(slug) {
  const dir = path.join(VIDEO_DIR, slug);
  const files = listFiles(dir, VIDEO_EXTS);
  if (!files.length) return null;

  const fileName = pickNewestFile(dir, files);
  return {
    slug,
    fileName,
    absolutePath: path.join(dir, fileName),
    url: toPublicAssetUrl("invitation_video", slug, fileName),
  };
}

function musicFromFolder(slug) {
  const dir = path.join(MUSIC_DIR, slug);
  const files = listFiles(dir, MUSIC_EXTS);
  if (!files.length) return null;

  const fileName = pickNewestFile(dir, files);
  return {
    slug,
    fileName,
    absolutePath: path.join(dir, fileName),
    url: toPublicAssetUrl("couple_music", slug, fileName),
  };
}

function backgroundFromFolder(slug) {
  const dir = path.join(BACKGROUND_DIR, slug);
  const files = listFiles(dir, IMAGE_EXTS);
  if (!files.length) return null;

  const fileName = pickNewestFile(dir, files);
  const absolutePath = path.join(dir, fileName);
  let cacheTag = "1";
  try {
    cacheTag = String(Math.floor(fs.statSync(absolutePath).mtimeMs));
  } catch {
    // keep default
  }
  return {
    slug,
    fileName,
    absolutePath,
    url: `${toPublicAssetUrl("background_image", slug, fileName)}?v=${cacheTag}`,
  };
}

/**
 * Resolve invitation intro video from assets/invitation_video/<slug>/
 * Falls back to the newest video in that folder, then to the only folder
 * on disk when the couple slug changed (e.g. after a rename).
 */
function resolveInvitationVideoFromDisk(coupleNames) {
  const slug = coupleSlugFromNames(coupleNames);
  if (slug) {
    const match = videoFromFolder(slug);
    if (match) return match;
  }

  if (!fs.existsSync(VIDEO_DIR)) return null;

  const subdirs = fs
    .readdirSync(VIDEO_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (subdirs.length === 1) {
    return videoFromFolder(subdirs[0]);
  }

  return null;
}

/**
 * Resolve couple journey images from assets/couple_images/<slug>/.
 * Slot comes from the filename: Image_1 → container 1, Image_2 → 2, etc.
 * Unnumbered files fill the next free slots in alphabetical order.
 */
function resolveCoupleImagesFromDisk(coupleNames) {
  const slug = coupleSlugFromNames(coupleNames);
  if (!slug) return [];

  const dir = path.join(IMAGES_DIR, slug);
  const files = listFiles(dir, IMAGE_EXTS);
  const bySlot = new Map();
  const unnumbered = [];

  for (const fileName of files) {
    const absolutePath = path.join(dir, fileName);
    let cacheTag = "1";
    try {
      cacheTag = String(Math.floor(fs.statSync(absolutePath).mtimeMs));
    } catch {
      // keep default
    }
    const entry = {
      slug,
      fileName,
      absolutePath,
      url: `${toPublicAssetUrl("couple_images", slug, fileName)}?v=${cacheTag}`,
      caption: null,
      displayOrder: null,
    };
    const slot = imageSlotFromFileName(fileName);
    if (slot == null) {
      unnumbered.push(entry);
      continue;
    }
    // First match wins (files already sorted alphabetically).
    if (!bySlot.has(slot)) {
      entry.displayOrder = slot;
      bySlot.set(slot, entry);
    }
  }

  let nextSlot = 1;
  for (const entry of unnumbered) {
    while (bySlot.has(nextSlot)) nextSlot += 1;
    entry.displayOrder = nextSlot;
    bySlot.set(nextSlot, entry);
    nextSlot += 1;
  }

  return [...bySlot.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, img]) => img);
}

/**
 * Resolve invitation background music from assets/couple_music/<slug>/
 * Same slug rules as video/images. Falls back to the only music folder
 * when the couple slug changed.
 */
function resolveCoupleMusicFromDisk(coupleNames) {
  const slug = coupleSlugFromNames(coupleNames);
  if (slug) {
    const match = musicFromFolder(slug);
    if (match) return match;
  }

  if (!fs.existsSync(MUSIC_DIR)) return null;

  const subdirs = fs
    .readdirSync(MUSIC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (subdirs.length === 1) {
    return musicFromFolder(subdirs[0]);
  }

  return null;
}

/**
 * Resolve invitation landing-page background from assets/background_image/<slug>/
 * Same slug rules as video/images/music.
 */
function resolveCoupleBackgroundFromDisk(coupleNames) {
  const slug = coupleSlugFromNames(coupleNames);
  if (slug) {
    const match = backgroundFromFolder(slug);
    if (match) return match;
  }

  if (!fs.existsSync(BACKGROUND_DIR)) return null;

  const subdirs = fs
    .readdirSync(BACKGROUND_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (subdirs.length === 1) {
    return backgroundFromFolder(subdirs[0]);
  }

  return null;
}

module.exports = {
  ASSETS_ROOT,
  coupleSlugFromNames,
  toPublicAssetUrl,
  imageSlotFromFileName,
  resolveInvitationVideoFromDisk,
  resolveCoupleImagesFromDisk,
  resolveCoupleMusicFromDisk,
  resolveCoupleBackgroundFromDisk,
};
