import kleur from "kleur"
import simpleGit from "simple-git"
import {
  getCurrentBranch,
  getDefaultBranch,
  getUnstagedFiles,
  getUntrackedFiles,
} from "./branch-utils"
import { findPRByBranchName, getGitHubNWO } from "./github-utils"
import { success, warn } from "./logger"
import { getBaseBranch, getUpstreamName } from "./storage"

export async function originPush() {
  const git = simpleGit()
  const currentBranch = await getCurrentBranch(git)

  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(`Can't commit when on the ${defaultBranch} branch.`)
  }

  const status = await git.status()
  if (!status.isClean()) {
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
  const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  if (!origin?.name) {
    throw new Error(`Could not find a remote called '${upstreamName}'`)
  }
  const originName = origin.name

  await git.push(upstreamName, currentBranch)
  success(`Changes pushed to ${originName}/${currentBranch}`)

  const nwo = originUrl && getGitHubNWO(originUrl)
  if (nwo) {
    const pr = await findPRByBranchName(currentBranch)

    console.log("") // just a spacer
    if (pr) {
      console.log(kleur.bold(pr.html_url))
    } else {
      let url: string
      const storedBaseBranch = await getBaseBranch(currentBranch)
      if (storedBaseBranch && storedBaseBranch !== defaultBranch) {
        url = `https://github.com/${nwo}/compare/${storedBaseBranch}...${currentBranch}?expand=1`
      } else {
        url = `https://github.com/${nwo}/pull/new/${currentBranch}`
      }
      console.log(kleur.bold().green(url))
    }
    console.log("(⌘-click to open URLs)")
  }
}
