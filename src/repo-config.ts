import kleur from "kleur"

import { getRepoConfig } from "./storage"

export async function repoConfig() {
  const config = await getRepoConfig()

  const longestKey = Math.max(...Object.keys(config).map((key) => key.length))
  const padding = Math.max(30, longestKey) + 1
  if (Object.keys(config).length === 0) {
    console.log(kleur.italic("No configuration found for this repo"))
  } else {
    const header = `${kleur.bold("KEY".padEnd(padding, " "))} ${kleur.bold("VALUE")}`
    console.log(header)
    console.log(
      kleur.dim("-".repeat("KEY".length + padding + "VALUE".length + 5)),
    )
    for (const [key, value] of Object.entries(config)) {
      console.log(
        kleur.bold(`${key}:`.padEnd(padding, " ")),
        formatValue(value),
      )
    }
  }
}

function formatValue(value: string | boolean): string {
  if (typeof value === "boolean") {
    return value ? kleur.green("true") : kleur.red("false")
  }
  return kleur.italic(JSON.stringify(value))
}
