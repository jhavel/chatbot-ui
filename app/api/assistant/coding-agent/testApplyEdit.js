const fs = require("fs");
const path = require("path");
const { applyEdit } = require("./applyEdit");

const testFilePath = path.resolve(__dirname, "tempTestFile.js");

// Create dummy content
fs.writeFileSync(testFilePath, `console.log("Original");`, "utf-8");

// Apply edit
applyEdit(testFilePath, `console.log("Edited by assistant");`, "Test commit from applyEdit");

console.log("File after edit:\n", fs.readFileSync(testFilePath, "utf-8"));
