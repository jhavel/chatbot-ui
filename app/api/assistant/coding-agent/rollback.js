const { execSync } = require("child_process");

function rollbackLastCommit() {
  try {
    execSync("git revert --no-edit HEAD", { stdio: "inherit" });
    console.log("⏪ Successfully reverted the last commit.");
  } catch (err) {
    console.error("❌ Rollback failed:", err.message);
  }
}

module.exports = { rollbackLastCommit };
