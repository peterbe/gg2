import { checkbox, input } from "@inquirer/prompts"
import simpleGit, { type SimpleGit } from "simple-git"
import { getHumanAge } from "./human-age"
import { success, warn } from "./logger"
import { getTitle } from "./storage"

type Options = {
  verify?: boolean
  yes?: boolean
}
export async function commitBranch(options: Options) {
  const noVerify = !options.verify
  const git = simpleGit()
  const branchSummary = await git.branch()
  const currentBranch = branchSummary.current

  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(
      `You are on the default branch (${defaultBranch}). Please switch to a feature branch before committing.`,
    )
  }

  const untrackedFiles = await getUntrackedFiles(git)
  if (untrackedFiles.length > 0) {
    warn("\nUntracked files:")
    await printUnTrackedFiles(untrackedFiles)
    console.log("")
    const confirm = await input({
      message: "Do you want to add these untracked files? [y/n/i]",
    })
    if (confirm.toLowerCase() === "n") {
      // throw new Error(
      //   "Untracked files found. Please add them before committing."
      // );
    } else if (confirm.toLowerCase() === "y") {
      await git.add(untrackedFiles)
    } else if (confirm.toLowerCase() === "i") {
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
  const originName = originUrl

  let pushToRemote = Boolean(options.yes)
  if (!pushToRemote && origin) {
    const askedPushToRemote = await input({
      message: `Push to ${originName}: [Y/n]`,
    })
    if (askedPushToRemote.toLowerCase() === "n") {
      pushToRemote = false
    } else if (
      askedPushToRemote === "" ||
      askedPushToRemote.toLowerCase() === "y"
    ) {
      pushToRemote = true
    } else {
      throw new Error("Invalid input. Please enter 'Y' or 'n'.")
    }
  }

  const unstagedFiles = await getUnstagedFiles(git)
  console.log("unstagedFiles:", unstagedFiles)
  await git.add(unstagedFiles)

  await git.commit(title, noVerify ? ["--no-verify"] : undefined)
  if (pushToRemote) {
    await git.push("origin", currentBranch)
    success(`Changes pushed to ${originName}/${currentBranch}`)
  } else {
    success("Changes committed but not pushed.")
  }
  warn("Need to print URL for creating new gitHub pr")
}

async function getUntrackedFiles(git: SimpleGit): Promise<string[]> {
  const status = await git.status()
  return status.not_added
}

async function getUnstagedFiles(git: SimpleGit): Promise<string[]> {
  const status = await git.status()
  // console.log("Unstaged files:", status.staged);
  return status.modified
}

async function getDefaultBranch(git: SimpleGit) {
  const branches = await git.branch(["-r"])
  const defaultBranch = branches.all
    .find((branch) => branch.includes("origin/HEAD -> origin/"))
    ?.split("origin/HEAD -> origin/")[1]

  return defaultBranch || "main"
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
