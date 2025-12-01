import kleur from "kleur"
import simpleGit from "simple-git"
import { getCurrentBranch, getDefaultBranch } from "./branch-utils"
import { findPRByBranchName, getGitHubNWO } from "./github-utils"
import { success } from "./logger"
import { getBaseBranch, getUpstreamName } from "./storage"

export async function originPush() {
  const git = simpleGit()
  const currentBranch = await getCurrentBranch(git)

  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(`Can't commit when on the ${defaultBranch} branch.`)
  }

  const status = await git.status()
  // XXX It will say it's not clean if all you have is a new file
  // that hasn't been staged yet. Make it prompt for override?
  if (!status.isClean()) {
    throw new Error("Current branch is not in a clean state. Run `git status`")
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
