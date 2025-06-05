const fs = require("fs");
const { execSync } = require("child_process");

function applyEdit(filePath, newContent, message) {
  // Overwrite file with new content
  fs.writeFileSync(filePath, newContent, "utf-8");

  // Stage and commit using Git
  execSync(`git add ${filePath}`);
  execSync(`git commit -m "${message}"`);

  console.log(`✅ Committed changes to ${filePath}`);
}

module.exports = { applyEdit };
