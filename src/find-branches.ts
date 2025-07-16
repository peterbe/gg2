import { confirm } from "@inquirer/prompts"
import fuzzysort from "fuzzysort"
import kleur from "kleur"
import simpleGit, { type BranchSummaryBranch } from "simple-git"
import { getHumanAge } from "./human-age"
import { success, warn } from "./logger"

type Options = {
  search?: string
  number: string
}
export async function findBranches(search: string, options: Options) {
  const number = Number.parseInt(options.number)
  if (Number.isNaN(number)) {
    throw new Error("Not a number")
  }

  const git = simpleGit()

  const raw = await git.raw(
    "branch",
    "--all",
    "--format=%(refname:short)|%(committerdate:iso)",
  )
  const dates = new Map<string, Date>()
  for (const line of raw.split(/\n+/g)) {
    const [refname, dateStr] = line.split("|")
    if (refname && dateStr) {
      dates.set(refname, new Date(dateStr))
    }
  }

  // function printFoundBranch(name: string, highlit?: string) {
  //   console.log(highlit || name, dates.get(name))
  // }

  const branchSummary = await git.branch([
    "--all",
    "--sort=-committerdate",
    // '--format="%(refname) %(committerdate)"',
  ])
  // const branches = await git.branchLocal()
  // const branches = await git.branch([
  //   "--all",
  //   "--sort=-committerdate",
  //   "--format=%(refname:short) %(committerdate:short)",
  // ])
  // console.log(branches)

  type SearchResult = {
    name: string
    highlit?: string
    branchInfo?: BranchSummaryBranch
  }

  function printSearchResults(searchResults: SearchResult[]) {
    for (const { name, highlit, branchInfo } of searchResults) {
      const date = dates.get(name)
      console.log(
        `${date ? kleur.dim(`${getHumanAge(date)} ago`) : kleur.italic("no date")}`.padEnd(
          20,
          " ",
        ),
        highlit || name,
        branchInfo?.current
          ? kleur.bold().green("   (Your current branch)")
          : "",
      )
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
      })
    } else {
      searchResults.push({ name: branch, branchInfo })
    }
    countFound++
  }
  if (!countFound) {
    warn("Found nothing")
  } else {
    printSearchResults(searchResults)
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
