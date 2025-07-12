import { describe, expect, test } from "bun:test"
import { slugifyTitleToBranchName } from "./slugify"

describe("slugify title to branch name", () => {
  test("keeps forward slashes", () => {
    expect(slugifyTitleToBranchName("peterbe/CAP-123 Bla bla")).toBe(
      "peterbe/cap-123-bla-bla",
    )
  })
})
