import { Command } from "commander"
import { startBranch } from "./start-branch"
import { version } from "../package.json"
import { error } from "./logger"

const program = new Command()

program
	.name("gg")
	.description("CLI to make it easier to manage branches")
	.version(version)

program
	.command("start")
	.description("Create a new branch")
	.argument("[url]", "GitHub or Jira ticket URL")
	.action((url, options) => {
		// if (url) {
		//     if (!URL.canParse(url)) {
		//         console.error("Invalid URL provided.");
		//         process.exit(1);
		//     }
		// }
		startBranch(url, options)
	})

program
	.command("commit")
	.description("Commit and push changes")
	.option("-y, --yes", "Push")
	.action((options) => {
		error("Not implemented yet: commit command")
		process.exit(1)
		// if (url) {
		//     if (!URL.canParse(url)) {
		//         console.error("Invalid URL provided.");
		//         process.exit(1);
		//     }
		// }
		// startBranch(url, options)
	})

program.parse()
