import kleur from "kleur"

import { getRepoConfig } from "./storage"

export async function repoConfig() {
  const config = await getRepoConfig()

  const longestKey = Math.max(...Object.keys(config).map((key) => key.length))
  const padding = Math.max(30, longestKey) + 1
  console.log(kleur.bold("KEY".padEnd(padding, " ")), kleur.italic("VALUE")) //, italic(value));
  for (const [key, value] of Object.entries(config)) {
    console.log(kleur.bold(`${key}:`.padEnd(padding, " ")), kleur.italic(value))
  }
}
