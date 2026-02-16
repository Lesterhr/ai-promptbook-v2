import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, FolderOpen } from 'lucide-react';
import { colors, spacing, font } from '../../ui/theme';
import { Button, Card, Input, SectionHeader } from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import * as storage from '../../services/storageService';
import { getAppDataDir } from '../../services/pathService';

export const SettingsPage: React.FC = () => {
  const { githubToken, setGithubToken, showToast } = useAppStore();
  const [token, setToken] = useState(githubToken ?? '');
  const [showToken, setShowToken] = useState(false);
  const [appDir, setAppDir] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAppDataDir().then(setAppDir).catch(() => {});
  }, []);

  const handleSaveToken = async () => {
    setSaving(true);
    try {
      const config = await storage.loadConfig();
      config.githubToken = token.trim() || null;
      await storage.saveConfig(config);
      setGithubToken(token.trim() || null);
      showToast('Settings saved');
    } catch (err) {
      showToast(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <SectionHeader title="Settings" subtitle="Configure your AI Promptbook environment" />

      {/* GitHub Token */}
      <Card style={{ marginBottom: spacing.xl }}>
        <h3
          style={{
            fontSize: font.size.lg,
            fontWeight: font.weight.semibold,
            color: colors.text.primary,
            marginBottom: spacing.lg,
          }}
        >
          GitHub Token
        </h3>
        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Personal Access Token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_…"
            />
          </div>
          <button onClick={() => setShowToken(!showToken)} style={{ color: colors.text.muted, marginBottom: 4 }}>
            {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: spacing.sm }}>
          Used for repo creation and collection sync. Requires <code>repo</code> scope.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing.lg }}>
          <Button onClick={handleSaveToken} disabled={saving} icon={<Save size={16} />}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>

      {/* Data location */}
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
    </div>
  );
};
