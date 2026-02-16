import React, { useState, useEffect } from 'react';
import { X, Download, FolderOpen, Globe } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Input } from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import * as hubSvc from '../../services/templateHubService';
import * as migrationSvc from '../../services/migrationService';
import * as storage from '../../services/storageService';
import { uuid, now, inferCategory, DEFAULT_VERSION } from '../../domain';

interface TemplateImportDialogProps {
  collectionPath: string;
  onClose: () => void;
  onImported: () => void;
}

type ImportSource = 'hub' | 'local';

interface HubItem {
  name: string;
  path: string;
  sha: string;
  downloadUrl: string;
  checked: boolean;
}

export const TemplateImportDialog: React.FC<TemplateImportDialogProps> = ({
  collectionPath,
  onClose,
  onImported,
}) => {
  const { showToast } = useAppStore();
  const [source, setSource] = useState<ImportSource>('hub');
  const [hubItems, setHubItems] = useState<HubItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importVersion, setImportVersion] = useState(DEFAULT_VERSION);

  useEffect(() => {
    if (source === 'hub') {
      loadHubTemplates();
    }
  }, [source]);

  const loadHubTemplates = async () => {
    setLoading(true);
    try {
      const entries = await hubSvc.listHubTemplates();
      setHubItems(entries.map((e) => ({ ...e, checked: false })));
    } catch (err) {
      showToast(`Failed to load hub templates: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (idx: number) => {
    setHubItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleImportFromHub = async () => {
    const selected = hubItems.filter((i) => i.checked);
    if (selected.length === 0) {
      showToast('Select at least one template');
      return;
    }
    setImporting(true);
    try {
      for (const item of selected) {
        const content = await hubSvc.downloadHubTemplate(item);
        const name = item.name.replace(/\.instructions\.md$|\.md$/, '').replace(/[-_]/g, ' ');
        const tpl = {
          id: uuid(),
          name,
          description: '',
          category: inferCategory(item.name),
          tags: ['imported', 'hub'],
          createdAt: now(),
          updatedAt: now(),
          lastUsedAt: null,
          useCount: 0,
          source: { type: 'github' as const, repo: 'Lesterhr/LHR-CopilotTemplateHub', path: item.path, sha: item.sha },
          version: importVersion,
          filename: item.name,
          content,
        };
        await storage.saveTemplate(collectionPath, tpl);
      }
      showToast(`Imported ${selected.length} template(s)`);
      onImported();
      onClose();
    } catch (err) {
      showToast(`Import failed: ${err}`);
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromLocal = async () => {
    try {
      const dir = await openDialog({ directory: true, title: 'Select template folder' });
      if (!dir) return;
      setImporting(true);
      const count = await migrationSvc.importAllFromDirectory(dir as string, collectionPath);
      showToast(`Imported ${count} template(s)`);
      onImported();
      onClose();
    } catch (err) {
      showToast(`Import failed: ${err}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.subtle}`,
          borderRadius: radius.xl,
          width: 600,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.xl,
            borderBottom: `1px solid ${colors.border.subtle}`,
          }}
        >
          <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary }}>
            Import Templates
          </h3>
          <button onClick={onClose} style={{ color: colors.text.muted }}>
            <X size={20} />
          </button>
        </div>

        {/* Source tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border.subtle}` }}>
          {[
            { key: 'hub' as const, label: 'Template Hub', icon: <Globe size={16} /> },
            { key: 'local' as const, label: 'Local Folder', icon: <FolderOpen size={16} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSource(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                color: source === tab.key ? colors.accent.blue : colors.text.secondary,
                borderBottom: source === tab.key ? `2px solid ${colors.accent.blue}` : '2px solid transparent',
                transition: `all ${transition.fast}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Version input */}
        <div style={{ padding: `${spacing.md} ${spacing.xl}`, borderBottom: `1px solid ${colors.border.subtle}` }}>
          <Input 
            label="Import Version" 
            value={importVersion} 
            onChange={(e) => setImportVersion(e.target.value)} 
            placeholder="e.g., 1.0.0, 2.0.0"
          />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: spacing.xl }}>
          {source === 'hub' && (
            <>
              {loading && <p style={{ color: colors.text.muted }}>Loading templates from hub…</p>}
              {!loading && hubItems.length === 0 && (
                <p style={{ color: colors.text.muted }}>No templates found in the hub.</p>
              )}
              {!loading &&
                hubItems.map((item, idx) => (
                  <label
                    key={item.sha}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderRadius: radius.md,
                      cursor: 'pointer',
                      background: item.checked ? `${colors.accent.blue}11` : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(idx)}
                      style={{ accentColor: colors.accent.blue }}
                    />
                    <span style={{ color: colors.text.primary, fontSize: font.size.md }}>
                      {item.name}
                    </span>
                  </label>
                ))}
            </>
          )}

          {source === 'local' && (
            <div style={{ textAlign: 'center', padding: spacing.xl }}>
              <p style={{ color: colors.text.secondary, marginBottom: spacing.lg }}>
                Select a folder containing <code>.md</code> or <code>.instructions.md</code> files.
              </p>
              <Button onClick={handleImportFromLocal} disabled={importing} icon={<FolderOpen size={16} />}>
                {importing ? 'Importing…' : 'Choose Folder'}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {source === 'hub' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: spacing.sm,
              padding: spacing.xl,
              borderTop: `1px solid ${colors.border.subtle}`,
            }}
          >
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImportFromHub}
              disabled={importing || hubItems.filter((i) => i.checked).length === 0}
              icon={<Download size={16} />}
            >
              {importing ? 'Importing…' : `Import (${hubItems.filter((i) => i.checked).length})`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
