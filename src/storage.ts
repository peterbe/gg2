import { homedir } from "node:os"
import { sep } from "node:path"

import simpleGit from "simple-git"

const db = Bun.file(expandPath("~/.gg.json"))

export async function storeTitle(
  branchName: string,
  title: string,
): Promise<void> {
  // const git = simpleGit();
  // if (!(await git.checkIsRepo())) {
  //   throw new Error("Not a git repository");
  // }
  // const data = await getData();
  // const rootPath = await git.revparse(["--show-toplevel"]);
  // if (!data.REPOS[rootPath]) {
  //   data.REPOS[rootPath] = {};
  // }

  // data.REPOS[rootPath][branchName] = title;
  const [data, repoData] = await getRepoData()
  repoData.BRANCH_TITLES[branchName] = title
  await db.write(JSON.stringify(data, null, 2))
}

type ReposStorage = {
  [key: string]: string
}

type BranchTitles = Record<string, string>
type ConfigValues = Record<string, string>

type RepoData = {
  BRANCH_TITLES: BranchTitles
  CONFIG: ConfigValues
}
type StorageObject = {
  REPOS: {
    [repo: string]: RepoData
  }
  GLOBAL_CONFIG: ReposStorage
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

// async function getRepoData(root: string) {
//   const git = simpleGit();
//   if (!(await git.checkIsRepo())) {
//     throw new Error("Not a git repository");
//   }
//   const data = await getData();
//   const rootPath = await git.revparse(["--show-toplevel"]);

//   // if (!data.REPOS[rootPath]) {
//   //   data.REPOS[rootPath] = {};
//   // }
//   // return data.REPOS[rootPath];
// }
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

type ConfigKeys = "branch-prefix" | "title-prefix" // more to come!

export async function storeConfig(key: ConfigKeys, value: string) {
  // const data = await getData();
  // const repoKey = await getRepoKey();
  // if (!data.REPOS[repoKey]) {
  //   data.REPOS[repoKey] = {
  //     BRANCH_TITLES: {},
  //     CONFIG: {},
  //   };
  // }
  // const repoData = data.REPOS[repoKey];
  const [data, repoData] = await getRepoData()
  repoData.CONFIG[key] = value
  await db.write(JSON.stringify(data, null, 2))
}

export async function getRepoConfig(): Promise<ConfigValues> {
  // const data = await getData();
  // const repoKey = await getRepoKey();
  // if (!data.REPOS[repoKey]) {
  //   data.REPOS[repoKey] = {
  //     BRANCH_TITLES: {},
  //     CONFIG: {},
  //   };
  // }
  // return data.REPOS[repoKey].CONFIG;
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
