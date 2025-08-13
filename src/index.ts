import { Command } from "commander"

import { version } from "../package.json"
import { commitBranch } from "./commit-branch"
import { configureRepo } from "./configure-repo"
import { createPR } from "./create-pr"
import { findBranches } from "./find-branches"
import { getBack } from "./get-back"
import { gitHubPR, gitHubToken } from "./github"
import { error } from "./logger"
import { mainMerge } from "./main-merge"
import { originPush } from "./origin-push"
import { repoConfig } from "./repo-config"
import { printCompletions, shellCompletion } from "./shell-completion"
import { startBranch } from "./start-branch"

const program = new Command()

program
  .name("gg")
  .description("CLI to make it easier to manage git branches")
  .version(version)

program
  .command("shell-completion")
  .argument("[search]", "Search input")
  .option("--list", "List all options")
  .description(
    "Prints the Bash and Zsh completion code that your shell can eval",
  )
  .action((search, options) => {
    if (options.list) {
      wrap(printCompletions({ search, program }), options.debug)
    } else {
      wrap(shellCompletion(), options.debug)
    }
  })

program
  .command("start")
  .description("Create a new branch")
  .option("--debug", "Debug mode (shows traceback)")
  .argument(
    "[url-or-title...]",
    "GitHub or Jira ticket URL or just the title directly",
  )
  .action((urlOrTitle, options) => {
    wrap(startBranch(urlOrTitle, options), options.debug)
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

program
  .command("push")
  .description("Push the current branch to the remote")
  .option("--debug", "Debug mode (shows traceback)")
  .action((options) => {
    wrap(originPush(), options.debug)
  })

program // alias for `github pr`
  .command("pr")
  .description("Get the current GitHub Pull Request for the current branch")
  .option("--watch", "Keep checking the status till it changes")
  .action((options) => {
    wrap(gitHubPR(options), options.debug)
  })

program
  .command("mainmerge")
  .alias("mastermerge")
  .description(
    "Merge the origin_name/default_branch into the the current branch",
  )
  .action((options) => {
    wrap(mainMerge(), options.debug)
  })

program
  .command("branch")
  .alias("branches")
  .description("Find and check out a branch by name")
  .argument("[search]", "Search input (can be fuzzy)")
  .option("-n, --number <number>", "Max number of branches to show", "20")
  .option(
    "--cleanup",
    "Interactively ask about deleting found and *merged* branches",
  )
  .option("--reverse", "Reverse sort order")
  .action((search, options) => {
    wrap(findBranches(search, options), options.debug)
  })

const gitHubCommand = program
  .command("github")
  .description("Configure your connection to GitHub")

gitHubCommand
  .command("token")
  .argument("[token]", "token")
  .description("Set your personal access token to GitHub")
  .option("--test", "Test if the existing token works")
  .option(
    "--test-prs",
    "Test if you can read pull requests in the current repo",
  )
  .action((token, options) => {
    wrap(gitHubToken(token, options), options.debug)
  })

gitHubCommand
  .command("pr")
  .description("Get the current GitHub Pull Request for the current branch")
  .option("--watch", "Keep checking the status till it changes")
  .action((options) => {
    wrap(gitHubPR(options), options.debug)
  })

gitHubCommand
  .command("create")
  .description("Turn the current branch into a GitHub Pull Request")
  .option("-e, --enable-auto-merge", "Keep checking the status till it changes")
  .action((options) => {
    wrap(createPR(options), options.debug)
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
