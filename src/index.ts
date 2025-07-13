import { Command } from "commander"

import { version } from "../package.json"
import { commitBranch } from "./commit-branch"
import { configureRepo } from "./configure-repo"
import { getBack } from "./get-back"
import { gitHubPR, gitHubToken } from "./github"
import { error } from "./logger"
import { repoConfig } from "./repo-config"
import { startBranch } from "./start-branch"

const program = new Command()

program
  .name("gg")
  .description("CLI to make it easier to manage git branches")
  //   .option("--debug", "Debug mode")
  .version(version)

program
  .command("start")
  .description("Create a new branch")
  .option("--debug", "Debug mode (shows traceback)")
  .argument("[url]", "GitHub or Jira ticket URL")
  .action((url, options) => {
    if (url) {
      throw new Error("Not implemented yet.")
    }
    // if (url) {
    //     if (!URL.canParse(url)) {
    //         console.error("Invalid URL provided.");
    //         process.exit(1);
    //     }
    // }
    wrap(startBranch(url, options), options.debug)
  })

program
  .command("commit")
  .description("Commit and push changes")
  .option("--debug", "Debug mode (shows traceback)")
  .option("--no-verify", "No git hook verify")
  .option("-y, --yes", "Push")
  .action((options) => {
    wrap(commitBranch(options), options.debug)
  })

program
  .command("configure")
  .description("Configure preferences for this repo")
  .option("--debug", "Debug mode (shows traceback)")
  // .option("-y, --yes", "Push")
  .action((options) => {
    wrap(configureRepo(), options.debug)
  })

program
  .command("config")
  .description("Prints the current repo config")
  .option("--debug", "Debug mode (shows traceback)")
  .action((options) => {
    wrap(repoConfig(), options.debug)
  })

program
  .command("getback")
  .description("Go back to the default branch and delete this one")
  .option("--debug", "Debug mode (shows traceback)")
  .option("-y, --yes", "Push")
  .action((options) => {
    wrap(getBack(options), options.debug)
  })

program // alias for `github pr`
  .command("pr")
  .description("Get the current GitHub Pull Request for the current branch")
  .action((options) => {
    wrap(gitHubPR(), options.debug)
  })

const gitHubCommand = program
  .command("github")
  .description("Configure your connection to GitHub")

gitHubCommand
  .command("token")
  .argument("[token]", "token")
  .description("Set your personal access token to GitHub")
  .option("--test", "Test if the existing token works")
  .action((token, options) => {
    wrap(gitHubToken(token, options), options.debug)
  })

gitHubCommand
  .command("pr")
  .description("Get the current GitHub Pull Request for the current branch")
  .action((options) => {
    wrap(gitHubPR(), options.debug)
  })

program.parse()

function wrap(promise: Promise<void>, debug: boolean) {
  promise
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      if (err instanceof Error && err.name === "ExitPromptError") {
        // Ctrl-C
        process.exit(0)
      }

      if (debug) {
        throw err
      }
      error(err.message)
      process.exit(1)
    })
}
