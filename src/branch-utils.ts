import type { SimpleGit } from "simple-git"
import { error, warn } from "./logger"

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

      warn(
        "The command `git config --get init.defaultBranch` failed. Try it manually.",
      )
      warn(
        "You might need to run `git config --global init.defaultBranch main` manually.",
      )
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

export async function countCommitsAhead(git: SimpleGit, branchName: string) {
  const currentBranch = await getCurrentBranch(git)
  const result = await git.raw([
    "rev-list",
    "--count",
    `${branchName}..${currentBranch}`,
  ])
  const count = parseInt(result.trim(), 10)
  return count
}

export async function countCommitsBehind(git: SimpleGit, branchName: string) {
  const currentBranch = await getCurrentBranch(git)
  const result = await git.raw([
    "rev-list",
    "--count",
    `${currentBranch}..${branchName}`,
  ])
  const count = parseInt(result.trim(), 10)
  return count
}
