import { confirm } from "@inquirer/prompts"
import simpleGit from "simple-git"
import { getCurrentBranch, getDefaultBranch } from "./branch-utils"
import { success } from "./logger"
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
    throw new Error("Current branch is not in a clean state. Run `git status`")
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
