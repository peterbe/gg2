import { input } from "@inquirer/prompts"
import kleur from "kleur"
import { Octokit } from "octokit"
import simpleGit from "simple-git"
import { getDefaultBranch } from "./branch-utils"
import {
  getPRByBranchName,
  getPRDetailsByNumber,
  interpretMergeableStatus,
} from "./github-utils"
import { success, warn } from "./logger"
import { getGlobalConfig, storeGlobalConfig } from "./storage"

type TokenOptions = {
  test?: boolean
}

export async function gitHubToken(token: string, options: TokenOptions) {
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

type PROptions = {
  watch?: boolean
}

export async function gitHubPR(options: PROptions) {
  const watch = Boolean(options.watch)
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

  success(
    `Number #${pr.number} ${pr.html_url} ${
      pr.draft ? "DRAFT" : pr.state.toUpperCase()
    }`,
  )

  const prDetails = await getPRDetailsByNumber(pr.number)

  console.log(kleur.bold(`PR Title: ${prDetails.title}`))
  const { message, canMerge } = interpretMergeableStatus(prDetails)
  if (canMerge) success(message)
  else warn(message)

  if (watch) {
    let previousMessage = message
    let previousCanMerge = canMerge
    let attempts = 0
    const SLEEP_TIME_SECONDS = 5
    while (true) {
      console.log(`Watching (checking every ${SLEEP_TIME_SECONDS} seconds)...`)
      await sleep(SLEEP_TIME_SECONDS * 1000)
      const prDetails = await getPRDetailsByNumber(pr.number)
      const { message, canMerge } = interpretMergeableStatus(prDetails)
      console.clear()
      if (canMerge) success(message)
      else warn(message)

      if (message !== previousMessage || canMerge !== previousCanMerge) {
        break
      }
      previousMessage = message
      previousCanMerge = canMerge
      attempts++
      if (attempts > 100) {
        warn(`Sorry. Giving up on the PR watch after ${attempts} attempts.`)
        break
      }
    }
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
