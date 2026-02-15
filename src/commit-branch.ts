import { checkbox, confirm, input } from "@inquirer/prompts"
import kleur from "kleur"
import simpleGit, { type SimpleGit } from "simple-git"
import yoctoSpinner from "yocto-spinner"
import {
  getCurrentBranch,
  getDefaultBranch,
  getUnstagedFiles,
  getUntrackedFiles,
} from "./branch-utils"
import {
  createGitHubPR,
  findPRByBranchName,
  getGitHubNWO,
  getPRDetailsByNumber,
  interpretMergeableStatus,
} from "./github-utils"
import { getHumanAge } from "./human-age"
import { success, warn } from "./logger"
import {
  getBaseBranch,
  getRepoConfig,
  getTitle,
  getUpstreamName,
} from "./storage"

type Options = {
  verify?: boolean
  yes?: boolean
}

export async function commitBranch(message: string, options: Options) {
  const yes = Boolean(options.yes)
  const noVerify = !options.verify
  const git = simpleGit()
  const currentBranch = await getCurrentBranch(git)
  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(
      `You are on the default branch (${defaultBranch}). Switch to a feature branch before committing.`,
    )
  }

  const untrackedFiles = await getUntrackedFiles(git)
  if (untrackedFiles.length > 0) {
    warn("\nUntracked files:")
    await printUnTrackedFiles(untrackedFiles)
    console.log("")
    const confirmed = await input({
      message: "Do you want to add these untracked files? [y/n/i]",
    })
    if (confirmed.toLowerCase() === "n") {
    } else if (confirmed.toLowerCase() === "y") {
      await git.add(untrackedFiles)
    } else if (confirmed.toLowerCase() === "i") {
      // Interactive
      const choices: { name: string; value: string }[] = []
      for (const name of untrackedFiles) {
        const file = Bun.file(name)
        const stats = await file.stat()
        choices.push({
          value: name,
          name: `${name}  (${getHumanAge(stats.mtime)})`,
        })
      }
      const answer = await checkbox({
        message: "Select which untracked files to add (use spacebar to select)",
        choices,
      })
      await git.add(answer)
    } else {
      throw new Error("Invalid input. Please enter 'Y' or 'n'.")
    }
  }

  // If there was an explicit (commit) message passed at the invocation,
  // don't bother asking.
  let title = message
  if (!title) {
    const storedTitle = await getTitle(currentBranch)
    title = await input({ message: "Title:", default: storedTitle })
    if (!title && storedTitle) {
      title = storedTitle
    }
    if (!title) {
      throw new Error(
        "No title provided. Please provide a title for the commit.",
      )
    }
  }

  const upstreamName = await getUpstreamName()

  const remotes = await git.getRemotes(true) // true includes URLs
  const origin = remotes.find((remote) => remote.name === upstreamName)
  const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  const originName = origin ? origin.name : upstreamName

  const unstagedFiles = await getUnstagedFiles(git)
  await git.add(unstagedFiles)

  try {
    await commit(git, title, noVerify)
  } catch (error) {
    console.warn("An error happened when trying to commmit!")
    if (
      yes &&
      error instanceof Error &&
      error.message.includes("nothing to commit, working tree clean")
    ) {
      await git.push(upstreamName, currentBranch)
      success(`Changes pushed to ${originName}/${currentBranch}`)
    } else {
      throw error
    }
  }

  let pushToRemote = yes
  if (!pushToRemote && origin) {
    pushToRemote = await confirm({
      message: `Push to ${originName}:`,
      default: true,
    })
  }

  if (pushToRemote) {
    await git.push(upstreamName, currentBranch)
    success(`Changes pushed to ${originName}/${currentBranch}`)
  } else {
    success("Changes committed but not pushed.")
  }
  console.log("\n")
  const nwo = pushToRemote && originUrl && getGitHubNWO(originUrl)
  if (nwo) {
    const pr = await findPRByBranchName(currentBranch)

    if (pr) {
      console.log(kleur.bold(pr.title))
      console.log(kleur.bold().green(pr.html_url))

      // Force a slight delay because sometimes it says the PR is
      // ready to merge, even though you've just pushed more commits.
      // const spinner = yoctoSpinner({ text: "Loading PR details…" }).start()
      // await sleep(2000)
      // spinner.stop()
      await delay(3000, "Loading PR details...")

      let prDetails = await getPRDetailsByNumber(pr.number)
      let retries = 3
      const spinner =
        prDetails.mergeable_state === "unknown"
          ? yoctoSpinner({
              text: `PR mergeable state is unknown. Trying again...`,
            }).start()
          : null
      while (prDetails.mergeable_state === "unknown" && retries-- > 0) {
        // warn(`PR mergeable state is unknown. Trying again... (${retries})`)
        // Wait a bit and try again
        await sleep(2000)
        prDetails = await getPRDetailsByNumber(pr.number)
      }
      if (spinner) {
        spinner.stop()
      }

      const { message, canMerge, hasWarning } =
        interpretMergeableStatus(prDetails)
      if (canMerge && !hasWarning) success(message)
      else warn(message)
    } else {
      // e.g. https://github.com/peterbe/admin-peterbecom/pull/new/upgrade-playwright
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

    const config = await getRepoConfig()
    const disablePRCreation = config["disable-pr-creation"]
    if (!pr && !disablePRCreation) {
      console.log("")
      const createPr = await confirm({
        message: `Create new PR:`,
        default: yes,
      })
      if (createPr) {
        const storedTitle = await getTitle(currentBranch)
        const message = "Title:"
        const title = await input({ message, default: storedTitle })
        const storedBaseBranch = await getBaseBranch(currentBranch)

        const baseBranch =
          storedBaseBranch && storedBaseBranch !== defaultBranch
            ? await input({
                message: "Base branch:",
                default: storedBaseBranch,
              })
            : defaultBranch

        const data = await createGitHubPR({
          head: currentBranch,
          base: baseBranch,
          title,
          body: "",
          draft: false,
        })
        console.log("Pull request created:")
        console.log(kleur.bold().green(data.html_url))
      }
    }
  }
}

