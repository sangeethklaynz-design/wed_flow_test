const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

fs.cpSync(path.join(rootDir, "src"), path.join(distDir, "src"), {
  recursive: true,
});

const assetsDir = path.join(rootDir, "assets");
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, path.join(distDir, "assets"), {
    recursive: true,
  });
}
