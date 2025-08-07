import { userInfo } from "node:os"
import { basename } from "node:path"

import { input, select } from "@inquirer/prompts"
import kleur from "kleur"
import simpleGit from "simple-git"
import { warn } from "./logger"
import { getRepoConfig, storeConfig } from "./storage"

export async function configureRepo() {
  const git = simpleGit()
  const rootPath = await git.revparse(["--show-toplevel"])
  const repoName = basename(rootPath)

  const answer = await select({
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
  } else {
    warn("No selected thing to configure. Bye")
  }
}

async function configureBranchPrefix() {
  const config = await getRepoConfig()
  const defaultPrefix = config["branch-prefix"] || `${userInfo().username}/`
  const value = await input({
    message: `Prefix:`,
    default: defaultPrefix,
    prefill: "tab",
  })
  await storeConfig("branch-prefix", value)
  console.log(
    `Old value: ${config["branch-prefix"] ? kleur.yellow(config["branch-prefix"]) : kleur.italic("nothing set")}`,
  )
  console.log(
    `New value: ${value ? kleur.green(value) : kleur.italic("empty")}`,
  )
}

async function configureTitlePrefix() {
  const config = await getRepoConfig()
  const defaultPrefix = config["title-prefix"] || `${userInfo().username}/`
  const value = await input({
    message: `Prefix:`,
    default: defaultPrefix,
    prefill: "tab",
  })
  await storeConfig("title-prefix", value)
  console.log(
    `Old value: ${config["title-prefix"] ? kleur.yellow(config["title-prefix"]) : kleur.italic("nothing set")}`,
  )
  console.log(
    `New value: ${value ? kleur.green(value) : kleur.italic("empty")}`,
  )
}

async function configureUpstreamName() {
  const KEY = "upstream-name"
  const config = await getRepoConfig()
  const defaultName = config[KEY] || "origin"
  const value = await input({
    message: `Name:`,
    default: defaultName,
    prefill: "tab",
  })
  await storeConfig(KEY, value)
  console.log(
    `Old value: ${config[KEY] ? kleur.yellow(config[KEY]) : kleur.italic("nothing set")}`,
  )
  console.log(
    `New value: ${value ? kleur.green(value) : kleur.italic("empty")}`,
  )
}
