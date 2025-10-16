import { confirm } from "@inquirer/prompts"
import simpleGit, { type SimpleGit } from "simple-git"
import { getCurrentBranch, getDefaultBranch } from "./branch-utils"
import { success, warn } from "./logger"
import { getBaseBranch, getUpstreamName } from "./storage"

type Options = {
  yes?: boolean
}
export async function getBack(options: Options) {
  const yes = Boolean(options.yes)
  const git = simpleGit()
  const currentBranch = await getCurrentBranch(git)

  const defaultBranch = await getDefaultBranch(git)
  if (defaultBranch === currentBranch) {
    throw new Error(`You are on the default branch (${defaultBranch}) already.`)
  }

  const status = await git.status()
  if (!status.isClean()) {
    throw new Error("Current branch is not in a clean state. Run `git status`")
  }
  const storedBaseBranch = await getBaseBranch(currentBranch)

  await git.checkout(storedBaseBranch || defaultBranch)

  const upstreamName = await getUpstreamName()

  const remotes = await git.getRemotes(true)
  const origin = remotes.find((remote) => remote.name === upstreamName)
  if (origin) {
    await git.pull(origin.name, defaultBranch)
  } else {
    await git.pull()
  }

  await deleteLocalBranch({ git, currentBranch, defaultBranch, yes })
}

export async function deleteLocalBranch({
  git,
  defaultBranch,
  currentBranch,
  yes,
}: {
  git: SimpleGit
  defaultBranch: string
  currentBranch: string
  yes: boolean
}) {
  try {
    await git.deleteLocalBranch(currentBranch)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "If you are sure you want to delete it, run 'git branch -D",
      )
    ) {
      if (!yes) {
        warn(`Doesn't look fully merged into ${defaultBranch} yet.`)
      }
      const sure =
        yes ||
        (await confirm({
          message: `Are you sure you want to delete '${currentBranch}'?`,
          default: true,
        }))
      if (sure) {
        await git.deleteLocalBranch(currentBranch, true)
        success(`Deleted branch '${currentBranch}'`)
      } else {
        warn(`Did not delete branch '${currentBranch}'`)
      }
    } else {
      throw error
    }
  }
}
