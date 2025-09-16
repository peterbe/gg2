import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { $ } from "bun"

describe("basics", async () => {
  let tempDir = ""
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "myapp-"))
  })
  afterEach(async () => {
    await rm(tempDir, { recursive: true })
  })

  test("help", async () => {
    const output = await $`gg --version`.cwd(tempDir).text()
    expect(/\d+\.\d+\d+/.test(output)).toBe(true)
  })
})
