const fs = require("fs");
const path = require("path");
const { generateEdit } = require("./generateEdit");
const { getDiff } = require("./getDiff");

async function handleCodeEditRequest(instruction, fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  const originalCode = fs.readFileSync(filePath, "utf-8");

  const newCode = await generateEdit(filePath, instruction);
  const diff = getDiff(originalCode, newCode);

  return {
    filePath,
    originalCode,
    newCode,
    diff
  };
}

module.exports = { handleCodeEditRequest };
