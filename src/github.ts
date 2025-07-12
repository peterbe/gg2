import { input } from "@inquirer/prompts"
import { Octokit } from "octokit"
import simpleGit from "simple-git"
import { getDefaultBranch } from "./branch-utils"
import { getGitHubNWO } from "./github-utils"
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

  const config = await getGlobalConfig()
  const token = config["github-token"]
  if (!token) {
    throw new Error(
      "You have not set up a GitHub Personal Access Token. Run `github token`.",
    )
  }

  const remotes = await git.getRemotes(true) // true includes URLs
  const origin = remotes.find((remote) => remote.name === "origin")
  const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  if (!originUrl) {
    throw new Error(
      "Can't find an origin URL from the current remotes. Run `git remotes -v` to debug.",
    )
  }
  // const originName = origin ? origin.name : "origin"
  // console.log(origin)
  // console.log({ originUrl, originName })
  const nwo = getGitHubNWO(originUrl)
  if (!nwo)
    throw new Error(
      `Could not figure out owner/repo from the URL: ${originUrl}`,
    )
  const owner = nwo.split("/")[0]
  if (!owner) throw new Error(`Can't find owner part from '${nwo}'`)
  const repo = nwo.split("/").slice(1).join("/")
  if (!repo) throw new Error(`Can't find repo part from '${nwo}'`)

  const octokit = new Octokit({ auth: token })
  const { data: prs } = await octokit.rest.pulls.list({
    owner,
    repo,
    base: currentBranch,
    state: "all",
    sort: "updated",
    direction: "desc",
  })
  if (!prs.length) {
    warn("No pull request found.")
    return
  }

  for (const pr of prs) {
    console.log("PR")
    console.log(pr)
  }
}
