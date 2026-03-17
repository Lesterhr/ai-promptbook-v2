import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, FolderOpen, Plus, Trash2, Key, Clock, Cpu, RefreshCw, Zap, ExternalLink } from 'lucide-react';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Card, Input, Select, SectionHeader, Badge } from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import * as storage from '../../services/storageService';
import type { SavedToken } from '../../services/storageService';
import { encryptToken, decryptToken } from '../../services/cryptoService';
import { getAppDataDir } from '../../services/pathService';
import { uuid, now } from '../../domain';
import type { ByokProviderType } from '../../domain';
import { checkCopilotCli, listModels } from '../../services/copilotService';
import { HistoryManagement } from './HistoryManagement';

type SettingsTab = 'general' | 'history' | 'copilot';

export const SettingsPage: React.FC = () => {
  const { savedTokens, setSavedTokens, setGithubToken, setActiveTokenId, showToast,
    copilotAvailable, copilotVersion, copilotEnabled, copilotModel, copilotByok, copilotCliPath,
    setCopilotAvailable, setCopilotVersion, setCopilotEnabled, setCopilotModel, setCopilotByok, setCopilotCliPath,
  } = useAppStore();
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

  useEffect(() => {
    getAppDataDir().then(setAppDir).catch(() => {});
    loadTokens();
  }, []);

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
          { id: 'copilot' as SettingsTab, label: 'AI / Copilot', icon: <Cpu size={16} /> },
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

      {activeTab === 'history' && <HistoryManagement />}

      {activeTab === 'copilot' && (
        <CopilotSettings
          copilotAvailable={copilotAvailable}
          copilotVersion={copilotVersion}
          copilotEnabled={copilotEnabled}
          copilotModel={copilotModel}
          copilotByok={copilotByok}
          copilotCliPath={copilotCliPath}
          setCopilotAvailable={setCopilotAvailable}
          setCopilotVersion={setCopilotVersion}
          setCopilotEnabled={setCopilotEnabled}
          setCopilotModel={setCopilotModel}
          setCopilotByok={setCopilotByok}
          setCopilotCliPath={setCopilotCliPath}
          showToast={showToast}
        />
      )}
    </div>
  );
};

/* ────────── Copilot Settings Sub-Component ────────── */

interface CopilotSettingsProps {
  copilotAvailable: boolean;
  copilotVersion: string | null;
  copilotEnabled: boolean;
  copilotModel: string;
  copilotByok: import('../../domain/copilot').ByokConfig | null;
  copilotCliPath: string | null;
  setCopilotAvailable: (v: boolean) => void;
  setCopilotVersion: (v: string | null) => void;
  setCopilotEnabled: (v: boolean) => void;
  setCopilotModel: (v: string) => void;
  setCopilotByok: (v: import('../../domain/copilot').ByokConfig | null) => void;
  setCopilotCliPath: (v: string | null) => void;
  showToast: (msg: string) => void;
}

