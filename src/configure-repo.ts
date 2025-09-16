import { userInfo } from "node:os"
import { basename } from "node:path"

import { confirm, input, select } from "@inquirer/prompts"
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
      {
        name: "Auto-merge PR method",
        value: "auto-merge-method",
      },
      {
        name: "Auto-merge PRs",
        value: "auto-merge",
      },
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
  } else if (answer === "auto-merge-method") {
    await configureAutoMergeMethod()
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

async function configureAutoMergeMethod() {
  const KEY = "auto-merge-method"
  const config = await getRepoConfig()

  const choices = [
    {
      name: "Merge",
      value: "MERGE",
    },
    {
      name: "Squash",
      value: "SQUASH",
    },
    {
      name: "Rebase",
      value: "REBASE",
    },
  ]
  const map = new Map(choices.map((c) => [c.value, c.name]))
  const answer = await select({
    message: "Auto-merge method",
    choices,
  })

  await storeConfig(KEY, answer)

  if (answer !== config[KEY]) {
    const before = config[KEY]
    const beforeName =
      before && typeof before === "string" ? map.get(before) : undefined
    if (beforeName) {
      console.log(
        `Old value: ${before === undefined ? kleur.italic("not set") : kleur.bold(beforeName)}`,
      )
    }
    const newName = map.get(answer) || answer
    console.log(`New value: ${kleur.green(newName)}`)
  }
}
