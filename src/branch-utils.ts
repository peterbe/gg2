import type { SimpleGit } from "simple-git"

export async function getDefaultBranch(git: SimpleGit) {
  const result = await git.raw(["symbolic-ref", "refs/remotes/origin/HEAD"])
  if (result) {
    const defaultBranch = result.trim().replace("refs/remotes/origin/", "")
    if (defaultBranch) {
      return defaultBranch
    }
  }

  const branches = await git.branch(["-r"])
  const defaultBranch = branches.all
    .find((branch) => branch.includes("origin/HEAD -> origin/"))
    ?.split("origin/HEAD -> origin/")[1]

  return defaultBranch || "main"
}
