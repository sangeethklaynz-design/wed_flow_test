/**
 * Admin script: create / replace schedule events from a text file.
 *
 * Usage (from wedflow/backend):
 *   node scripts/create_schedule.js schedule-creation/kasunihiruni-schedule.txt
 *   npm run create-schedule -- schedule-creation/kasunihiruni-schedule.txt
 *
 * File format:
 *   email=couple@example.com
 *   replace_existing=true          # optional
 *   09:00|09:45|Event Title|Optional notes
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sequelize } = require("../src/models");
const { ensureCoreSchema } = require("../src/bootstrap/ensureSchema");

function printUsage() {
  console.log(`
Usage:
  node scripts/create_schedule.js <path-to-text-file>

Example:
  node scripts/create_schedule.js schedule-creation/kasunihiruni-schedule.txt

Text file format:
  email=admintest@gmail.com
  replace_existing=true

  09:00|09:45|Guest Arrival & Welcome Tea|Main Ballroom
  10:30|11:00|Family Blessings|
`);
}

function parseTime(value, fieldName) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    throw new Error(`Missing ${fieldName}`);
  }
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(":");
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }
  throw new Error(`Invalid ${fieldName} "${value}". Use HH:mm (e.g. 09:00).`);
}

function timeToMinutes(value) {
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + m;
}

function parseScheduleFile(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf8");
  const meta = {};
  const events = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.includes("=") && !trimmed.includes("|")) {
      const eq = trimmed.indexOf("=");
      const key = trimmed.slice(0, eq).trim().toLowerCase();
      const value = trimmed.slice(eq + 1).trim();
      meta[key] = value;
      continue;
    }

    if (trimmed.includes("|")) {
      const parts = trimmed.split("|").map((p) => p.trim());
      if (parts.length < 3) {
        throw new Error(
          `Invalid event line (need start|end|title|notes): ${trimmed}`
        );
      }
      const [startRaw, endRaw, title, ...noteParts] = parts;
      const startTime = parseTime(startRaw, "start");
      const endTime = parseTime(endRaw, "end");
      const notes = noteParts.join("|").trim();

      if (!title) {
        throw new Error(`Event title is required: ${trimmed}`);
      }
      if (timeToMinutes(endTime) < timeToMinutes(startTime)) {
        throw new Error(`end before start on line: ${trimmed}`);
      }

      events.push({
        startTime,
        endTime,
        title,
        specialNotes: notes || null,
      });
    }
  }

  if (!meta.email) {
    throw new Error("Missing required field: email");
  }
  if (!events.length) {
    throw new Error("No events found. Add lines like: 09:00|09:45|Title|Notes");
  }

  // Sort + overlap check within the file
  events.sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  for (let i = 1; i < events.length; i += 1) {
    const prev = events[i - 1];
    const curr = events[i];
    if (timeToMinutes(curr.startTime) < timeToMinutes(prev.endTime)) {
      throw new Error(
        `Overlapping events in file: "${prev.title}" and "${curr.title}"`
      );
    }
  }

  return {
    email: meta.email.toLowerCase(),
    replaceExisting: String(meta.replace_existing || "false").toLowerCase() === "true",
    events,
    sourceFile: absolutePath,
  };
}

async function createScheduleFromFile(filePath) {
  await ensureCoreSchema();
  const details = parseScheduleFile(filePath);

  const [rows] = await sequelize.query(
    `
    SELECT w.id AS wedding_id, w.couple_names, u.email
    FROM weddings w
    JOIN users u ON u.id = w.user_id
    WHERE u.email = ?
    LIMIT 1;
    `,
    { replacements: [details.email] }
  );

  const wedding = rows[0];
  if (!wedding) {
    throw new Error(`No wedding found for email: ${details.email}`);
  }

  const transaction = await sequelize.transaction();
  try {
    if (details.replaceExisting) {
      await sequelize.query(
        `DELETE FROM schedule_events WHERE wedding_id = ?;`,
        { replacements: [wedding.wedding_id], transaction }
      );
    } else {
      const [existing] = await sequelize.query(
        `
        SELECT event_time, end_time, title
        FROM schedule_events
        WHERE wedding_id = ?;
        `,
        { replacements: [wedding.wedding_id], transaction }
      );

      for (const event of details.events) {
        const start = timeToMinutes(event.startTime);
        const end = timeToMinutes(event.endTime);
        const clash = existing.find((row) => {
          const rowStart = timeToMinutes(String(row.event_time).slice(0, 5));
          const rowEnd = timeToMinutes(
            String(row.end_time || row.event_time).slice(0, 5)
          );
          return start < rowEnd && end > rowStart;
        });
        if (clash) {
          throw new Error(
            `Overlaps existing "${clash.title}" — set replace_existing=true to replace all`
          );
        }
      }
    }

    let order = 1;
    if (!details.replaceExisting) {
      const [[maxRow]] = await sequelize.query(
        `
        SELECT COALESCE(MAX(display_order), 0) AS max_order
        FROM schedule_events
        WHERE wedding_id = ?;
        `,
        { replacements: [wedding.wedding_id], transaction }
      );
      order = Number(maxRow.max_order) + 1;
    }

    for (const event of details.events) {
      await sequelize.query(
        `
        INSERT INTO schedule_events (
          id, wedding_id, event_time, end_time, title, location, special_notes,
          status, display_order, notification_enabled, notification_sent_at
        )
        VALUES (?, ?, ?, ?, ?, NULL, ?, 'UPCOMING', ?, 1, NULL);
        `,
        {
          replacements: [
            crypto.randomUUID(),
            wedding.wedding_id,
            event.startTime,
            event.endTime,
            event.title,
            event.specialNotes,
            order,
          ],
          transaction,
        }
      );
      order += 1;
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  const [finalRows] = await sequelize.query(
    `
    SELECT event_time, end_time, title
    FROM schedule_events
    WHERE wedding_id = ?
    ORDER BY event_time ASC, display_order ASC;
    `,
    { replacements: [wedding.wedding_id] }
  );

  return {
    email: wedding.email,
    coupleNames: wedding.couple_names,
    weddingId: wedding.wedding_id,
    replaced: details.replaceExisting,
    inserted: details.events.length,
    total: finalRows.length,
    events: finalRows,
    sourceFile: details.sourceFile,
  };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath || filePath === "-h" || filePath === "--help") {
    printUsage();
    process.exit(filePath ? 0 : 1);
  }

  const result = await createScheduleFromFile(filePath);
  console.log(`
Schedule ${result.replaced ? "replaced" : "created"}.

  Email:   ${result.email}
  Couple:  ${result.coupleNames}
  Inserted: ${result.inserted}
  Total:    ${result.total}
  Source:   ${result.sourceFile}
`);
  for (const row of result.events) {
    const start = String(row.event_time).slice(0, 5);
    const end = String(row.end_time || row.event_time).slice(0, 5);
    console.log(`  ${start}–${end}  ${row.title}`);
  }
}

if (require.main === module) {
  main()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(`\nFailed: ${err.message}`);
      try {
        await sequelize.close();
      } catch (_) {}
      process.exit(1);
    });
}

module.exports = { createScheduleFromFile, parseScheduleFile };
