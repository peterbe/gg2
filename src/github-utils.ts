import { Octokit } from "octokit"
import simpleGit from "simple-git"
import { getGlobalConfig } from "./storage"

export function getGitHubNWO(url: string): string | undefined {
  // E.g. git@github.com:peterbe/admin-peterbecom.gi
  // or https://github.com/peterbe/admin-peterbecom.git"
  if (url.includes("github.com")) {
    if (URL.canParse(url)) {
      const parsed = new URL(url)
      return parsed.pathname.replace(/\.git$/, "").slice(1)
    }
    if (url.includes("git@github.com:")) {
      const second = url.split(":")[1]
      if (second) {
        return second.replace(/\.git$/, "")
      }
    } else {
      throw new Error(`Not implemented (${url})`)
    }
  }
  return url
}

export async function getPRByBranchName(branchName: string) {
  const octokit = await getOctokit()
  const [owner, repo] = await getOwnerRepo()
  const { data: prs } = await octokit.rest.pulls.list({
    owner,
    repo,
    head: `${owner}:${branchName}`,
    state: "all",
    sort: "updated",
    direction: "desc",
  })
  for (const pr of prs) {
    return pr
  }
}

async function getOwnerRepo(): Promise<[string, string]> {
  const git = simpleGit()
  const remotes = await git.getRemotes(true) // true includes URLs
  const origin = remotes.find((remote) => remote.name === "origin")
  const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  if (!originUrl) {
    throw new Error(
      "Can't find an origin URL from the current remotes. Run `git remotes -v` to debug.",
    )
  }
  const nwo = getGitHubNWO(originUrl)
  if (!nwo)
    throw new Error(
      `Could not figure out owner/repo from the URL: ${originUrl}`,
    )
  const owner = nwo.split("/")[0]
  if (!owner) throw new Error(`Can't find owner part from '${nwo}'`)
  const repo = nwo.split("/").slice(1).join("/")
  if (!repo) throw new Error(`Can't find repo part from '${nwo}'`)

  return [owner, repo]
}

async function getOctokit() {
  const config = await getGlobalConfig()
  const token = config["github-token"]
  if (!token) {
    throw new Error(
      "You have not set up a GitHub Personal Access Token. Run `github token`.",
    )
  }

  const octokit = new Octokit({ auth: token })
  return octokit
}

export async function getPRDetailsByNumber(number: number) {
  const octokit = await getOctokit()
  const [owner, repo] = await getOwnerRepo()

  const { data: prDetails } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: number,
  })
  return prDetails
}

type PRDetails = Awaited<ReturnType<typeof getPRDetailsByNumber>>
export function interpretMergeableStatus(pr: PRDetails) {
  // If PR is closed or already merged
  if (pr.state === "closed" && pr.merged) {
    return {
      canMerge: false,
      message: "PR is already merged",
    }
  }

  if (pr.state === "closed" && !pr.merged) {
    return {
      canMerge: false,
      message: "PR is closed without merging",
    }
  }

  // If PR is draft
  if (pr.draft) {
    return {
      canMerge: false,
      message: "PR is in draft state",
    }
  }

  // Check mergeable status
  switch (pr.mergeable_state) {
    case "clean":
      return {
        canMerge: true,
        message: "PR is ready to merge - all checks passed",
      }

    case "dirty":
      return {
        canMerge: false,
        message: "PR has merge conflicts that need to be resolved",
      }

    case "blocked":
      return {
        canMerge: false,
        message: "PR is blocked by required status checks or reviews",
      }

    case "behind":
      return {
        canMerge: true,
        message: "PR can be merged but base branch has newer commits",
      }

    case "unstable":
      return {
        canMerge: true,
        message: "PR can be merged but some status checks failed",
      }

    case "has_hooks":
      return {
        canMerge: true,
        message: "PR can be merged but has pre-receive hooks",
      }

    case "unknown":
      return {
        canMerge: null,
        message: "Mergeable status is being calculated, try again in a moment",
      }

    default:
      // Check the basic mergeable field as fallback
      if (pr.mergeable === true) {
        return {
          canMerge: true,
          message: "PR appears to be mergeable",
        }
      } else if (pr.mergeable === false) {
        return {
          canMerge: false,
          message: "PR has conflicts or other issues preventing merge",
        }
      } else {
        return {
          canMerge: null,
          message: "Mergeable status is null - GitHub is still calculating",
        }
      }
  }
}
