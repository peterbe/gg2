import { confirm } from "@inquirer/prompts"
import kleur from "kleur"
import simpleGit from "simple-git"
import { success, warn } from "./logger"

type Options = {
  yes?: boolean
}

export async function parentBranch(options: Options) {
  const yes = Boolean(options.yes)
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

  // Got this from https://github.com/steveukx/git-js/issues/955#issuecomment-1817787639
  const parents = outputFromGit
    .map((line) => line.replace(/\].*/, "")) // remove branch commit message
    .filter((line) => line.includes("*")) // only lines with a star in them
    .filter((line) => !line.includes(rev)) // only lines not including the specified revision
    .filter((_line, index, all) => index < all.length - 1) // not the last line
    .map((line) => line.replace(/^.*\[/, "")) // remove all but the branch name

  if (parents.length >= 1 && parents[0]) {
    const parentBranch = parents[0]
    console.log(
      `Parent branch for ${currentBranch} is: ${kleur.bold().green(parentBranch)}`,
    )
    console.log("")
    console.log(
      kleur.italic(
        "To update the current branch, my merging in this parent branch, use: gg updatebranch",
      ),
    )
    console.log("")

    const checkOut =
      yes ||
      (await confirm({
        message: `Check out (${parentBranch}):`,
        default: true,
      }))
    const status = await git.status()
    if (!status.isClean()) {
      throw new Error(
        "Current branch is not in a clean state. Run `git status`",
      )
    }

    if (checkOut) {
      await git.checkout(parentBranch)
      success(`Checked out branch ${kleur.bold(parentBranch)}`)
    }
  } else {
    warn("Unable to find any parents")
  }
}
