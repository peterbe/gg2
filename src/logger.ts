export function success(...args: string[]) {
	console.log("\x1b[32m%s\x1b[0m", ...args)
}
export function error(...args: string[]) {
	console.error("\x1b[31m%s\x1b[0m", ...args)
}
