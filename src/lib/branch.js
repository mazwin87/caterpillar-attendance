// Strips the shared brand prefix from a branch name so only the location remains,
// e.g. "Caterpillar Playtime KL Traders" -> "KL Traders".
// Handles both the "Caterpillar Playtime " and legacy "Caterpillar_" naming variants
// seen across the existing data.
export function cleanBranchName(name) {
  if (!name) return name
  return name.replace(/^Caterpillar(?:\s+Playtime)?[\s_]+/i, '')
}
