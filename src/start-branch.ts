import simpleGit from "simple-git"
import { input } from "@inquirer/prompts"
import { slugifyTitleToBranchName } from "./slugify"
import { success } from "./logger"

type Options = {}
export async function startBranch(url: string | undefined, options: Options) {
	const title = await getTitle(url)
	const branchName = slugifyTitleToBranchName(title)
	const git = simpleGit()
	await git.checkoutLocalBranch(branchName)
	success(`Created new branch: ${branchName}`)
	await storeTitle(branchName, title)
}

async function getTitle(url: string | undefined): Promise<string> {
	if (url) {
		throw new Error("Not implemented yet: parsing the URL to get the title")
	}
	const title = await input({ message: "Title:" })
	return title
}
