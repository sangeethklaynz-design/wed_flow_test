/**
 * Admin script: set schedule PDF background + optional text style for a couple.
 *
 * Usage (from wedflow/backend):
 *   node scripts/update_schedule_template.js schedule-creation/kasunihiruni-template.txt
 *   npm run update-schedule-template -- schedule-creation/kasunihiruni-template.txt
 *
 * Required:
 *   email
 *
 * Optional:
 *   background_image   file name only → assets/<couple-slug>/<name>
 *   typography keys    see DEFAULT_SCHEDULE_TEXT_STYLE / sample txt
 *
 * Couple names, wedding date, hotel/venue, and events come from the DB.
 */

const fs = require("fs");
const path = require("path");
const { sequelize } = require("../src/models");
const { ensureCoreSchema } = require("../src/bootstrap/ensureSchema");
const {
  DEFAULT_SCHEDULE_TEXT_STYLE,
  extractStylePatchFromData,
  mergeScheduleTextStyle,
  parseStoredStyle,
} = require("../src/utils/scheduleTextStyle");

function printUsage() {
  console.log(`
Usage:
  node scripts/update_schedule_template.js <path-to-text-file>

Example:
  node scripts/update_schedule_template.js schedule-creation/kasunihiruni-template.txt

Required:
  email=admintest@gmail.com

Optional background (file name only under assets/<couple-slug>/):
  background_image=wedding-timeline-bg.png

Optional typography (defaults shown in sample txt; fonts under assets/fonts/):
  name_font / name_font_size / name_line_height / name_second_line_indent
  subtitle_font / subtitle_font_size / subtitle_tracking
  time_font / time_font_size
  event_font / event_font_size
  footer_font / footer_font_size
`);
}

function coupleSlugFromNames(coupleNames) {
  const slug = String(coupleNames || "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "");
  if (!slug) {
    throw new Error(
      `Cannot derive assets folder from couple_names: "${coupleNames}"`
    );
  }
  return slug;
}

function parseTemplateFile(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf8");
  const data = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      throw new Error(`Invalid line (expected key=value): ${trimmed}`);
    }
    const key = trimmed.slice(0, eq).trim().toLowerCase();
    const value = trimmed.slice(eq + 1).trim();
    data[key] = value;
  }

  if (!data.email) {
    throw new Error("Missing required field: email");
  }

  let backgroundImageName = null;
  if (data.background_image) {
    if (
      data.background_image.includes("/") ||
      data.background_image.includes("\\")
    ) {
      throw new Error(
        "background_image must be a file name only (no folders). Place the file under assets/<couple-slug>/"
      );
    }
    backgroundImageName = path.basename(data.background_image);
  }

  const { stylePatch, hasStyleKeys } = extractStylePatchFromData(data);

  if (!backgroundImageName && !hasStyleKeys) {
    throw new Error(
      "Provide background_image and/or at least one typography key"
    );
  }

  return {
    email: data.email.toLowerCase(),
    backgroundImageName,
    stylePatch,
    hasStyleKeys,
    sourceFile: absolutePath,
  };
}

