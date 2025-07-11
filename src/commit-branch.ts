import { checkbox, confirm, input } from "@inquirer/prompts"
import simpleGit, { type SimpleGit } from "simple-git"
import { getDefaultBranch } from "./branch-utils"
import { getHumanAge } from "./human-age"
import { bold, success, warn } from "./logger"
import { getTitle } from "./storage"

type Options = {
  verify?: boolean
  yes?: boolean
}
export async function commitBranch(options: Options) {
  const yes = Boolean(options.yes)
  const noVerify = !options.verify
  const git = simpleGit()
  const branchSummary = await git.branch()
  const currentBranch = branchSummary.current

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
      // throw new Error(
      //   "Untracked files found. Please add them before committing."
      // );
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

  const storedTitle = await getTitle(currentBranch)
  const message = "Title:"
  let title = await input({ message, default: storedTitle })
  if (!title && storedTitle) {
    title = storedTitle
  }
  if (!title) {
    throw new Error("No title provided. Please provide a title for the commit.")
  }

  const remotes = await git.getRemotes(true) // true includes URLs
  const origin = remotes.find((remote) => remote.name === "origin")
  const originUrl = origin ? origin.refs.fetch : null // or origin.refs.push
  const originName = origin ? origin.name : "origin"

  let pushToRemote = yes
  if (!pushToRemote && origin) {
    pushToRemote = await confirm({
      message: `Push to ${originName}:`,
      default: true,
    })
    // if (askedPushToRemote.toLowerCase() === "n") {
    //   pushToRemote = false;
    // } else if (
    //   askedPushToRemote === "" ||
    //   askedPushToRemote.toLowerCase() === "y"
    // ) {
    //   pushToRemote = true;
    // } else {
    //   throw new Error("Invalid input. Please enter 'Y' or 'n'.");
    // }
  }

  const unstagedFiles = await getUnstagedFiles(git)
  await git.add(unstagedFiles)

  try {
    await git.commit(title, noVerify ? ["--no-verify"] : undefined)
    if (pushToRemote) {
      await git.push("origin", currentBranch)
      success(`Changes pushed to ${originName}/${currentBranch}`)
    } else {
      success("Changes committed but not pushed.")
    }
    const nwo = pushToRemote && originUrl && getGitHubNWO(originUrl)
    if (nwo) {
      // e.g. https://github.com/peterbe/admin-peterbecom/pull/new/upgrade-playwright

      bold(`https://github.com/${nwo}/pull/new/${currentBranch}`)
      console.log("(⌘-click to open URLs)")
    }
  } catch (error) {
    if (
      yes &&
      error instanceof Error &&
      error.message.includes("nothing to commit, working tree clean")
    ) {
      // console.log("ERROR", error)
      // console.log("ERROR.NAME", error.name)
      await git.push("origin", currentBranch)
      success(`Changes pushed to ${originName}/${currentBranch}`)
    } else {
      throw error
    }
  }
}

function getGitHubNWO(url: string): string | undefined {
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

async function getUntrackedFiles(git: SimpleGit): Promise<string[]> {
  const status = await git.status()
  return status.not_added.filter((file) => !file.endsWith("~"))
}

async function getUnstagedFiles(git: SimpleGit): Promise<string[]> {
  const status = await git.status()
  // console.log("Unstaged files:", status.staged);
  return status.modified
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
