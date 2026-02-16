/**
 * Template Hub service – fetches templates from the
 * LHR-CopilotTemplateHub GitHub repository.
 *
 * Used by the import dialog to let users browse & import
 * community templates without needing an API token (public repo).
 */

const OWNER = 'Lesterhr';
const REPO = 'LHR-CopilotTemplateHub';
const BRANCH = 'main';

interface HubEntry {
  name: string;
  path: string;
  sha: string;
  downloadUrl: string;
}

/**
 * List all `.instructions.md` files in the template hub repo via
 * the GitHub Contents API (unauthenticated – 60 req/h rate limit).
 */
export async function listHubTemplates(): Promise<HubEntry[]> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents?ref=${BRANCH}`,
    { headers: { Accept: 'application/vnd.github.v3+json' } },
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const items = (await res.json()) as Array<{ name: string; path: string; sha: string; download_url: string; type: string }>;

  return items
    .filter((i) => i.type === 'file' && i.name.endsWith('.instructions.md'))
    .map((i) => ({
      name: i.name,
      path: i.path,
      sha: i.sha,
      downloadUrl: i.download_url,
    }));
}

/**
 * Download the raw content of a hub template file.
 */
export async function downloadHubTemplate(entry: HubEntry): Promise<string> {
  const res = await fetch(entry.downloadUrl);
  if (!res.ok) throw new Error(`Failed to download ${entry.name}`);
  return res.text();
}

/**
 * Fetch the optional manifest.json for extra metadata.
 */
export async function fetchManifest(): Promise<Record<string, { description?: string; version?: string }> | null> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/manifest.json`,
    );
    if (!res.ok) return null;
    return (await res.json()) as Record<string, { description?: string; version?: string }>;
  } catch {
    return null;
  }
}
