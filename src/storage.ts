import { homedir } from "node:os"
import { sep } from "node:path"

import simpleGit from "simple-git"
import { warn } from "./logger"

const db = Bun.file(expandPath("~/.gg.json"))

export async function storeTitle(
  branchName: string,
  title: string,
): Promise<void> {
  const [data, repoData] = await getRepoData()
  repoData.BRANCH_TITLES[branchName] = title
  await db.write(JSON.stringify(data, null, 2))
}

// type ReposStorage = {
//   [key: string]: string
// }

type ConfigKeys =
  | "branch-prefix"
  | "title-prefix"
  | "upstream-name"
  | "offer-auto-merge" // more to come!

type GlobalConfigKeys = "github-token" // more to come

type BranchTitles = Record<string, string>
type ConfigValues = Record<string, string | boolean>

type RepoData = {
  BRANCH_TITLES: BranchTitles
  CONFIG: ConfigValues
}
type StorageObject = {
  REPOS: {
    [repo: string]: RepoData
  }
  GLOBAL_CONFIG: ConfigValues
}

async function getData(): Promise<StorageObject> {
  const defaultData: StorageObject = {
    REPOS: {},
    GLOBAL_CONFIG: {},
  }
  const data = (await db.exists())
    ? (JSON.parse(await db.text()) as StorageObject)
    : defaultData

  return data
}

async function getRepoKey() {
  const git = simpleGit()
  if (!(await git.checkIsRepo())) {
    throw new Error("Not a git repository")
  }
  return await git.revparse(["--show-toplevel"])
}

export async function getTitle(
  branchName: string,
): Promise<string | undefined> {
  const [, repoData] = await getRepoData()
  return repoData.BRANCH_TITLES[branchName]
}

function expandPath(path: string): string {
  const split = path.split(sep)
  return split
    .map((part) => {
      if (part === "~") {
        return homedir()
      }
      return part
    })
    .join(sep)
}

export async function storeConfig(key: ConfigKeys, value: string | boolean) {
  const [data, repoData] = await getRepoData()
  repoData.CONFIG[key] = value
  await db.write(JSON.stringify(data, null, 2))
}

export async function getRepoConfig(): Promise<ConfigValues> {
  const [, repoData] = await getRepoData()
  return repoData.CONFIG
}

async function getRepoData(): Promise<[StorageObject, RepoData]> {
  const data = await getData()
  const repoKey = await getRepoKey()
  if (!data.REPOS[repoKey]) {
    data.REPOS[repoKey] = {
      BRANCH_TITLES: {},
      CONFIG: {},
    }
  }
  return [data, data.REPOS[repoKey]]
}

export async function getGlobalConfig(): Promise<ConfigValues> {
  const data = await getData()
  return data.GLOBAL_CONFIG
}

export async function storeGlobalConfig(key: GlobalConfigKeys, value: string) {
  const data = await getData()
  data.GLOBAL_CONFIG[key] = value
  await db.write(JSON.stringify(data, null, 2))
}

export async function getUpstreamName(): Promise<string> {
  const config = await getRepoConfig()

  let upstreamName = config["upstream-name"]
  if (!upstreamName) {
    warn(
      "No upstream name configured, defaulting to 'origin' (run 'gg configure' to set it)",
    )
    upstreamName = "origin"
  }

  return upstreamName as string
}
