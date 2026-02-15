import { confirm, input } from "@inquirer/prompts"
import kleur from "kleur"
import { Octokit } from "octokit"
import simpleGit, { type SimpleGit } from "simple-git"
import { getCurrentBranch, getDefaultBranch } from "./branch-utils"
import { delay } from "./delay"
import { deleteLocalBranch } from "./get-back"
import {
  findPRByBranchName,
  getOwnerRepo,
  getPRDetailsByNumber,
  interpretMergeableStatus,
} from "./github-utils"
import { error, success, warn } from "./logger"
import { getGlobalConfig, getUpstreamName, storeGlobalConfig } from "./storage"

type TokenOptions = {
  test?: boolean
  testPrs?: boolean
}

export async function gitHubToken(token: string, options: TokenOptions) {
  const config = await getGlobalConfig()

  if (!token && config["github-token"] && (options.test || options.testPrs)) {
    await testToken(config["github-token"] as string, options)
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

  await testToken(token, options)
}

async function testToken(token: string, options: TokenOptions): Promise<void> {
  const octokit = new Octokit({ auth: token })
  if (options.testPrs) {
    const octokit = new Octokit({ auth: token })
    const [owner, repo] = await getOwnerRepo()
    try {
      const { data: prs } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: "open",
        sort: "updated",
        direction: "desc",
      })
      success(`Found ${prs.length} open PRs which means it was able to connect`)
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Not Found")) {
        error(
          "It did not work. The GitHub repo could not be found. That most likely means that token does not have read-access permission.",
        )
      } else {
        throw err
      }
    }
  } else {
    const { data: user } = await octokit.rest.users.getAuthenticated()
    console.log(user)
    success("The current stored GitHub token is working")
  }
}

type PROptions = {
  watch?: boolean
}

export async function gitHubPR(options: PROptions) {
  const watch = Boolean(options.watch)
  const git = simpleGit()
  const currentBranch = await getCurrentBranch(git)
  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(
      `You are on the default branch (${defaultBranch}). Switch to a feature branch first.`,
    )
  }

  const pr = await findPRByBranchName(currentBranch)
  if (!pr) {
    warn("Pull request not found.")
    return
  }

  success(
    `Number #${pr.number} ${kleur.bold(pr.html_url)} ${
      pr.draft ? "DRAFT" : pr.state.toUpperCase()
    }`,
  )

  const prDetails = await getPRDetailsByNumber(pr.number)

  console.log(kleur.bold(`PR Title: ${prDetails.title}`))
  const { message, canMerge, hasWarning } = interpretMergeableStatus(prDetails)
  if (canMerge && !hasWarning) success(message)
  else warn(message)

  if (prDetails.mergeable_state === "behind") {
    await isBehind({ git, defaultBranch, currentBranch })
  } else if (prDetails.state === "closed" && prDetails.merged) {
    await getBack({ git, defaultBranch, currentBranch })
  } else if (prDetails.auto_merge) {
    success("Can auto-merge!")
  }

  if (watch) {
    let previousMessage = message
    let previousCanMerge = canMerge
    let attempts = 0
    const SLEEP_TIME_SECONDS = 5
    while (true) {
      await delay(
        SLEEP_TIME_SECONDS * 1000,
        `Waiting before checking again... (attempt ${attempts + 1})`,
      )
      const prDetails = await getPRDetailsByNumber(pr.number)
      const { message, canMerge, hasWarning } =
        interpretMergeableStatus(prDetails)
      console.log(kleur.bold(`PR Title: ${prDetails.title}`))
      if (canMerge && !hasWarning) success(message)
      else warn(message)

      if (message !== previousMessage || canMerge !== previousCanMerge) {
        success("Output changed, so quitting the watch")
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

async function isBehind({
  git,
  defaultBranch,
  currentBranch,
}: {
  git: SimpleGit
  defaultBranch: string
  currentBranch: string
}) {
  warn("PR appears to be be behind the base branch")
  const attemptMastermerge = await confirm({
    message: `Attempt to merge upstream ${kleur.italic(defaultBranch)} into ${kleur.italic(currentBranch)} now?`,
    default: false,
  })
  if (attemptMastermerge) {
    const upstreamName = await getUpstreamName()

    const remotes = await git.getRemotes(true) // true includes URLs
    const origin = remotes.find((remote) => remote.name === upstreamName)
    if (!origin?.name) {
      throw new Error(`Could not find a remote called '${upstreamName}'`)
    }
    const originName = origin.name
    await git.fetch(originName, defaultBranch)

    await git.mergeFromTo(originName, defaultBranch)

    success(
      `Latest ${originName}/${defaultBranch} branch merged into this branch.`,
    )

    let pushToRemote = false
    if (!pushToRemote && origin) {
      pushToRemote = await confirm({
        message: `Push to ${originName}:`,
        default: true,
      })
    }

    if (pushToRemote) {
      await git.push(upstreamName, currentBranch)
      success(`Changes pushed to ${originName}/${currentBranch}`)
    }
  }
}

async function getBack({
  git,
  defaultBranch,
  currentBranch,
}: {
  git: SimpleGit
  defaultBranch: string
  currentBranch: string
}) {
  const status = await git.status()
  if (!status.isClean()) {
    return
  }

  success("PR has been merged!")
  const goBack = await confirm({
    message: `Go back to branch ${kleur.italic(defaultBranch)} and clean this branch up?`,
    default: true,
  })
  if (goBack) {
    await git.checkout(defaultBranch)

    const upstreamName = await getUpstreamName()

    const remotes = await git.getRemotes(true)
    const origin = remotes.find((remote) => remote.name === upstreamName)
    if (origin) {
      await git.pull(origin.name, defaultBranch)
      warn(`Going to delete branch ${kleur.italic(currentBranch)}`)
      await deleteLocalBranch({ git, currentBranch, defaultBranch, yes: false })
    }
  }
}
