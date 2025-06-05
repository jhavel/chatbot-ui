const diff = require("diff");

function getDiff(oldCode, newCode) {
  return diff.createTwoFilesPatch("old", "new", oldCode, newCode, "", "");
}

module.exports = { getDiff };
