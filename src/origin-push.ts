import kleur from "kleur"
import simpleGit from "simple-git"
import { getDefaultBranch } from "./branch-utils"
import { findPRByBranchName, getGitHubNWO } from "./github-utils"
import { bold, success, warn } from "./logger"
import { getRepoConfig } from "./storage"

export async function originPush() {
  const git = simpleGit()
  const branchSummary = await git.branch()
  const currentBranch = branchSummary.current

  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(`Can't commit when on the ${defaultBranch} branch.`)
  }

  const status = await git.status()
  if (!status.isClean()) {
    throw new Error("Current branch is not in a clean state. Run `git status`")
  }

  const config = await getRepoConfig()

  let upstreamName = config.upstreamName
  if (!upstreamName) {
    warn("No upstream name configured, defaulting to 'origin'")
    upstreamName = "origin"
  }

  const remotes = await git.getRemotes(true) // true includes URLs
  const origin = remotes.find((remote) => remote.name === upstreamName)
  const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  if (!origin?.name) {
    throw new Error("Could not find a remote called 'origin'")
  }
  const originName = origin.name

  await git.push("origin", currentBranch)
  success(`Changes pushed to ${originName}/${currentBranch}`)

  const nwo = originUrl && getGitHubNWO(originUrl)
  if (nwo) {
    const pr = await findPRByBranchName(currentBranch)

    console.log("") // just a spacer
    if (pr) {
      bold(pr.html_url)
    } else {
      console.log(
        kleur
          .bold()
          .green(`https://github.com/${nwo}/pull/new/${currentBranch}`),
      )
    }
    console.log("(⌘-click to open URLs)")
  }
}
