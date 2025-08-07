import { confirm } from "@inquirer/prompts"
import simpleGit from "simple-git"
import { getDefaultBranch } from "./branch-utils"
import { success } from "./logger"
import { getUpstreamName } from "./storage"

export async function mainMerge() {
  const git = simpleGit()
  const branchSummary = await git.branch()
  const currentBranch = branchSummary.current

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
  //   const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  if (!origin?.name) {
    throw new Error(`Could not find a remote called '${upstreamName}'`)
  }
  const originName = origin.name

  git.fetch(originName, defaultBranch)

  git.mergeFromTo(originName, defaultBranch)

  success(
    `Latest ${originName}/${defaultBranch} branch merged into this branch.`,
  )

  let pushToRemote = false
  if (!pushToRemote && origin) {
    pushToRemote = await confirm({
      message: `Push to ${originName}:`,
      default: false,
    })
  }

  if (pushToRemote) {
    await git.push(upstreamName, currentBranch)
    success(`Changes pushed to ${originName}/${currentBranch}`)
  }
}
