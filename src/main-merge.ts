import { confirm } from "@inquirer/prompts"
import simpleGit from "simple-git"
import {
  getCurrentBranch,
  getDefaultBranch,
  getUnstagedFiles,
  getUntrackedFiles,
} from "./branch-utils"
import { success, warn } from "./logger"
import { getBaseBranch, getUpstreamName } from "./storage"

type Options = {
  yes?: boolean
}

export async function mainMerge(options: Options) {
  const yes = Boolean(options.yes)
  const git = simpleGit()
  const currentBranch = await getCurrentBranch(git)

  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(`You are on the default branch (${defaultBranch}) already.`)
  }

  const status = await git.status()
  if (!status.isClean()) {
    // throw new Error("Current branch is not in a clean state. Run `git status`")
    // Is it only untracked files? If so, we can ignore them
    const untrackedFiles = await getUntrackedFiles(git)
    const unstagedFiles = await getUnstagedFiles(git)
    if (unstagedFiles.length > 0) {
      throw new Error(
        "Current branch is not in a clean state. Run `git status`",
      )
    } else if (untrackedFiles.length > 0) {
      warn(
        `There are ${untrackedFiles.length} untracked file${untrackedFiles.length > 1 ? "s" : ""}. Going to ignore that`,
      )
    }
  }

  const upstreamName = await getUpstreamName()

  const remotes = await git.getRemotes(true) // true includes URLs
  const origin = remotes.find((remote) => remote.name === upstreamName)
  if (!origin?.name) {
    throw new Error(`Could not find a remote called '${upstreamName}'`)
  }

  const originName = origin.name
  const baseBranch = await getBaseBranch(currentBranch)
  if (!baseBranch) {
    throw new Error("The base branch is not known for this branch.")
  }

  await git.fetch(originName, baseBranch)

  await git.mergeFromTo(originName, baseBranch)

  success(`Latest ${originName}/${baseBranch} branch merged into this branch.`)

  let pushToRemote = false
  if (!pushToRemote && origin) {
    pushToRemote =
      yes ||
      (await confirm({
        message: `Push to ${originName}:`,
        default: false,
      }))
  }

  if (pushToRemote) {
    await git.push(upstreamName, currentBranch)
    success(`Changes pushed to ${originName}/${currentBranch}`)
  }
}