async function delay(ms: number, text: string) {
  const spinner = yoctoSpinner({ text }).start()
  await sleep(ms)
  spinner.stop()
}

async function commit(
  git: SimpleGit,
  title: string,
  noVerify: boolean,
): Promise<void> {
  if (noVerify) {
    await git.commit(title, ["--no-verify"])
  } else {
    // If the pre-commit hook prints errors, with colors,
    // using this Bun.spawn is the only way I know to preserve those outputs
    // in color.
    // This also means, that when all goes well, it will print too.
    const proc = Bun.spawn(["git", "commit", "-m", title])

    const exited = await proc.exited

    if (exited) {
      if (!noVerify) {
        console.log("\n")
        warn("Commit failed and you did not use --no-verify.")
        const retry = await confirm({
          message: "Try again but with --no-verify?",
          default: false,
        })
        if (retry) {
          warn(`Retrying commit ${kleur.italic("with")} --no-verify...`)
          await commit(git, title, true)
          success("Commit succeeded with --no-verify")
          return
        }
      }

      console.log("\n")
      warn("Warning! The git commit failed.")
      warn(
        "Hopefully the printed error message above is clear enough. You'll have to try to commit again.",
      )
      process.exit(exited)
    }
  }
}

async function printUnTrackedFiles(files: string[]) {
  const longestFileName = Math.max(...files.map((file) => file.length))
  for (const filePath of files) {
    const file = Bun.file(filePath)
    const stats = await file.stat()
    const age = getHumanAge(stats.mtime)
    console.log(`${filePath.padEnd(longestFileName + 10, " ")}  ${age} old`)
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
