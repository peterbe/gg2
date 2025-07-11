import type { SimpleGit } from "simple-git"

export async function getDefaultBranch(git: SimpleGit) {
  const branches = await git.branch(["-r"])
  const defaultBranch = branches.all
    .find((branch) => branch.includes("origin/HEAD -> origin/"))
    ?.split("origin/HEAD -> origin/")[1]

  return defaultBranch || "main"
}
