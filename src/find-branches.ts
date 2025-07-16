import { confirm } from "@inquirer/prompts"
import fuzzysort from "fuzzysort"
import kleur from "kleur"
import simpleGit, { type BranchSummaryBranch } from "simple-git"
import { getHumanAge } from "./human-age"
import { success, warn } from "./logger"

type Options = {
  search?: string
  number: string
  cleanup?: boolean
  reverse?: boolean
}
export async function findBranches(search: string, options: Options) {
  const cleanup = Boolean(options.cleanup)
  const number = Number.parseInt(options.number)
  const reverse = Boolean(options.reverse)
  if (Number.isNaN(number)) {
    throw new Error("Not a number")
  }

  const git = simpleGit()

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

  async function printSearchResults(searchResults: SearchResult[]) {
    for (const { name, highlit, branchInfo, merged } of searchResults) {
      const date = dates.get(name)
      console.log(
        `${date ? kleur.dim(`${getHumanAge(date)} ago`) : kleur.italic("no date")}`.padEnd(
          20,
          " ",
        ),
        highlit || name,
        branchInfo?.current
          ? kleur.bold().green("   (Your current branch)")
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

    if (cleanup && !merged) {
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

  if (countFound === 1) {
    const found = searchResults[0]
    if (found) {
      const checkOut = await confirm({
        message: `Check out (${found.name}):`,
        default: true,
      })
      const status = await git.status()
      if (!status.isClean()) {
        throw new Error(
          "Current branch is not in a clean state. Run `git status`",
        )
      }

      if (checkOut) {
        await git.checkout(found.name)
        success(`Checked out branch ${kleur.bold(found.name)}`)
      }
    }
  }
}
