import kleur from "kleur"
import simpleGit from "simple-git"
import { warn } from "./logger"

export async function parentBranch() {
  const git = simpleGit()
  const branchSummary = await git.branch()
  const currentBranch = branchSummary.current

  const outputFromGit = (
    await simpleGit({ trimmed: true }).raw("show-branch", "-a")
  ).split("\n")
  const rev = await simpleGit({ trimmed: true }).raw(
    "rev-parse",
    "--abbrev-ref",
    "HEAD",
  )

  const parents = outputFromGit
    .map((line) => line.replace(/\].*/, "")) // remove branch commit message
    .filter((line) => line.includes("*")) // only lines with a star in them
    .filter((line) => !line.includes(rev)) // only lines not including the specified revision
    .filter((_line, index, all) => index < all.length - 1) // not the last line
    .map((line) => line.replace(/^.*\[/, "")) // remove all but the branch name

  if (parents.length >= 1 && parents[0]) {
    const parentBranch = parents[0]
    console.log(
      `Parent branch for ${currentBranch} is: ${kleur.bold(parentBranch)}`,
    )
  } else {
    warn("Unable to find any parents")
  }
}
