import { input } from "@inquirer/prompts"
import simpleGit from "simple-git"
import { success } from "./logger"
import { slugifyTitleToBranchName } from "./slugify"
import { getRepoConfig, storeTitle } from "./storage"

// type Options = {}
type Options = { [k: string]: never }

export async function startBranch(url: string | undefined, _options: Options) {
  const title = await getTitle(url)
  let branchName = slugifyTitleToBranchName(title)
  const config = await getRepoConfig()
  if (
    config["branch-prefix"] &&
    !branchName.startsWith(config["branch-prefix"])
  ) {
    branchName = `${config["branch-prefix"]}${branchName}`
  }

  const git = simpleGit()
  await git.checkoutLocalBranch(branchName)
  success(`Created new branch: ${branchName}`)
  await storeTitle(branchName, title)
}

async function getTitle(url: string | undefined): Promise<string> {
  if (url) {
    throw new Error("Not implemented yet: parsing the URL to get the title")
  }
  const config = await getRepoConfig()
  const titlePrefix = config["title-prefix"]
  const title = await input({
    message: "Title:",
    default: titlePrefix ? titlePrefix : undefined,
    prefill: "editable",
  })
  return title
}
