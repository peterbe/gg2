import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { $ } from "bun"

describe("basics", async () => {
  let tempDir = ""
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gg-test"))
    // tempDir = await mkdtemp(tmpdir())
  })
  afterEach(async () => {
    // console.log("Removing tempDir", tempDir)
    await rm(tempDir, { recursive: true })
  })

  // test("version", async () => {
  //   const output = await $`gg --version`.text()
  //   expect(/\d+\.\d+\d+/.test(output)).toBe(true)
  // })
  // test("help", async () => {
  //   const output = await $`gg --help`.text()
  //   expect(/Usage:/.test(output)).toBe(true)
  // })

  test("create branch and commit", async () => {
    await $`git init`.cwd(tempDir)
    await $`echo "This is my new branch" | gg start`.cwd(tempDir)
    const branchName = await $`git branch --show-current`.cwd(tempDir).text()
    expect(branchName.trim()).toBe("this-is-my-new-branch")

    // Make some edits
    await $`echo "Some changes" >> README.md`.cwd(tempDir)
    await $`git add README.md`.cwd(tempDir)

    await $`echo "Yes that's the title" | gg commit`.cwd(tempDir)
    // await $`git commit -m "Added README"`.cwd(tempDir)

    const log = await $`git log`.cwd(tempDir).text()
    expect(log.includes("Yes that's the title")).toBe(true)
  })
})
