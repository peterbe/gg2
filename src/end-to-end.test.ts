import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { $ } from "bun"

describe("basics", async () => {
  let tempDir = ""
  let tempConfigFile = ""
  const original_GG_CONFIG_FILE = process.env.GG_CONFIG_FILE

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gg-test"))
    // tempDir = await mkdtemp(tmpdir())
    tempConfigFile = join(join(tempDir, ".."), ".gg.json")
    process.env.GG_CONFIG_FILE = tempConfigFile
  })
  afterEach(async () => {
    // console.log("Removing tempDir", tempDir)
    await rm(tempDir, { recursive: true })

    process.env.GG_CONFIG_FILE = original_GG_CONFIG_FILE
  })

  test("version", async () => {
    const output = await $`gg --version`.text()
    expect(/\d+\.\d+\d+/.test(output)).toBe(true)
  })
  test("help", async () => {
    const output = await $`gg --help`.text()
    expect(/Usage:/.test(output)).toBe(true)
  })

  test("create branch and commit", async () => {
    await $`git init`.cwd(tempDir)
    await $`echo "This is my new branch" | gg start`.cwd(tempDir)
    const branchName = await $`git branch --show-current`.cwd(tempDir).text()
    expect(branchName.trim()).toBe("this-is-my-new-branch")

    const config = JSON.parse(await Bun.file(tempConfigFile).text())
    const repos = config.REPOS
    // temp dirs are funny. It's /private/var/... on macOS
    // but /var/folders/k5/48d8b8wx5t359cw50_rhd6r00000gp/T/... when created with mkdtemp
    const repoKey = Object.keys(repos).find((key) => key.endsWith(tempDir))
    expect(repoKey).toBeDefined()
    const repoConfig = config.REPOS[repoKey as string]
    expect(repoConfig).toBeDefined()
    expect(repoConfig.BRANCH_TITLES["this-is-my-new-branch"]).toBe(
      "This is my new branch",
    )

    // Make some edits
    await $`echo "Some changes" >> README.md`.cwd(tempDir)
    await $`git add README.md`.cwd(tempDir)

    await $`echo "Yes that's the title" | gg commit`.cwd(tempDir)
    // await $`git commit -m "Added README"`.cwd(tempDir)

    const log = await $`git log`.cwd(tempDir).text()
    expect(log.includes("Yes that's the title")).toBe(true)
  })
})
