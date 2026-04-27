// Glob match: * matches a single path segment, ** matches multiple.
export function matchGlob(pattern: string, path: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§§")
    .replace(/\*/g, "[^/]*")
    .replace(/§§/g, ".*")
  return new RegExp(`^${escaped}$`).test(path)
}
