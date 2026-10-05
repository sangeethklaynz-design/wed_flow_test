const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const files = [
  "frontend/components/invite/InvitationPage.jsx",
  "frontend/components/invite/InvitationSchedule.jsx",
  "frontend/components/invite/InvitationThankYou.jsx",
  "frontend/components/invite/ThankYouPage.jsx",
  "frontend/components/invite/RsvpChangeRequestForm.jsx",
];

const chromeResolveRe =
  /resolveMediaUrl\(\s*["']\/assets\/events\/weddings\/templates\/template-1\/chrome\/([^"']+)["']\s*\)/g;
const chromePathRe =
  /["']\/assets\/events\/weddings\/templates\/template-1\/chrome\/([^"']+)["']/g;

for (const rel of files) {
  const file = path.join(root, rel);
  let s = fs.readFileSync(file, "utf8");
  const before = s;

  s = s.replace(chromeResolveRe, (_, name) => JSON.stringify(`/invitation/${name}`));
  s = s.replace(chromePathRe, (_, name) => {
    if (name === "thank-you" || name.startsWith("thank-you?")) {
      return JSON.stringify(`/invitation/${name}`);
    }
    return JSON.stringify(`/invitation/${name}`);
  });

  // Mistaken absolute API thank-you navigations
  s = s.replace(
    /resolveMediaUrl\(\s*["']\/invitation\/thank-you["']\s*\)/g,
    `"/invitation/thank-you"`
  );

  if (s !== before) {
    fs.writeFileSync(file, s);
    const left = (s.match(/\/assets\/events\/weddings\/templates\/template-1\/chrome\//g) || [])
      .length;
    console.log(`updated ${rel} remaining chrome refs: ${left}`);
  } else {
    console.log(`no change ${rel}`);
  }
}
