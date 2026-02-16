/**
 * GitHub Repo service – create repositories via the GitHub REST API.
 * Replaces the old PyGithub-based flow from the Flet app.
 */

export interface RepoCreateOptions {
  name: string;
  description?: string;
  isPrivate: boolean;
  autoInit?: boolean;       // create initial commit with README
  gitignoreTemplate?: string; // e.g. "Python", "Node"
  language?: string;
}

export interface CreatedRepo {
  fullName: string; // "owner/repo"
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
}

const API = 'https://api.github.com';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

/** Validate that the token grants repo access */
export async function validateToken(token: string): Promise<string> {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error('Invalid GitHub token');
  const data = (await res.json()) as { login: string };
  return data.login;
}

/** Create a new GitHub repository */
export async function createRepo(token: string, opts: RepoCreateOptions): Promise<CreatedRepo> {
  const body = {
    name: opts.name,
    description: opts.description ?? '',
    private: opts.isPrivate,
    auto_init: opts.autoInit ?? true,
    gitignore_template: opts.gitignoreTemplate ?? undefined,
  };

  const res = await fetch(`${API}/user/repos`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `GitHub API ${res.status}`);
  }

  const data = (await res.json()) as {
    full_name: string;
    html_url: string;
    clone_url: string;
    ssh_url: string;
  };

  return {
    fullName: data.full_name,
    htmlUrl: data.html_url,
    cloneUrl: data.clone_url,
    sshUrl: data.ssh_url,
  };
}

/** Fetch available .gitignore templates from GitHub */
export async function listGitignoreTemplates(token: string): Promise<string[]> {
  const res = await fetch(`${API}/gitignore/templates`, { headers: headers(token) });
  if (!res.ok) return ['Python', 'Node', 'VisualStudio'];
  return (await res.json()) as string[];
}
