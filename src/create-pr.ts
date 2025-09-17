import { input } from "@inquirer/prompts"
import kleur from "kleur"
import simpleGit from "simple-git"
import { getCurrentBranch, getDefaultBranch } from "./branch-utils"
import { createGitHubPR, findPRByBranchName } from "./github-utils"
import { warn } from "./logger"
import { getTitle } from "./storage"

type PROptions = {
  enableAutoMerge?: boolean
}

export async function createPR(options: PROptions) {
  const enableAutoMerge = Boolean(options.enableAutoMerge)

  if (enableAutoMerge) {
    throw new Error("Not implemented yet")
  }

  const git = simpleGit()
  const currentBranch = await getCurrentBranch(git)
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
    warn("There is already a PR for this branch.")
    console.log(kleur.bold(pr.html_url))
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
  console.log("Pull request created:")
  console.log(kleur.bold().green(data.html_url))
  console.log("(⌘-click to open URLs)")

  // const prNumber = data.number
  // if (enableAutoMerge) {
  // const data = await enablePRAutoMerge({ prNumber })
  // }
}
