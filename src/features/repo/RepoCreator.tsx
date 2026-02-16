import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Check,
  ExternalLink,
  Loader,
  Eye,
  EyeOff,
  FolderOpen,
  Key,
} from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Card, Input, TextArea, Select, SectionHeader } from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import * as githubSvc from '../../services/githubService';
import { cloneRepo } from '../../services/gitService';
import { decryptToken } from '../../services/cryptoService';
import * as storage from '../../services/storageService';

type Step = 'form' | 'creating' | 'done';
type TokenSource = 'saved' | 'manual';

export const RepoCreator: React.FC = () => {
  const { githubToken, setGithubToken, savedTokens, setSavedTokens, activeTokenId, setActiveTokenId, showToast } = useAppStore();

  const [step, setStep] = useState<Step>('form');
  const [tokenSource, setTokenSource] = useState<TokenSource>(savedTokens.length > 0 ? 'saved' : 'manual');
  const [selectedTokenId, setSelectedTokenId] = useState(activeTokenId ?? '');
  const [manualToken, setManualToken] = useState('');
  const [showManualToken, setShowManualToken] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');

  // The resolved plaintext token currently being used
  const [resolvedToken, setResolvedToken] = useState(githubToken ?? '');

  const [repoName, setRepoName] = useState('');
  const [repoDesc, setRepoDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [language, setLanguage] = useState('Python');
  const [gitignoreTemplates, setGitignoreTemplates] = useState<string[]>([]);
  const [localPath, setLocalPath] = useState('');

  const [createdUrl, setCreatedUrl] = useState('');
  const [clonedPath, setClonedPath] = useState('');

  /* Load saved tokens on mount */
  useEffect(() => {
    (async () => {
      const config = await storage.loadConfig();
      if (config.savedTokens?.length) {
        setSavedTokens(config.savedTokens);
        setTokenSource('saved');
      }
    })();
  }, []);

  /* Auto-select the active token */
  useEffect(() => {
    if (activeTokenId && savedTokens.find((t) => t.id === activeTokenId)) {
      setSelectedTokenId(activeTokenId);
    } else if (savedTokens.length > 0) {
      setSelectedTokenId(savedTokens[0].id);
    }
  }, [savedTokens, activeTokenId]);

  /* ─── Validate / resolve token ─── */
  const validateToken = async () => {
    let plain = '';

    if (tokenSource === 'saved') {
      const saved = savedTokens.find((t) => t.id === selectedTokenId);
      if (!saved) { showToast('Select a token first'); return; }
      try {
        plain = await decryptToken(saved.encrypted);
      } catch {
        showToast('Failed to decrypt token');
        return;
      }
    } else {
      plain = manualToken.trim();
      if (!plain) return;
    }

    try {
      const user = await githubSvc.validateToken(plain);
      setUsername(user);
      setTokenValid(true);
      setResolvedToken(plain);
      setGithubToken(plain);

      if (tokenSource === 'saved') {
        setActiveTokenId(selectedTokenId);
      }

      const tpls = await githubSvc.listGitignoreTemplates(plain);
      setGitignoreTemplates(tpls);
    } catch {
      setTokenValid(false);
      showToast('Invalid GitHub token');
    }
  };

  useEffect(() => {
    if (githubToken) {
      setResolvedToken(githubToken);
      // Auto-validate on mount if we already have a token
      (async () => {
        try {
          const user = await githubSvc.validateToken(githubToken);
          setUsername(user);
          setTokenValid(true);
          const tpls = await githubSvc.listGitignoreTemplates(githubToken);
          setGitignoreTemplates(tpls);
        } catch { /* ignore */ }
      })();
    }
  }, []);

  /* ─── Pick local folder ─── */
  const handlePickFolder = async () => {
    try {
      const dir = await openDialog({ directory: true, title: 'Choose where to clone the repository' });
      if (dir) setLocalPath(dir as string);
    } catch {
      // user cancelled
    }
  };

  /* ─── Create repo ─── */
  const handleCreate = async () => {
    if (!repoName.trim()) {
      showToast('Repository name is required');
      return;
    }
    setStep('creating');
    try {
      const repo = await githubSvc.createRepo(resolvedToken, {
        name: repoName.trim(),
        description: repoDesc.trim(),
        isPrivate,
        autoInit: true,
        gitignoreTemplate: language,
        language,
      });
      setCreatedUrl(repo.htmlUrl);

      // Clone locally if a path was chosen
      if (localPath) {
        const targetDir = `${localPath}\\${repoName.trim()}`;
        await cloneRepo(resolvedToken, repo.fullName, targetDir);
        setClonedPath(targetDir);
        showToast(`Repository "${repo.fullName}" created & cloned!`);
      } else {
        setClonedPath('');
        showToast(`Repository "${repo.fullName}" created!`);
      }

      setStep('done');
    } catch (err) {
      showToast(`Failed: ${err}`);
      setStep('form');
    }
  };

  /* ─── Done screen ─── */
  if (step === 'done') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: spacing['3xl'] }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `${colors.accent.green}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing.xl,
          }}
        >
          <Check size={32} color={colors.accent.green} />
        </div>
        <h2 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary }}>
          Repository Created
        </h2>
        <p style={{ color: colors.text.secondary, marginTop: spacing.md, marginBottom: spacing.sm }}>
          Your new repository is ready on GitHub.
        </p>
        {clonedPath && (
          <p
            className="selectable"
            style={{
              color: colors.text.secondary,
              marginBottom: spacing.xl,
              fontSize: font.size.md,
            }}
          >
            Cloned to: <strong style={{ color: colors.accent.green }}>{clonedPath}</strong>
          </p>
        )}
        {!clonedPath && <div style={{ marginBottom: spacing.xl }} />}
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
          <Button
            variant="secondary"
            icon={<ExternalLink size={16} />}
            onClick={() => openUrl(createdUrl)}
          >
            Open on GitHub
          </Button>
          <Button
            onClick={() => {
              setStep('form');
              setRepoName('');
              setRepoDesc('');
              setClonedPath('');
            }}
          >
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Creating spinner ─── */
  if (step === 'creating') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: spacing['3xl'] }}>
        <Loader
          size={48}
          color={colors.accent.blue}
          style={{ animation: 'spin 1s linear infinite', marginBottom: spacing.xl }}
        />
        <h2 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary }}>
          Creating Repository…
        </h2>
      </div>
    );
  }

  /* ─── Form ─── */
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <SectionHeader
        title="Repo Creator"
        subtitle="Create a new GitHub repository with project scaffolding"
      />

      {/* Token section */}
      <Card style={{ marginBottom: spacing.xl }}>
        <h3
          style={{
            fontSize: font.size.lg,
            fontWeight: font.weight.semibold,
            color: colors.text.primary,
            marginBottom: spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <Key size={18} />
          GitHub Authentication
        </h3>

        {/* Source toggle */}
        {savedTokens.length > 0 && (
          <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg }}>
            {(['saved', 'manual'] as const).map((src) => (
              <button
                key={src}
                onClick={() => { setTokenSource(src); setTokenValid(null); }}
                style={{
                  padding: `${spacing.xs} ${spacing.lg}`,
                  borderRadius: radius.md,
                  fontSize: font.size.sm,
                  fontWeight: font.weight.medium,
                  border: `1px solid ${tokenSource === src ? colors.accent.blue : colors.border.default}`,
                  background: tokenSource === src ? `${colors.accent.blue}22` : 'transparent',
                  color: tokenSource === src ? colors.accent.blue : colors.text.secondary,
                  cursor: 'pointer',
                  transition: `all ${transition.fast}`,
                }}
              >
                {src === 'saved' ? 'Saved Token' : 'Paste Token'}
              </button>
            ))}
          </div>
        )}

        {/* Saved token picker */}
        {tokenSource === 'saved' && savedTokens.length > 0 && (
          <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Select
                label="Choose a saved token"
                options={savedTokens.map((t) => ({ value: t.id, label: t.label }))}
                value={selectedTokenId}
                onChange={(e) => { setSelectedTokenId(e.target.value); setTokenValid(null); }}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={validateToken}>
              Verify
            </Button>
          </div>
        )}

        {/* Manual token input */}
        {(tokenSource === 'manual' || savedTokens.length === 0) && (
          <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Personal Access Token"
                type={showManualToken ? 'text' : 'password'}
                value={manualToken}
                onChange={(e) => {
                  setManualToken(e.target.value);
                  setTokenValid(null);
                }}
                placeholder="ghp_…"
              />
            </div>
            <button
              onClick={() => setShowManualToken(!showManualToken)}
              style={{ color: colors.text.muted, marginBottom: 4, background: 'none', border: 'none', cursor: 'pointer' }}
              title={showManualToken ? 'Hide' : 'Show'}
            >
              {showManualToken ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <Button variant="secondary" size="sm" onClick={validateToken}>
              Verify
            </Button>
          </div>
        )}
        {tokenValid === true && (
          <p style={{ fontSize: font.size.sm, color: colors.accent.green, marginTop: spacing.sm }}>
            ✓ Authenticated as <strong>{username}</strong>
          </p>
        )}
        {tokenValid === false && (
          <p style={{ fontSize: font.size.sm, color: colors.accent.red, marginTop: spacing.sm }}>
            ✗ Token is invalid or expired
          </p>
        )}
      </Card>

      {/* Repo details */}
      <Card>
        <h3
          style={{
            fontSize: font.size.lg,
            fontWeight: font.weight.semibold,
            color: colors.text.primary,
            marginBottom: spacing.lg,
          }}
        >
          Repository Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            label="Repository Name"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="my-new-project"
          />
          <TextArea
            label="Description"
            value={repoDesc}
            onChange={(e) => setRepoDesc(e.target.value)}
            placeholder="A short description of your project"
            style={{ minHeight: 80 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
            <Select
              label="Visibility"
              options={[
                { value: 'private', label: 'Private' },
                { value: 'public', label: 'Public' },
              ]}
              value={isPrivate ? 'private' : 'public'}
              onChange={(e) => setIsPrivate(e.target.value === 'private')}
            />
            <Select
              label="Language / .gitignore"
              options={
                gitignoreTemplates.length > 0
                  ? gitignoreTemplates.map((t) => ({ value: t, label: t }))
                  : [
                      { value: 'Python', label: 'Python' },
                      { value: 'Node', label: 'Node / JavaScript' },
                      { value: 'VisualStudio', label: 'C# / .NET' },
                    ]
              }
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>

          {/* Local clone path */}
          <div>
            <label
              style={{
                fontSize: font.size.sm,
                color: colors.text.secondary,
                fontWeight: font.weight.medium,
                display: 'block',
                marginBottom: spacing.xs,
              }}
            >
              Clone to local folder (optional)
            </label>
            <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
              <div
                className="selectable"
                style={{
                  flex: 1,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  background: colors.bg.tertiary,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '8px',
                  color: localPath ? colors.text.primary : colors.text.muted,
                  fontSize: font.size.md,
                  minHeight: 38,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {localPath || 'No folder selected — repo will only be on GitHub'}
              </div>
              <Button variant="secondary" size="sm" onClick={handlePickFolder} icon={<FolderOpen size={16} />}>
                Browse
              </Button>
              {localPath && (
                <button
                  onClick={() => setLocalPath('')}
                  style={{ color: colors.text.muted, fontSize: font.size.sm }}
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
            <p style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: spacing.xs }}>
              {localPath
                ? `The repo will be cloned to: ${localPath}\\${repoName || '<repo-name>'}`
                : 'Pick a folder to also get a local copy of the repository.'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing.md }}>
            <Button
              onClick={handleCreate}
              disabled={!tokenValid || !repoName.trim()}
              icon={<GitBranch size={16} />}
            >
              Create Repository
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
