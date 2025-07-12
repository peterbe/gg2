import { input } from "@inquirer/prompts"
import type { Endpoints } from "@octokit/types"
import kleur from "kleur"
import { Octokit } from "octokit"
import simpleGit from "simple-git"
import { getDefaultBranch } from "./branch-utils"
import { getPRByBranchName, getPRDetailsByNumber } from "./github-utils"
import { success, warn } from "./logger"
import { getGlobalConfig, storeGlobalConfig } from "./storage"

type Options = {
  test?: boolean
}

export async function gitHubToken(token: string, options: Options) {
  const config = await getGlobalConfig()

  if (!token && config["github-token"] && options.test) {
    await testToken(config["github-token"])
    return
  }

  if (!token) {
    if (config["github-token"]) {
      warn(
        "You already have a token set. Use `token --test` if you just want to see if the existing one works.",
      )
    }
    token = await input({ message: "Token:" })
    if (!token) {
      throw new Error("No token entered")
    }
    await storeGlobalConfig("github-token", token)
  }

  await testToken(token)
}

async function testToken(token: string): Promise<void> {
  const octokit = new Octokit({ auth: token })
  const { data: user } = await octokit.rest.users.getAuthenticated()
  console.log(user)
  success("The current stored GitHub token is working")
}

export async function gitHubPR() {
  const git = simpleGit()
  const branchSummary = await git.branch()
  const currentBranch = branchSummary.current
  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(
      `You are on the default branch (${defaultBranch}). Switch to a feature branch first.`,
    )
  }

  const pr = await getPRByBranchName(currentBranch)
  if (!pr) {
    warn("Pull request not found.")
    return
  }

  // const config = await getGlobalConfig()
  // const token = config["github-token"]
  // if (!token) {
  //   throw new Error(
  //     "You have not set up a GitHub Personal Access Token. Run `github token`.",
  //   )
  // }

  // const remotes = await git.getRemotes(true) // true includes URLs
  // const origin = remotes.find((remote) => remote.name === "origin")
  // const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  // if (!originUrl) {
  //   throw new Error(
  //     "Can't find an origin URL from the current remotes. Run `git remotes -v` to debug.",
  //   )
  // }
  // const nwo = getGitHubNWO(originUrl)
  // if (!nwo)
  //   throw new Error(
  //     `Could not figure out owner/repo from the URL: ${originUrl}`,
  //   )
  // const owner = nwo.split("/")[0]
  // if (!owner) throw new Error(`Can't find owner part from '${nwo}'`)
  // const repo = nwo.split("/").slice(1).join("/")
  // if (!repo) throw new Error(`Can't find repo part from '${nwo}'`)

  // const octokit = new Octokit({ auth: token })
  // const { data: prs } = await octokit.rest.pulls.list({
  //   owner,
  //   repo,
  //   head: `${owner}:${currentBranch}`,
  //   state: "all",
  //   sort: "updated",
  //   direction: "desc",
  // })
  // if (!prs.length) {
  //   warn("No pull request found.")
  //   return
  // }
  success(
    `Number #${pr.number} ${pr.html_url} ${
      pr.draft ? "DRAFT" : pr.state.toUpperCase()
    }`,
  )

  const prDetails = await getPRDetailsByNumber(pr.number)

  // for (const pr of prs) {

  //   const { data: prDetails } = await octokit.rest.pulls.get({
  //     owner,
  //     repo,
  //     pull_number: pr.number,
  //   })

  //   // const KEYS: ("title" | "mergeable_state" | "mergeable")[] = [
  //   //   "title",
  //   //   "mergeable_state",
  //   //   "mergeable",
  //   // ]
  // type x = typeof octokit.rest.pulls.get
  //   type PullRequestData = GetResponseDataTypeFromEndpointMethod<
  //     x
  //   >
  type PullRequestResponse =
    Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"]

  // Access the data property of the response
  type PullRequestData = PullRequestResponse["data"]

  // Then, get the keys from that data type
  type PullRequestKeys = keyof PullRequestData
  // type PullRequestKeys = keyof PullRequestData
  const KEYS = ["title", "mergeable_state", "mergeable"] as PullRequestKeys[]
  const longestKey = Math.max(...KEYS.map((key) => key.length))
  const padding = Math.max(30, longestKey) + 1

  for (const key of KEYS) {
    const value = prDetails[key]
    console.log(
      kleur.bold(`${key}:`.padEnd(padding, " ")),
      typeof value === "string" ? kleur.italic(value) : value,
    )
  }
}
