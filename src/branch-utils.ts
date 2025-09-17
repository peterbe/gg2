import type { SimpleGit } from "simple-git"
import { error } from "./logger"

export async function getDefaultBranch(git: SimpleGit) {
  try {
    const result = await git.raw(["symbolic-ref", "refs/remotes/origin/HEAD"])
    if (result) {
      const defaultBranch = result.trim().replace("refs/remotes/origin/", "")
      if (defaultBranch) {
        return defaultBranch
      }
    }

    const branches = await git.branch(["-r"])
    const defaultBranch = branches.all
      .find((branch) => branch.includes("origin/HEAD -> origin/"))
      ?.split("origin/HEAD -> origin/")[1]

    return defaultBranch || "main"
  } catch (err) {
    // This can happen if you've never pushed to a remote before
    if (
      err instanceof Error &&
      err.message.includes("ref refs/remotes/origin/HEAD is not a symbolic ref")
    ) {
      const result = await git.raw(["config", "--get", "init.defaultBranch"])
      if (result?.trim()) {
        return result.trim()
      }
      error(
        "Unable to determine the default branch by checking the origin/HEAD",
      )
    }
    throw err
  }
}

export async function getCurrentBranch(git: SimpleGit) {
  const branchSummary = await git.branch(["--show-current"])
  const currentBranch = branchSummary.current
  if (currentBranch) {
    return currentBranch
  }
  const rawBranch = await git.raw("branch", "--show-current")
  return rawBranch.trim()
}
