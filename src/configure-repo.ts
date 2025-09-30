// import { appendFileSync } from "node:fs"
import { userInfo } from "node:os"
import { basename } from "node:path"
import { confirm, input, select } from "@inquirer/prompts"
import kleur from "kleur"
import simpleGit from "simple-git"
import { warn } from "./logger"
import { getRepoConfig, storeConfig } from "./storage"

// const dbg = (s: string) => {
//   appendFileSync("/tmp/dbg.log", s)
//   appendFileSync("/tmp/dbg.log", "\n")
// }

// This exists just to make it possible to bypass the interactive prompt
// in end-to-end tests.
async function selectWrappedForTesting(
  config: Parameters<typeof select>[0],
): Promise<ReturnType<typeof select>> {
  // for (const [key, value] of Object.entries(Bun.env)) {
  //   dbg(`${key}=${value}`)
  // }
  if (Bun.env.NODE_ENV === "test" && Bun.env.TEST_CONFIGURE_ANSWER) {
    return Bun.env.TEST_CONFIGURE_ANSWER
  }
  return select(config)
}

export async function configureRepo() {
  const git = simpleGit()
  const rootPath = await git.revparse(["--show-toplevel"])
  const repoName = basename(rootPath)

  const answer = await selectWrappedForTesting({
    message: `What do you want to configure (for repo: ${repoName})`,
    choices: [
      {
        name: "Common branch prefix",
        value: "branch-prefix",
      },
      {
        name: "Common title prefix",
        value: "title-prefix",
      },
      {
        name: "Upstream name",
        value: "upstream-name",
      },
      {
        name: "Auto-merge PRs",
        value: "auto-merge",
      },

      //   {
      //     name: "yarn",
      //     value: "yarn",
      //     description: "yarn is an awesome package manager",
      //   },
      //   new Separator(),
      //   {
      //     name: "jspm",
      //     value: "jspm",
      //     disabled: true,
      //   },
      //   {
      //     name: "pnpm",
      //     value: "pnpm",
      //     disabled: "(pnpm is not available)",
      //   },
    ],
  })
  if (answer === "branch-prefix") {
    await configureBranchPrefix()
  } else if (answer === "title-prefix") {
    await configureTitlePrefix()
  } else if (answer === "upstream-name") {
    await configureUpstreamName()
  } else if (answer === "auto-merge") {
    await configureAutoMerge()
  } else {
    warn("No selected thing to configure. Bye")
  }
}

async function configureBranchPrefix() {
  const config = await getRepoConfig()
  const defaultPrefix =
    (config["branch-prefix"] as string) || `${userInfo().username}/`
  const value = await input({
    message: `Prefix:`,
    default: defaultPrefix,
    prefill: "tab",
  })
  await storeConfig("branch-prefix", value)
  console.log(
    `Old value: ${config["branch-prefix"] ? kleur.yellow(config["branch-prefix"] as string) : kleur.italic("nothing set")}`,
  )
  console.log(
    `New value: ${value ? kleur.green(value) : kleur.italic("empty")}`,
  )
}

async function configureTitlePrefix() {
  const config = await getRepoConfig()
  const defaultPrefix =
    (config["title-prefix"] as string) || `${userInfo().username}/`
  const value = await input({
    message: `Prefix:`,
    default: defaultPrefix,
    prefill: "tab",
  })
  await storeConfig("title-prefix", value)
  console.log(
    `Old value: ${config["title-prefix"] ? kleur.yellow(config["title-prefix"] as string) : kleur.italic("nothing set")}`,
  )
  console.log(
    `New value: ${value ? kleur.green(value) : kleur.italic("empty")}`,
  )
}

async function configureUpstreamName() {
  const KEY = "upstream-name"
  const config = await getRepoConfig()
  const defaultName = (config[KEY] as string) || "origin"
  const value = await input({
    message: `Name:`,
    default: defaultName,
    prefill: "tab",
  })
  await storeConfig(KEY, value)
  console.log(
    `Old value: ${config[KEY] ? kleur.yellow(config[KEY] as string) : kleur.italic("nothing set")}`,
  )
  console.log(
    `New value: ${value ? kleur.green(value) : kleur.italic("empty")}`,
  )
}

async function configureAutoMerge() {
  const KEY = "offer-auto-merge"
  const config = await getRepoConfig()
  const value = await confirm({
    message: `Suggest Auto-merge on PRs:`,
    default: config[KEY] === undefined ? true : Boolean(config[KEY]),
  })
  await storeConfig(KEY, value)
  if (value !== config[KEY]) {
    console.log(
      `Old value: ${config[KEY] === undefined ? kleur.italic("not set") : kleur.bold(JSON.stringify(config[KEY]))}`,
    )
    console.log(
      `New value: ${value ? kleur.green("true") : kleur.red("false")}`,
    )
  }
}