const CopilotSettings: React.FC<CopilotSettingsProps> = ({
  copilotAvailable, copilotVersion, copilotEnabled, copilotModel, copilotByok, copilotCliPath,
  setCopilotAvailable, setCopilotVersion, setCopilotEnabled, setCopilotModel, setCopilotByok, setCopilotCliPath,
  showToast,
}) => {
  const { githubToken, activeTokenId, savedTokens } = useAppStore();
  const [detecting, setDetecting] = useState(false);
  const [customPath, setCustomPath] = useState(copilotCliPath ?? '');
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // BYOK form state
  const [byokEnabled, setByokEnabled] = useState(copilotByok !== null);
  const [byokType, setByokType] = useState<ByokProviderType>(copilotByok?.type ?? 'openai');
  const [byokUrl, setByokUrl] = useState(copilotByok?.baseUrl ?? '');
  const [byokKey, setByokKey] = useState('');
  const [byokSaving, setByokSaving] = useState(false);

  const activeToken = savedTokens.find((t) => t.id === activeTokenId);

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const pathToCheck = customPath.trim() || null;
      const status = await checkCopilotCli(pathToCheck);
      setCopilotAvailable(status.available);
      setCopilotVersion(status.version);
      if (status.available) {
        setCopilotCliPath(status.cliPath);
        showToast(`Copilot CLI found: v${status.version}`);
      } else {
        showToast('Copilot CLI not found');
      }
    } catch {
      setCopilotAvailable(false);
      showToast('Failed to detect Copilot CLI');
    } finally {
      setDetecting(false);
    }
  };

  const handleRefreshModels = async () => {
    setLoadingModels(true);
    try {
      const config = { enabled: copilotEnabled, cliPath: copilotCliPath, model: copilotModel, byok: copilotByok };
      const result = await listModels(config, githubToken);
      if (result.length > 0) {
        setModels(result);
        showToast(`Found ${result.length} models`);
      } else {
        showToast('No models returned — enter model name manually');
      }
    } catch {
      showToast('Could not fetch model list');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    setCopilotEnabled(enabled);
    const config = await storage.loadConfig();
    config.copilot = {
      enabled,
      cliPath: copilotCliPath,
      model: copilotModel,
      byok: copilotByok,
    };
    await storage.saveConfig(config);
    showToast(enabled ? 'AI features enabled' : 'AI features disabled');
  };

  const handleSaveModel = async (model: string) => {
    setCopilotModel(model);
    const config = await storage.loadConfig();
    config.copilot = {
      enabled: copilotEnabled,
      cliPath: copilotCliPath,
      model,
      byok: copilotByok,
    };
    await storage.saveConfig(config);
  };

  const handleSaveByok = async () => {
    setByokSaving(true);
    try {
      if (!byokEnabled) {
        setCopilotByok(null);
        const config = await storage.loadConfig();
        config.copilot = { enabled: copilotEnabled, cliPath: copilotCliPath, model: copilotModel, byok: null };
        await storage.saveConfig(config);
        showToast('BYOK disabled');
        return;
      }
      if (!byokUrl.trim()) {
        showToast('Please enter a Base URL');
        return;
      }
      const apiKeyEncrypted = byokKey.trim()
        ? await encryptToken(byokKey.trim())
        : (copilotByok?.apiKeyEncrypted ?? '');

      if (!apiKeyEncrypted) {
        showToast('Please enter an API key');
        return;
      }

      const byok = { type: byokType, baseUrl: byokUrl.trim(), apiKeyEncrypted };
      setCopilotByok(byok);

      const config = await storage.loadConfig();
      config.copilot = { enabled: copilotEnabled, cliPath: copilotCliPath, model: copilotModel, byok };
      await storage.saveConfig(config);
      setByokKey('');
      showToast('BYOK configuration saved');
    } catch (err) {
      showToast(`BYOK save failed: ${err}`);
    } finally {
      setByokSaving(false);
    }
  };

  const canEnable = copilotAvailable || byokEnabled;

  return (
    <>
      {/* ── Connection Status ── */}
      <Card style={{ marginBottom: spacing.xl }}>
        <h3
          style={{
            fontSize: font.size.lg, fontWeight: font.weight.semibold,
            color: colors.text.primary, marginBottom: spacing.lg,
            display: 'flex', alignItems: 'center', gap: spacing.sm,
          }}
        >
          <Zap size={18} />
          Connection Status
        </h3>

        <div style={{
          display: 'flex', alignItems: 'center', gap: spacing.md,
          padding: spacing.lg, background: colors.bg.tertiary,
          borderRadius: radius.md, marginBottom: spacing.lg,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: radius.full,
            background: copilotAvailable ? colors.accent.green : colors.accent.red,
            boxShadow: copilotAvailable ? `0 0 8px ${colors.accent.green}88` : 'none',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: font.weight.medium, color: colors.text.primary }}>
              {copilotAvailable ? 'Copilot CLI Connected' : 'Copilot CLI Not Found'}
            </div>
            {copilotAvailable && copilotVersion && (
              <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                Version {copilotVersion} · {copilotCliPath ?? 'copilot'}
              </div>
            )}
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={handleDetect}
            disabled={detecting}
            icon={<RefreshCw size={14} style={detecting ? { animation: 'spin 1s linear infinite' } : {}} />}
          >
            {detecting ? 'Detecting…' : 'Detect'}
          </Button>
        </div>

        <Input
          label="Custom CLI Path (optional)"
          placeholder="Leave empty to use PATH"
          value={customPath}
          onChange={(e) => setCustomPath(e.target.value)}
        />
        <p style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: spacing.sm }}>
          Requires the{' '}
          <a
            href="https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: colors.accent.blue }}
          >
            Copilot CLI
          </a>{' '}
          to be installed. <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
        </p>
      </Card>

      {/* ── Authentication ── */}
      <Card style={{ marginBottom: spacing.xl }}>
        <h3
          style={{
            fontSize: font.size.lg, fontWeight: font.weight.semibold,
            color: colors.text.primary, marginBottom: spacing.lg,
            display: 'flex', alignItems: 'center', gap: spacing.sm,
          }}
        >
          <Key size={18} />
          Authentication
        </h3>
        <div style={{
          padding: spacing.lg, background: colors.bg.tertiary,
          borderRadius: radius.md, display: 'flex', alignItems: 'center', gap: spacing.md,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: radius.full,
            background: githubToken ? colors.accent.green : colors.accent.amber,
          }} />
          <div style={{ flex: 1 }}>
            {githubToken ? (
              <>
                <div style={{ fontWeight: font.weight.medium, color: colors.text.primary }}>
                  Using token: {activeToken?.label ?? 'Active'}
                </div>
                <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                  Your active GitHub token is passed to the Copilot CLI automatically
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: font.weight.medium, color: colors.accent.amber }}>
                  No GitHub token active
                </div>
                <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                  Activate a token in the General tab, or configure BYOK below
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ── Model Selection ── */}
      <Card style={{ marginBottom: spacing.xl }}>
        <h3
          style={{
            fontSize: font.size.lg, fontWeight: font.weight.semibold,
            color: colors.text.primary, marginBottom: spacing.lg,
            display: 'flex', alignItems: 'center', gap: spacing.sm,
          }}
        >
          <Cpu size={18} />
          Model
        </h3>

        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            {models.length > 0 ? (
              <Select
                label="Model"
                options={models.map((m) => ({ value: m, label: m }))}
                value={copilotModel}
                onChange={(e) => handleSaveModel(e.target.value)}
              />
            ) : (
              <Input
                label="Model"
                placeholder="e.g. gpt-4o, claude-sonnet-4"
                value={copilotModel}
                onChange={(e) => handleSaveModel(e.target.value)}
              />
            )}
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={handleRefreshModels}
            disabled={loadingModels || !copilotAvailable}
            icon={<RefreshCw size={14} />}
          >
            {loadingModels ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
        <p style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: spacing.sm }}>
          All models available via Copilot CLI are supported. Use "Refresh" to query available models.
        </p>
      </Card>

      {/* ── BYOK ── */}
      <Card style={{ marginBottom: spacing.xl }}>
        <h3
          style={{
            fontSize: font.size.lg, fontWeight: font.weight.semibold,
            color: colors.text.primary, marginBottom: spacing.lg,
            display: 'flex', alignItems: 'center', gap: spacing.sm,
          }}
        >
          <Key size={18} />
          BYOK — Bring Your Own Key
          <Badge color={colors.accent.purple}>Optional</Badge>
        </h3>

        <div style={{
          display: 'flex', alignItems: 'center', gap: spacing.md,
          marginBottom: spacing.lg,
        }}>
          <button
            onClick={() => {
              setByokEnabled(!byokEnabled);
              if (byokEnabled) handleSaveByok();
            }}
            style={{
              width: 44, height: 24, borderRadius: radius.full, padding: 2,
              background: byokEnabled ? colors.accent.blue : colors.bg.tertiary,
              border: `1px solid ${byokEnabled ? colors.accent.blue : colors.border.default}`,
              cursor: 'pointer', transition: `all ${transition.fast}`,
              display: 'flex', alignItems: 'center',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: radius.full,
              background: colors.text.primary,
              transform: byokEnabled ? 'translateX(20px)' : 'translateX(0)',
              transition: `transform ${transition.fast}`,
            }} />
          </button>
          <span style={{ fontSize: font.size.md, color: colors.text.secondary }}>
            Use custom API provider instead of GitHub Copilot
          </span>
        </div>

        {byokEnabled && (
          <div style={{
            padding: spacing.lg, background: colors.bg.primary,
            borderRadius: radius.md, border: `1px dashed ${colors.border.default}`,
            display: 'flex', flexDirection: 'column', gap: spacing.lg,
          }}>
            <Select
              label="Provider"
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'anthropic', label: 'Anthropic' },
                { value: 'azure', label: 'Azure OpenAI' },
              ]}
              value={byokType}
              onChange={(e) => setByokType(e.target.value as ByokProviderType)}
            />
            <Input
              label="Base URL"
              placeholder="e.g. https://api.openai.com/v1"
              value={byokUrl}
              onChange={(e) => setByokUrl(e.target.value)}
            />
            <Input
              label={copilotByok?.apiKeyEncrypted ? 'API Key (saved — enter new to replace)' : 'API Key'}
              type="password"
              placeholder={copilotByok?.apiKeyEncrypted ? '••••••••••••' : 'sk-…'}
              value={byokKey}
              onChange={(e) => setByokKey(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={handleSaveByok}
                disabled={byokSaving}
                size="sm"
              >
                {byokSaving ? 'Saving…' : 'Save BYOK Config'}
              </Button>
            </div>
            <p style={{ fontSize: font.size.xs, color: colors.text.muted }}>
              With BYOK, no GitHub Copilot subscription is required. API keys are encrypted with the same AES-256 scheme as GitHub tokens.
            </p>
          </div>
        )}
      </Card>

      {/* ── Master Toggle ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{
              fontSize: font.size.lg, fontWeight: font.weight.semibold,
              color: colors.text.primary, marginBottom: spacing.xs,
            }}>
              Enable AI Features
            </h3>
            <p style={{ fontSize: font.size.sm, color: colors.text.muted }}>
              {canEnable
                ? 'Activate AI-powered template generation, improvement, conversion, and scoring.'
                : 'Detect Copilot CLI or configure BYOK first.'}
            </p>
          </div>
          <button
            onClick={() => canEnable && handleToggleEnabled(!copilotEnabled)}
            disabled={!canEnable}
            style={{
              width: 52, height: 28, borderRadius: radius.full, padding: 2,
              background: copilotEnabled ? colors.accent.green : colors.bg.tertiary,
              border: `1px solid ${copilotEnabled ? colors.accent.green : colors.border.default}`,
              cursor: canEnable ? 'pointer' : 'not-allowed',
              opacity: canEnable ? 1 : 0.5,
              transition: `all ${transition.fast}`,
              display: 'flex', alignItems: 'center',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: radius.full,
              background: colors.text.primary,
              transform: copilotEnabled ? 'translateX(24px)' : 'translateX(0)',
              transition: `transform ${transition.fast}`,
            }} />
          </button>
        </div>
      </Card>
    </>
  );
};
