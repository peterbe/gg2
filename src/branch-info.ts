import kleur from "kleur"
import simpleGit from "simple-git"
import {
  countCommitsAhead,
  countCommitsBehind,
  getCurrentBranch,
  getDefaultBranch,
} from "./branch-utils"
import {
  findBranchByBranchName,
  findPRByBranchName,
  getGitHubNWO,
} from "./github-utils"
import { warn } from "./logger"
import { getBaseBranch, getUpstreamName } from "./storage"

export async function branchInfo() {
  const git = simpleGit()
  const currentBranch = await getCurrentBranch(git)
  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    warn(`You are on the default branch (${defaultBranch}) already.`)
    return
  }

  const records: Record<string, string | null> = {}
  const warnings: string[] = []

  const status = await git.status()
  if (!status.isClean()) {
    records.Status = "Uncommitted changes"
    warnings.push("Local branch has uncommitted changes.")
  } else {
    console.log({
      ahead: status.ahead,
      behind: status.behind,
      detached: status.detached,
      conflicted: status.conflicted,
    })
  }
  records["Current Branch"] = currentBranch
  records["Default Branch"] = defaultBranch

  const storedBaseBranch = await getBaseBranch(currentBranch)
  records["Base Branch"] = storedBaseBranch || "(not set)"

  const upstreamName = await getUpstreamName()
  const remotes = await git.getRemotes(true) // true includes URLs
  const origin = remotes.find((remote) => remote.name === upstreamName)
  const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  const nwo = originUrl && getGitHubNWO(originUrl)
  if (nwo) {
    records["GitHub Repo"] = nwo || null
    const pr = await findPRByBranchName(currentBranch)
    records["GitHub PR"] = pr ? pr.html_url : null

    const remoteBranch = await findBranchByBranchName(currentBranch)
    records["GitHub Branch"] = remoteBranch ? remoteBranch._links.html : null
    if (remoteBranch) {
      const commitsAhead = await countCommitsAhead(
        git,
        currentBranch,
        upstreamName,
      )
      records["Commits Ahead"] =
        `${commitsAhead} commit${commitsAhead === 1 ? "" : "s"} ahead ${upstreamName}/${currentBranch}`

      const commitsBehind = await countCommitsBehind(
        git,
        currentBranch,
        upstreamName,
      )
      records["Commits Behind"] =
        `${commitsBehind} commit${commitsBehind === 1 ? "" : "s"} behind ${upstreamName}/${currentBranch}`

      if (commitsBehind > 0) {
        warnings.push(
          "You might want to pull the latest changes from the remote branch.",
        )
      } else if (commitsAhead > 0) {
        warnings.push(
          "You might want to push your commits to the remote branch.",
        )
      }
    }
  }

  const longestKeyLength = Math.max(
    ...Object.keys(records).map((key) => key.length),
  )
  const extraPadding = 2

  console.log("Branch Information:\n")
  for (const [key, value] of Object.entries(records)) {
    const paddedKey = `${key}:`.padEnd(longestKeyLength + extraPadding, " ")
    console.log(
      `  ${paddedKey} ${value === null ? kleur.dim("n/a") : kleur.bold(value)}`,
    )
  }
  console.log("")

  for (const warning of warnings) {
    warn(warning)
  }

  //   const status = await git.status()
  //   if (!status.isClean()) {
  //     throw new Error("Current branch is not in a clean state. Run `git status`")
  //   }

  //   const status = await git.status()
  //   if (!status.isClean()) {
  //     throw new Error("Current branch is not in a clean state. Run `git status`")
  //   }

  //   const upstreamName = await getUpstreamName()

  //   const remotes = await git.getRemotes(true) // true includes URLs
  //   const origin = remotes.find((remote) => remote.name === upstreamName)
  //   //   const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  //   if (!origin?.name) {
  //     throw new Error(`Could not find a remote called '${upstreamName}'`)
  //   }
  //   const originName = origin.name

  //   await git.fetch(originName, defaultBranch)

  //   await git.mergeFromTo(originName, defaultBranch)

  //   success(
  //     `Latest ${originName}/${defaultBranch} branch merged into this branch.`,
  //   )

  //   let pushToRemote = false
  //   if (!pushToRemote && origin) {
  //     pushToRemote = await confirm({
  //       message: `Push to ${originName}:`,
  //       default: false,
  //     })
  //   }

  //   if (pushToRemote) {
  //     await git.push(upstreamName, currentBranch)
  //     success(`Changes pushed to ${originName}/${currentBranch}`)
  //   }
}
