import { confirm } from "@inquirer/prompts"
import fuzzysort from "fuzzysort"
import kleur from "kleur"
import simpleGit, { type BranchSummaryBranch } from "simple-git"
import {
  getDefaultBranch,
  getUnstagedFiles,
  getUntrackedFiles,
} from "./branch-utils"
import { getHumanAge } from "./human-age"
import { success, warn } from "./logger"

type Options = {
  search?: string
  number: string
  cleanup?: boolean
  reverse?: boolean
  cleanupAll?: boolean
  yes?: boolean
}
export async function findBranches(search: string, options: Options) {
  const yes = Boolean(options.yes)
  const cleanup = Boolean(options.cleanup)
  const cleanupAll = Boolean(options.cleanupAll)
  const number = Number.parseInt(options.number, 10)
  const reverse = Boolean(options.reverse)
  if (Number.isNaN(number)) {
    throw new Error("Not a number")
  }

  const git = simpleGit()
  const currentBranchSummary = await git.branch()
  const currentBranch = currentBranchSummary.current

  const rawDates = await git.raw(
    "branch",
    "--all",
    "--format=%(refname:short)|%(committerdate:iso)",
  )
  const dates = new Map<string, Date>()
  for (const line of rawDates.split(/\n+/g)) {
    const [refname, dateStr] = line.split("|")
    if (refname && dateStr) {
      dates.set(refname, new Date(dateStr))
    }
  }

  const isMerged = new Set<string>()
  const rawMerged = await git.raw("branch", "--all", "--merged")
  for (const line of rawMerged.split(/\n+/g)) {
    if (line.trim()) {
      isMerged.add(line.trim())
    }
  }

  const branchSummary = await git.branch([
    "--all",
    reverse ? "--sort=committerdate" : "--sort=-committerdate",
  ])

  type SearchResult = {
    name: string
    highlit?: string
    branchInfo?: BranchSummaryBranch
    merged: boolean
  }

  const defaultBranch = await getDefaultBranch(git)

  async function printSearchResults(searchResults: SearchResult[]) {
    for (const { name, highlit, branchInfo, merged } of searchResults) {
      const date = dates.get(name)
      console.log(
        `${date ? kleur.dim(`${getHumanAge(date)} ago`) : kleur.italic("no date")}`.padEnd(
          30,
          " ",
        ),
        highlit || name,
        branchInfo?.current
          ? kleur.bold().green("   (Your current branch)")
          : name === defaultBranch
            ? kleur.cyan("   (default branch)")
            : merged
              ? kleur.cyan("  (merged already)")
              : "",
      )

      if (cleanup) {
        const doDelete = await confirm({
          message: `Delete this branch locally?`,
          default: false,
        })
        if (doDelete) {
          await git.deleteLocalBranch(name)
          success(`Deleted branch ${kleur.bold(name)}\n`)
        }
      }
    }
    if (cleanupAll) {
      const doDelete = await confirm({
        message: `Delete all branches locally?`,
        default: false,
      })
      if (doDelete) {
        for (const { name } of searchResults) {
          await git.deleteLocalBranch(name)
          success(`Deleted branch ${kleur.bold(name)}\n`)
        }
      }
    }
  }

  const branchNames = branchSummary.all.filter(
    (name) => !name.startsWith("remotes/origin/"),
  )
  let countFound = 0
  const foundBranchNames = branchNames
  const searchResults: SearchResult[] = []
  for (const branch of foundBranchNames) {
    const branchInfo = branchSummary.branches[branch]

    const merged = isMerged.has(branch)

    if ((cleanup || cleanupAll) && !merged) {
      continue
    }

    if (search) {
      const matched = fuzzysort.single(search, branch)
      if (!matched) {
        continue
      }

      // Bold
      searchResults.push({
        name: branch,
        highlit: matched.highlight("\x1b[1m", "\x1b[0m"),
        branchInfo,
        merged,
      })
    } else {
      searchResults.push({
        name: branch,
        branchInfo,
        merged,
      })
    }
    countFound++
  }
  if (!countFound) {
    warn("Found nothing")
  } else {
    await printSearchResults(searchResults)
  }

  if (
    !(cleanup || cleanupAll) &&
    countFound === 1 &&
    searchResults[0] &&
    searchResults[0].name !== currentBranch
  ) {
    const found = searchResults[0]
    if (found) {
      const checkOut =
        yes ||
        (await confirm({
          message: `Check out (${found.name}):`,
          default: true,
        }))
      const status = await git.status()
      if (!status.isClean()) {
        // Is it only untracked files? If so, we can ignore them
        const untrackedFiles = await getUntrackedFiles(git)
        const unstagedFiles = await getUnstagedFiles(git)
        if (unstagedFiles.length > 0) {
          throw new Error(
            "Current branch is not in a clean state. Run `git status`",
          )
        } else if (untrackedFiles.length > 0) {
          warn(
            `There are ${untrackedFiles.length} untracked file${untrackedFiles.length > 1 ? "s" : ""}. Going to ignore that`,
          )
        }
      }

      if (checkOut) {
        await git.checkout(found.name)
        success(`Checked out branch ${kleur.bold(found.name)}`)
      }
    }
  }
}
