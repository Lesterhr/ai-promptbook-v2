import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, FolderOpen, Plus, Trash2, Key, Clock, Shield } from 'lucide-react';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Card, Input, Select, SectionHeader } from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import * as storage from '../../services/storageService';
import type { SavedToken } from '../../services/storageService';
import { encryptToken, decryptToken } from '../../services/cryptoService';
import { getAppDataDir } from '../../services/pathService';
import { uuid, now } from '../../domain';
import type { ModelCredential, ModelProvider } from '../../domain';
import { PROVIDER_LABELS, PROVIDER_COLORS, loadCredentials, saveCredential, deleteCredential } from '../../services/credentialService';
import { HistoryManagement } from './HistoryManagement';

type SettingsTab = 'general' | 'history' | 'credentials';

export const SettingsPage: React.FC = () => {
  const { savedTokens, setSavedTokens, setGithubToken, setActiveTokenId, showToast, modelCredentials, setModelCredentials } = useAppStore();
  const [appDir, setAppDir] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // New token form
  const [newLabel, setNewLabel] = useState('');
  const [newToken, setNewToken] = useState('');
  const [showNewToken, setShowNewToken] = useState(false);
  const [saving, setSaving] = useState(false);

  // Revealed tokens (so user can peek)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});

  // Credential form
  const [credLabel, setCredLabel] = useState('');
  const [credProvider, setCredProvider] = useState<ModelProvider>('google-ai-studio');
  const [credApiKey, setCredApiKey] = useState('');
  const [showCredKey, setShowCredKey] = useState(false);
  const [savingCred, setSavingCred] = useState(false);

  const refreshCredentials = useCallback(async () => {
    try {
      const creds = await loadCredentials();
      setModelCredentials(creds);
    } catch (err) {
      showToast(`Failed to load credentials: ${err}`);
    }
  }, [setModelCredentials, showToast]);

  useEffect(() => {
    getAppDataDir().then(setAppDir).catch(() => {});
    loadTokens();
    refreshCredentials();
  }, [refreshCredentials]);

  const loadTokens = async () => {
    try {
      const config = await storage.loadConfig();

      // Migrate legacy single token → savedTokens
      if (config.githubToken && (!config.savedTokens || config.savedTokens.length === 0)) {
        const encrypted = await encryptToken(config.githubToken);
        const migrated: SavedToken = {
          id: uuid(),
          label: 'Default',
          encrypted,
          createdAt: now(),
        };
        config.savedTokens = [migrated];
        config.githubToken = null;
        await storage.saveConfig(config);
      }

      setSavedTokens(config.savedTokens ?? []);
    } catch (err) {
      showToast(`Failed to load tokens: ${err}`);
    }
  };

  const handleAddToken = async () => {
    const label = newLabel.trim() || 'Untitled';
    const raw = newToken.trim();
    if (!raw) {
      showToast('Please enter a token');
      return;
    }

    setSaving(true);
    try {
      const encrypted = await encryptToken(raw);
      const entry: SavedToken = { id: uuid(), label, encrypted, createdAt: now() };

      const config = await storage.loadConfig();
      const tokens = [...(config.savedTokens ?? []), entry];
      config.savedTokens = tokens;
      config.githubToken = null; // clear legacy
      await storage.saveConfig(config);

      setSavedTokens(tokens);
      setNewLabel('');
      setNewToken('');
      showToast(`Token "${label}" saved (encrypted)`);
    } catch (err) {
      showToast(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    try {
      const config = await storage.loadConfig();
      const tokens = (config.savedTokens ?? []).filter((t) => t.id !== id);
      config.savedTokens = tokens;
      await storage.saveConfig(config);
      setSavedTokens(tokens);

      // If it was active, clear
      if (useAppStore.getState().activeTokenId === id) {
        setActiveTokenId(null);
        setGithubToken(null);
      }
      showToast('Token removed');
    } catch (err) {
      showToast(`Delete failed: ${err}`);
    }
  };

  const handleActivateToken = async (token: SavedToken) => {
    try {
      const plaintext = await decryptToken(token.encrypted);
      setGithubToken(plaintext);
      setActiveTokenId(token.id);
      showToast(`Using token "${token.label}"`);
    } catch (err) {
      showToast(`Decrypt failed: ${err}`);
    }
  };

  const toggleReveal = async (token: SavedToken) => {
    const next = new Set(revealedIds);
    if (next.has(token.id)) {
      next.delete(token.id);
      const vals = { ...revealedValues };
      delete vals[token.id];
      setRevealedValues(vals);
    } else {
      try {
        const plaintext = await decryptToken(token.encrypted);
        next.add(token.id);
        setRevealedValues((v) => ({ ...v, [token.id]: plaintext }));
      } catch {
        showToast('Could not decrypt token');
        return;
      }
    }
    setRevealedIds(next);
  };

  const activeTokenId = useAppStore((s) => s.activeTokenId);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <SectionHeader title="Settings" subtitle="Configure your AI Promptbook environment" />

      {/* ── Tab Navigation ── */}
      <div
        style={{
          display: 'flex',
          gap: spacing.xs,
          marginBottom: spacing.xl,
          borderBottom: `1px solid ${colors.border.subtle}`,
          paddingBottom: spacing.xs,
        }}
      >
        {([
          { id: 'general' as SettingsTab, label: 'General', icon: <Key size={16} /> },
          { id: 'credentials' as SettingsTab, label: 'LLM Credentials', icon: <Shield size={16} /> },
          { id: 'history' as SettingsTab, label: 'Version History', icon: <Clock size={16} /> },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.sm} ${spacing.lg}`,
              background: activeTab === tab.id ? colors.bg.surface : 'transparent',
              color: activeTab === tab.id ? colors.text.primary : colors.text.secondary,
              border: activeTab === tab.id ? `1px solid ${colors.border.default}` : '1px solid transparent',
              borderBottom: 'none',
              borderRadius: `${radius.md} ${radius.md} 0 0`,
              cursor: 'pointer',
              fontSize: font.size.md,
              fontWeight: activeTab === tab.id ? font.weight.medium : font.weight.normal,
              transition: `all ${transition.fast}`,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <>
          {/* ── Saved Tokens ── */}
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
              GitHub Tokens
            </h3>
            <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginBottom: spacing.lg }}>
              Tokens are encrypted with AES-256 using a machine-specific key. They cannot be read outside this app.
            </p>

            {/* Existing tokens list */}
            {savedTokens.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.xl }}>
                {savedTokens.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: `${spacing.sm} ${spacing.lg}`,
                      background: activeTokenId === t.id ? `${colors.accent.green}11` : colors.bg.tertiary,
                      border: `1px solid ${activeTokenId === t.id ? colors.accent.green + '44' : colors.border.default}`,
                      borderRadius: radius.md,
                      transition: `all ${transition.fast}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: font.size.md,
                          fontWeight: font.weight.medium,
                          color: colors.text.primary,
                        }}
                      >
                        {t.label}
                      </div>
                      <div
                        style={{
                          fontSize: font.size.xs,
                          color: colors.text.muted,
                          fontFamily: font.mono,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {revealedIds.has(t.id) ? revealedValues[t.id] : '••••••••••••••••'}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleReveal(t)}
                      style={{ color: colors.text.muted, padding: spacing.xs, background: 'none', border: 'none', cursor: 'pointer' }}
                      title={revealedIds.has(t.id) ? 'Hide' : 'Reveal'}
                    >
                      {revealedIds.has(t.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                    {activeTokenId !== t.id && (
                      <Button variant="ghost" size="sm" onClick={() => handleActivateToken(t)}>
                        Use
                      </Button>
                    )}
                    {activeTokenId === t.id && (
                      <span style={{ fontSize: font.size.xs, color: colors.accent.green, fontWeight: font.weight.medium }}>
                        Active
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteToken(t.id)}
                      style={{ color: colors.accent.red, padding: spacing.xs, background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Delete token"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new token */}
            <div
              style={{
                padding: spacing.lg,
                background: colors.bg.primary,
                borderRadius: radius.md,
                border: `1px dashed ${colors.border.default}`,
              }}
            >
              <div style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: font.weight.medium, marginBottom: spacing.md }}>
                Add a new token
              </div>
              <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
                <div style={{ width: 180 }}>
                  <Input
                    label="Label"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Work, Personal"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Token"
                    type={showNewToken ? 'text' : 'password'}
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    placeholder="ghp_…"
                  />
                </div>
                <button
                  onClick={() => setShowNewToken(!showNewToken)}
                  style={{ color: colors.text.muted, alignSelf: 'flex-end', marginBottom: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                  title={showNewToken ? 'Hide' : 'Show'}
                >
                  {showNewToken ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleAddToken} disabled={saving || !newToken.trim()} icon={<Plus size={16} />} size="sm">
                  {saving ? 'Encrypting…' : 'Save Token'}
                </Button>
              </div>
              <p style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: spacing.sm }}>
                Create a token at{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.accent.blue }}
                >
                  github.com/settings/tokens
                </a>{' '}
                with the <code>repo</code> scope.
              </p>
            </div>
          </Card>

          {/* ── Data Location ── */}
          <Card>
            <h3
              style={{
                fontSize: font.size.lg,
                fontWeight: font.weight.semibold,
                color: colors.text.primary,
                marginBottom: spacing.lg,
              }}
            >
              Data Location
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <FolderOpen size={18} color={colors.text.muted} />
              <span className="selectable" style={{ fontSize: font.size.md, color: colors.text.secondary }}>
                {appDir || '~/.ai-promptbook'}
              </span>
            </div>
            <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: spacing.sm }}>
              Collections, templates, and config are stored in this folder.
            </p>
          </Card>
        </>
      )}

      {activeTab === 'credentials' && (
        <CredentialsTab
          credentials={modelCredentials}
          showToast={showToast}
          onSave={async (label, provider, apiKey) => {
            setSavingCred(true);
            try {
              await saveCredential(label, provider, apiKey);
              await refreshCredentials();
              setCredLabel('');
              setCredApiKey('');
              setShowCredKey(false);
              showToast(`Credential "${label}" saved`);
            } catch (err) {
              showToast(`Save failed: ${err}`);
            } finally {
              setSavingCred(false);
            }
          }}
          onDelete={async (id) => {
            try {
              await deleteCredential(id);
              await refreshCredentials();
              showToast('Credential removed');
            } catch (err) {
              showToast(`Delete failed: ${err}`);
            }
          }}
          credLabel={credLabel}
          setCredLabel={setCredLabel}
          credProvider={credProvider}
          setCredProvider={setCredProvider}
          credApiKey={credApiKey}
          setCredApiKey={setCredApiKey}
          showCredKey={showCredKey}
          setShowCredKey={setShowCredKey}
          savingCred={savingCred}
        />
      )}

      {activeTab === 'history' && <HistoryManagement />}
    </div>
  );
};

