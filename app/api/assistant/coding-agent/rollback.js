const { execSync } = require("child_process");

function rollbackLastCommit() {
  execSync("git revert --no-edit HEAD");
  console.log("⏪ Last commit has been reverted.");
}

module.exports = { rollbackLastCommit };
