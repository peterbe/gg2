import { Command } from "commander"

import { version } from "../package.json"
import { commitBranch } from "./commit-branch"
import { configureRepo } from "./configure-repo"
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
