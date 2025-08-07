import { input } from "@inquirer/prompts"
import simpleGit from "simple-git"
import { getDefaultBranch } from "./branch-utils"
import { createGitHubPR, findPRByBranchName } from "./github-utils"
import { error, warn } from "./logger"
import { getTitle } from "./storage"

type PROptions = {
  enableAutoMerge?: boolean
}

export async function createPR(options: PROptions) {
  const enableAutoMerge = Boolean(options.enableAutoMerge)
  const git = simpleGit()
  const branchSummary = await git.branch()
  const currentBranch = branchSummary.current
  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(
      `You are on the default branch (${defaultBranch}). Switch to a feature branch first.`,
    )
  }

  const status = await git.status()
  if (!status.isClean()) {
    throw new Error("Current branch is not in a clean state. Run `git status`")
  }

  const pr = await findPRByBranchName(currentBranch)
  if (pr) {
    error("There is already a PR for this branch.")
    return
  }

  const storedTitle = await getTitle(currentBranch)
  const message = "Title:"
  const title = await input({ message, default: storedTitle })

  const data = await createGitHubPR({
    head: currentBranch,
    base: defaultBranch,
    title,
    body: "",
    draft: false,
  })
  console.log("Pull request created:", data.html_url)

  // const prNumber = data.number
  if (enableAutoMerge) {
    warn("Enabling auto-merge is not yet implemented.")
    // const data = await enablePRAutoMerge({ prNumber })
  }
}
