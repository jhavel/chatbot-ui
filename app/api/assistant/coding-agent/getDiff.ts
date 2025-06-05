import * as diff from "diff"

export function getDiff(oldCode: string, newCode: string) {
  return diff.createTwoFilesPatch("old", "new", oldCode, newCode, "", "")
}
