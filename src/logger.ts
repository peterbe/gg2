import kleur from "kleur"

export function success(...args: string[]) {
  console.log(...args.map((arg) => kleur.green(arg)))
}
export function error(...args: string[]) {
  console.error(...args.map((arg) => kleur.red(arg)))
}

export function warn(...args: string[]) {
  console.warn(...args.map((arg) => kleur.yellow(arg)))
}
