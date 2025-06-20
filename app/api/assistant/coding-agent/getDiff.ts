import { diffLines } from "diff"

function getDiff(oldCode: string, newCode: string): string {
  const changes = diffLines(oldCode, newCode)

  let result = ""

  for (const part of changes) {
    const prefix = part.added ? "+ " : part.removed ? "- " : "  "
    const lines = part.value.split("\n")
    for (const line of lines) {
      if (line.trim() === "") continue
      result += `${prefix}${line}\n`
    }
  }

  return result.trim()
}

module.exports = { getDiff }
