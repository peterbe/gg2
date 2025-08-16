/**
 * As a tip for development/debugging, to test this outside of bash/zsh
 * you can simulate what the bash/zsh script does by using this notation,
 * for example:
 *
 *  gg shell-completion --list "gg\ncommit\n"
 *
 */

import type { Command } from "commander"

// @ts-ignore - a trick to make a non TS file part of memory and build
import code from "./completion.sh" with { type: "text" }

export async function shellCompletion() {
  console.log(code)
}

type Options = {
  search?: string
  program: Command
}

export async function printCompletions(options: Options) {
  const { program } = options
  // This search, if not undefined, will be a multi-line string always
  // starts with the word "gg". For example, if the user has typed
  // `gg [TAB]` what's sent here is that search === "gg\n".
  const words = (options.search || "").split(/\s+/)

  words.shift()

  if (words.length === 1) {
    const word = words[0]
    const names: string[] = []
    for (const command of program.commands) {
      if (command.name() === "shell-completion") continue
      names.push(command.name())
      for (const alias of command.aliases()) {
        names.push(alias)
      }
    }
    names.sort((a, b) => a.localeCompare(b))
    console.log(
      names
        .filter((name) => {
          if (word) return name.startsWith(word)
          return true
        })
        .join("\n"),
    )
  } else if (words.length === 2) {
    // E.g. "start -"
    const word = words[0]
    for (const command of program.commands) {
      if (command.name() === "shell-completion") {
        continue
      }
      if (word === command.name()) {
        const flags: string[] = []
        for (const option of command.arguments(word).options) {
          if (option.long) flags.push(option.long)
          if (option.short) flags.push(option.short)
        }

        const commands = command.commands.map((command) => command.name())

        console.log(
          [...commands, ...flags]
            .filter((flag) => {
              if (words[1]) {
                return flag.startsWith(words[1])
              }
              return true
            })
            .join("\n"),
        )
      }
    }
  } else if (words.length === 3) {
    // E.g. "gg github pr "
    const word = words[0]
    const subword = words[1]
    for (const command of program.commands) {
      if (word === command.name()) {
        for (const subcommand of command.commands) {
          if (subcommand.name() === subword) {
            const flags: string[] = []
            for (const option of subcommand.arguments(word).options) {
              if (option.long) flags.push(option.long)
              if (option.short) flags.push(option.short)
            }

            const commands = subcommand.commands.map((command) =>
              command.name(),
            )
            console.log(
              [...commands, ...flags]
                .filter((flag) => {
                  if (words[2]) {
                    return flag.startsWith(words[2])
                  }
                  return true
                })
                .join("\n"),
            )
          }
        }
      }
    }
  } else {
    // Currently not supported.
  }
}