function resolveCoupleBackground(coupleNames, imageName) {
  const slug = coupleSlugFromNames(coupleNames);
  const relativePath = path
    .join("assets", slug, imageName)
    .replace(/\\/g, "/");
  const absolutePath = path.resolve(process.cwd(), relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Background image not found: ${relativePath}\n` +
        `  Expected: assets/${slug}/${imageName}\n` +
        `  (derived from couple_names "${coupleNames}")`
    );
  }

  return { slug, relativePath, absolutePath };
}

async function updateScheduleTemplateFromFile(filePath) {
  await ensureCoreSchema();
  const details = parseTemplateFile(filePath);

  const [rows] = await sequelize.query(
    `
    SELECT
      w.id AS wedding_id,
      w.couple_names,
      w.wedding_date,
      w.schedule_title,
      w.schedule_venue,
      w.schedule_style_json,
      u.email,
      i.hotel_name
    FROM weddings w
    JOIN users u ON u.id = w.user_id
    LEFT JOIN invitations i ON i.wedding_id = w.id
    WHERE u.email = ?
    LIMIT 1;
    `,
    { replacements: [details.email] }
  );

  if (!rows.length) {
    throw new Error(`No wedding found for email: ${details.email}`);
  }

  const wedding = rows[0];
  const slug = coupleSlugFromNames(wedding.couple_names);
  const updates = [];
  const replacements = [];
  let relativePath = null;
  let mergedStyle = mergeScheduleTextStyle(wedding.schedule_style_json);

  if (details.backgroundImageName) {
    ({ relativePath } = resolveCoupleBackground(
      wedding.couple_names,
      details.backgroundImageName
    ));
    updates.push("schedule_image_url = ?");
    replacements.push(relativePath);
  }

  if (details.hasStyleKeys) {
    mergedStyle = mergeScheduleTextStyle(
      wedding.schedule_style_json,
      details.stylePatch
    );
    updates.push("schedule_style_json = ?");
    replacements.push(JSON.stringify(mergedStyle));
  }

  // If schedule_venue is empty, mirror invitation hotel for PDF footer.
  if (!wedding.schedule_venue && wedding.hotel_name) {
    updates.push("schedule_venue = ?");
    replacements.push(wedding.hotel_name);
  }

  if (!updates.length) {
    throw new Error("Nothing to update");
  }

  updates.push("updated_at = NOW()");
  replacements.push(wedding.wedding_id);

  await sequelize.query(
    `
    UPDATE weddings
    SET ${updates.join(", ")}
    WHERE id = ?;
    `,
    { replacements }
  );

  const [updated] = await sequelize.query(
    `
    SELECT
      couple_names,
      wedding_date,
      schedule_image_url,
      schedule_title,
      schedule_venue,
      schedule_style_json
    FROM weddings
    WHERE id = ?
    LIMIT 1;
    `,
    { replacements: [wedding.wedding_id] }
  );

  return {
    email: details.email,
    weddingId: wedding.wedding_id,
    coupleSlug: slug,
    imageName: details.backgroundImageName,
    styleUpdated: details.hasStyleKeys,
    textStyle: mergeScheduleTextStyle(updated[0].schedule_style_json),
    defaults: DEFAULT_SCHEDULE_TEXT_STYLE,
    previousStyle: parseStoredStyle(wedding.schedule_style_json),
    template: updated[0],
    hotelFromInvite: wedding.hotel_name || null,
    sourceFile: details.sourceFile,
  };
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg || fileArg === "-h" || fileArg === "--help") {
    printUsage();
    process.exit(fileArg ? 0 : 1);
  }

  const result = await updateScheduleTemplateFromFile(fileArg);
  console.log("\nSchedule template updated.\n");
  console.log(`  Email:         ${result.email}`);
  console.log(`  Couple:        ${result.template.couple_names}`);
  console.log(`  Assets folder: assets/${result.coupleSlug}/`);
  if (result.imageName) {
    console.log(`  Image name:    ${result.imageName}`);
  }
  console.log(
    `  Background:    ${result.template.schedule_image_url || "—"}`
  );
  console.log(
    `  Wedding date:  ${String(result.template.wedding_date).slice(0, 10)} (from DB)`
  );
  console.log(
    `  Venue:         ${result.template.schedule_venue || result.hotelFromInvite || "—"} (from DB)`
  );
  if (result.styleUpdated) {
    console.log("  Text style:   updated");
    for (const [key, value] of Object.entries(result.textStyle)) {
      console.log(`    ${key}=${value}`);
    }
  } else {
    console.log("  Text style:   unchanged (using defaults / previous DB values)");
  }
  console.log(`  Source file:   ${result.sourceFile}\n`);
}

if (require.main === module) {
  main()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\nUpdate schedule template FAILED:", err?.message || err);
      try {
        await sequelize.close();
      } catch (_) {
        // ignore
      }
      process.exit(1);
    });
}

module.exports = {
  updateScheduleTemplateFromFile,
  parseTemplateFile,
  coupleSlugFromNames,
  resolveCoupleBackground,
  DEFAULT_SCHEDULE_TEXT_STYLE,
};
