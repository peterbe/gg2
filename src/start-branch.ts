import { input } from "@inquirer/prompts"
import simpleGit from "simple-git"
import { success } from "./logger"
import { slugifyTitleToBranchName } from "./slugify"
import { getRepoConfig, storeTitle } from "./storage"

type Options = { [k: string]: never }

export async function startBranch(
  url: string[] | undefined,
  _options: Options,
) {
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

async function getTitle(urlOrTitle: string[] | undefined): Promise<string> {
  if (urlOrTitle && urlOrTitle.length > 0) {
    // If it looks like a URL, it's not implemented yet
    if (
      (urlOrTitle.length === 1 && URL.canParse(urlOrTitle[0] as string)) ||
      (urlOrTitle.length === 1 && isInt(urlOrTitle[0] as string))
    ) {
      throw new Error("Not implemented yet: parsing the URL to get the title")
    }
    return urlOrTitle.join(" ")
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

function isInt(value: string) {
  if (Number.isNaN(value)) {
    return false
  }
  var x = parseFloat(value)
  return (x | 0) === x
}
