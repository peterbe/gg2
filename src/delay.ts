import yoctoSpinner from "yocto-spinner"

export async function delay(ms: number, text: string) {
  const spinner = yoctoSpinner({ text }).start()
  await sleep(ms)
  spinner.stop()
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
