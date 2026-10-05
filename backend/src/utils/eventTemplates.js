const fs = require("fs");
const path = require("path");

/**
 * Event template + resource layout
 * --------------------------------
 * Disk root: backend/events/
 *
 * Per type folder (weddings | corporate-events | parties):
 *   templates/{templateKey}/manifest.json   — page/field registry (admin source of truth)
 *   templates/{templateKey}/chrome/**       — shared design chrome for that template
 *   resources/{packId}/{video|music|images|background|documents}/ — per-event uploads
 *
 * Public URLs (Express mount /assets/events → EVENTS_ROOT):
 *   /assets/events/{folder}/templates/{templateKey}/chrome/{file}
 *   /assets/events/{folder}/resources/{packId}/{kind}/{file}
 *
 * Frontend also rewrites /assets/events/* → API host in next.config.mjs.
 */

const EVENTS_ROOT = path.join(__dirname, "..", "..", "events");

const TYPE_TO_FOLDER = {
  wedding: "weddings",
  corporate: "corporate-events",
  party: "parties",
};

const EVENT_TYPES = Object.keys(TYPE_TO_FOLDER);

const RESOURCE_SUBDIRS = ["video", "music", "images", "background", "documents"];

function folderForType(type) {
  return TYPE_TO_FOLDER[type] || null;
}

function categoryRoot(type) {
  const folder = folderForType(type);
  if (!folder) return null;
  return path.join(EVENTS_ROOT, folder);
}

function templatesDirForType(type) {
  const root = categoryRoot(type);
  if (!root) return null;
  return path.join(root, "templates");
}

function resourcesDirForType(type) {
  const root = categoryRoot(type);
  if (!root) return null;
  return path.join(root, "resources");
}

function templateDir(type, templateKey) {
  const dir = templatesDirForType(type);
  if (!dir || !templateKey) return null;
  return path.join(dir, templateKey);
}

function resourcePackDir(type, packId) {
  const dir = resourcesDirForType(type);
  if (!dir || !packId) return null;
  return path.join(dir, packId);
}

function listTemplates(type) {
  const dir = templatesDirForType(type);
  if (!dir || !fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function listResourcePacks(type) {
  const dir = resourcesDirForType(type);
  if (!dir || !fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function templateExists(type, templateKey) {
  if (!templateKey) return false;
  const full = templateDir(type, templateKey);
  if (!full) return false;
  try {
    return fs.existsSync(full) && fs.statSync(full).isDirectory();
  } catch {
    return false;
  }
}

function resourcePackExists(type, packId) {
  if (!packId) return false;
  const full = resourcePackDir(type, packId);
  if (!full) return false;
  try {
    return fs.existsSync(full) && fs.statSync(full).isDirectory();
  } catch {
    return false;
  }
}

function ensureResourcePack(type, packId) {
  const packRoot = resourcePackDir(type, packId);
  if (!packRoot) throw new Error("Invalid type or pack id");
  fs.mkdirSync(packRoot, { recursive: true });
  for (const sub of RESOURCE_SUBDIRS) {
    fs.mkdirSync(path.join(packRoot, sub), { recursive: true });
  }
  return packRoot;
}

function loadTemplateManifest(type, templateKey) {
  const dir = templateDir(type, templateKey);
  if (!dir) return null;
  const file = path.join(dir, "manifest.json");
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function publicResourceUrl(type, packId, kind, filename) {
  const folder = folderForType(type);
  if (!folder || !packId || !kind || !filename) return null;
  return `/assets/events/${folder}/resources/${packId}/${kind}/${filename}`;
}

/**
 * Template chrome (shared design assets) under
 * events/{folder}/templates/{templateKey}/chrome/...
 */
function publicChromeUrl(type, templateKey, relativePath) {
  const folder = folderForType(type);
  const key = String(templateKey || "template-1").trim() || "template-1";
  if (!folder) return null;
  const rel = String(relativePath || "")
    .replace(/^[/\\]+/, "")
    .replace(/\\/g, "/");
  const base = `/assets/events/${folder}/templates/${key}/chrome`;
  return rel ? `${base}/${rel}` : base;
}

function chromeDir(type, templateKey) {
  const dir = templateDir(type, templateKey);
  if (!dir) return null;
  return path.join(dir, "chrome");
}

function listPackFiles(type, packId, kind) {
  const packRoot = resourcePackDir(type, packId);
  if (!packRoot) return [];
  const dir = path.join(packRoot, kind);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .sort()
    .map((filename) => {
      const full = path.join(dir, filename);
      let sizeBytes = null;
      try {
        sizeBytes = fs.statSync(full).size;
      } catch {
        sizeBytes = null;
      }
      return {
        filename,
        url: publicResourceUrl(type, packId, kind, filename),
        sizeBytes,
        sizeLabel: formatFileSize(sizeBytes),
      };
    });
}

function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

module.exports = {
  EVENTS_ROOT,
  TYPE_TO_FOLDER,
  EVENT_TYPES,
  RESOURCE_SUBDIRS,
  folderForType,
  categoryRoot,
  templatesDirForType,
  resourcesDirForType,
  templateDir,
  resourcePackDir,
  listTemplates,
  listResourcePacks,
  templateExists,
  resourcePackExists,
  ensureResourcePack,
  loadTemplateManifest,
  publicResourceUrl,
  publicChromeUrl,
  chromeDir,
  listPackFiles,
  formatFileSize,
};
