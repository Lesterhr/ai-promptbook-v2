/**
 * Git service – wraps Tauri shell commands that invoke the system `git` binary.
 *
 * Used for:
 *   • initialising a collection folder as a git repo
 *   • committing changes (auto-message)
 *   • push / pull to a configured GitHub remote
 */

import { Command } from '@tauri-apps/plugin-shell';

/** Run a git command inside the given directory */
async function git(cwd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  const cmd = Command.create('git', args, { cwd });
  const output = await cmd.execute();
  return {
    stdout: output.stdout,
    stderr: output.stderr,
    code: output.code ?? 0,
  };
}

/* ────────── Clone ────────── */

/** Clone a repo from GitHub into a target directory using token auth */
export async function cloneRepo(
  token: string,
  repoFullName: string,
  targetDir: string,
): Promise<void> {
  const url = `https://x-access-token:${token}@github.com/${repoFullName}.git`;
  // Clone into the parent dir with the repo name as subfolder
  const cmd = Command.create('git', ['clone', url, targetDir]);
  const output = await cmd.execute();
  if ((output.code ?? 0) !== 0) {
    throw new Error(output.stderr || 'git clone failed');
  }
}

/* ────────── Init ────────── */

export async function initRepo(dir: string): Promise<void> {
  await git(dir, ['init', '-b', 'main']);
}

export async function isGitRepo(dir: string): Promise<boolean> {
  const { code } = await git(dir, ['rev-parse', '--is-inside-work-tree']);
  return code === 0;
}

/* ────────── Commit ────────── */

export async function commitAll(dir: string, message?: string): Promise<void> {
  await git(dir, ['add', '-A']);
  const msg = message ?? `auto: ${new Date().toISOString()}`;
  await git(dir, ['commit', '-m', msg, '--allow-empty']);
}

/* ────────── Remote ────────── */

export async function setRemote(dir: string, token: string, repo: string): Promise<void> {
  const url = `https://x-access-token:${token}@github.com/${repo}.git`;
  // remove then re-add to ensure idempotency
  await git(dir, ['remote', 'remove', 'origin']).catch(() => {});
  await git(dir, ['remote', 'add', 'origin', url]);
}

export async function push(dir: string): Promise<string> {
  const { stdout, stderr, code } = await git(dir, ['push', '-u', 'origin', 'main']);
  if (code !== 0) throw new Error(stderr || 'git push failed');
  return stdout;
}

export async function pull(dir: string): Promise<string> {
  const { stdout, stderr, code } = await git(dir, ['pull', 'origin', 'main', '--rebase']);
  if (code !== 0) throw new Error(stderr || 'git pull failed');
  return stdout;
}

/* ────────── Status ────────── */

export async function hasUncommitted(dir: string): Promise<boolean> {
  const { stdout } = await git(dir, ['status', '--porcelain']);
  return stdout.trim().length > 0;
}

export async function log(dir: string, count = 10): Promise<string> {
  const { stdout } = await git(dir, ['log', `--oneline`, `-${count}`]);
  return stdout;
}