/* ───── CredentialsTab ───── */

interface CredentialsTabProps {
  credentials: ModelCredential[];
  showToast: (msg: string) => void;
  onSave: (label: string, provider: ModelProvider, apiKey: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  credLabel: string;
  setCredLabel: (v: string) => void;
  credProvider: ModelProvider;
  setCredProvider: (v: ModelProvider) => void;
  credApiKey: string;
  setCredApiKey: (v: string) => void;
  showCredKey: boolean;
  setShowCredKey: (v: boolean) => void;
  savingCred: boolean;
}

const PROVIDER_OPTIONS: { value: ModelProvider; label: string }[] = [
  { value: 'google-ai-studio', label: 'Google AI Studio' },
  { value: 'vertex-ai', label: 'Vertex AI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

const CredentialsTab: React.FC<CredentialsTabProps> = ({
  credentials,
  onSave,
  onDelete,
  credLabel,
  setCredLabel,
  credProvider,
  setCredProvider,
  credApiKey,
  setCredApiKey,
  showCredKey,
  setShowCredKey,
  savingCred,
}) => (
  <>
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
        <Shield size={18} />
        LLM Provider Credentials
      </h3>
      <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginBottom: spacing.lg }}>
        Manage API keys for LLM providers. Credentials are encrypted with AES-256-GCM and referenced by ID in agent workflows.
      </p>

      {/* Existing credentials list */}
      {credentials.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.xl }}>
          {credentials.map((c) => {
            const color = PROVIDER_COLORS[c.provider] ?? colors.accent.blue;
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  background: colors.bg.tertiary,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: radius.md,
                  transition: `all ${transition.fast}`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.text.primary }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>
                    {PROVIDER_LABELS[c.provider]} · Added {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(c.id)}
                  style={{ color: colors.accent.red, padding: spacing.xs, background: 'none', border: 'none', cursor: 'pointer' }}
                  title="Delete credential"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new credential */}
      <div
        style={{
          padding: spacing.lg,
          background: colors.bg.primary,
          borderRadius: radius.md,
          border: `1px dashed ${colors.border.default}`,
        }}
      >
        <div style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: font.weight.medium, marginBottom: spacing.md }}>
          Add a new credential
        </div>
        <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md, flexWrap: 'wrap' }}>
          <div style={{ width: 160 }}>
            <Input
              label="Label"
              value={credLabel}
              onChange={(e) => setCredLabel(e.target.value)}
              placeholder="e.g. My API Key"
            />
          </div>
          <div style={{ width: 180 }}>
            <Select
              label="Provider"
              options={PROVIDER_OPTIONS}
              value={credProvider}
              onChange={(e) => setCredProvider(e.target.value as ModelProvider)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              label="API Key"
              type={showCredKey ? 'text' : 'password'}
              value={credApiKey}
              onChange={(e) => setCredApiKey(e.target.value)}
              placeholder="sk-… or AIza…"
            />
          </div>
          <button
            onClick={() => setShowCredKey(!showCredKey)}
            style={{ color: colors.text.muted, alignSelf: 'flex-end', marginBottom: 4, background: 'none', border: 'none', cursor: 'pointer' }}
            title={showCredKey ? 'Hide' : 'Show'}
          >
            {showCredKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => onSave(credLabel.trim() || 'Untitled', credProvider, credApiKey.trim())}
            disabled={savingCred || !credApiKey.trim()}
            icon={<Plus size={16} />}
            size="sm"
          >
            {savingCred ? 'Encrypting…' : 'Save Credential'}
          </Button>
        </div>
      </div>
    </Card>
  </>
);
