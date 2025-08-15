import simpleGit from "simple-git"

export async function parentBranch() {
  const git = simpleGit()
  const branchSummary = await git.branch()
  const _currentBranch = branchSummary.current

  const outputFromGit = (
    await simpleGit({ trimmed: true }).raw("show-branch", "-a")
  ).split("\n")
  const rev = await simpleGit({ trimmed: true }).raw(
    "rev-parse",
    "--abbrev-ref",
    "HEAD",
  )

  console.log(
    outputFromGit
      .map((line) => line.replace(/\].*/, "")) // remove branch commit message
      .filter((line) => line.includes("*")) // only lines with a star in them
      .filter((line) => !line.includes(rev)) // only lines not including the specified revision
      .filter((_line, index, all) => index < all.length - 1) // not the last line
      .map((line) => line.replace(/^.*\[/, "")), // remove all but the branch name
  )
  //   const outputFromGit = (
  //     await simpleGit({ trimmed: true }).raw("show-branch", "-a")
  //   ).split("\n")
  //   const rev = await simpleGit({ trimmed: true }).raw(
  //     "rev-parse",
  //     "--abbrev-ref",
  //     "HEAD",
  //   )
  //   const allLinesNormalized = outputFromGit.map((line) =>
  //     line.trim().replace(/\].*/, ""),
  //   )
  //   const indexOfCurrentBranch = allLinesNormalized.indexOf(`* [${rev}`)
  //   if (indexOfCurrentBranch > -1) {
  //     const parentBranch = allLinesNormalized[indexOfCurrentBranch + 1].replace(
  //       /^.*\[/,
  //       "",
  //     )
  // console.log(
  //   `Parent branch for ${currentBranch} is: ${kleur.bold(parentBranch)}`,
  // )
  //   }
}
