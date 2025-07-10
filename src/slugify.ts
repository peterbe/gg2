export function slugifyTitleToBranchName(title: string): string {
  let slug = title.toLowerCase()

  // Replace spaces and special characters with hyphens
  slug = slug.replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
  // Remove non-alphanumeric characters except hyphens and slashes
  slug = slug.replace(/[^a-z0-9-/]/g, "")

  // Trim leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, "")

  return slug
}
