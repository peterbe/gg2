import kleur from "kleur"

export function success(...args: string[]) {
  // console.log("\x1b[32m%s\x1b[0m", ...args);
  console.log(...args.map((arg) => kleur.green(arg)))
}
export function error(...args: string[]) {
  // console.error("\x1b[31m%s\x1b[0m", ...args);
  console.error(...args.map((arg) => kleur.red(arg)))
}

export function warn(...args: string[]) {
  console.warn(...args.map((arg) => kleur.yellow(arg)))
  // console.warn("\x1b[33m%s\x1b[0m", ...args);
}

export function bold(...args: string[]) {
  console.log(...args.map((arg) => kleur.bold(arg)))
}
