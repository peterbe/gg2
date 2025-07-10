export function getHumanAge(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  // Handle future dates
  if (diffMs < 0) {
    return "in the future"
  }

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30.44) // Average days per month
  const years = Math.floor(days / 365.25) // Account for leap years

  if (years > 0) {
    return `${years} year${years === 1 ? "" : "s"}`
  }

  if (months > 0) {
    return `${months} month${months === 1 ? "" : "s"}`
  }

  if (weeks > 0) {
    return `${weeks} week${weeks === 1 ? "" : "s"}`
  }

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}`
  }

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`
  }

  return `${seconds} second${seconds === 1 ? "" : "s"}`
}
