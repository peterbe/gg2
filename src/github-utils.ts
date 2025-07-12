export function getGitHubNWO(url: string): string | undefined {
  // E.g. git@github.com:peterbe/admin-peterbecom.gi
  // or https://github.com/peterbe/admin-peterbecom.git"
  if (url.includes("github.com")) {
    if (URL.canParse(url)) {
      const parsed = new URL(url)
      return parsed.pathname.replace(/\.git$/, "").slice(1)
    }
    if (url.includes("git@github.com:")) {
      const second = url.split(":")[1]
      if (second) {
        return second.replace(/\.git$/, "")
      }
    } else {
      throw new Error(`Not implemented (${url})`)
    }
  }
  return url
}
