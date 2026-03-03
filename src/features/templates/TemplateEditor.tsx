import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, Tag, Download, Copy, Clock, RotateCcw } from 'lucide-react';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Input, Select, Badge, ConfirmDialog, RatingControl } from '../../ui/components';
import type { Template, TemplateCategory } from '../../domain';
import { now, suggestNextVersions } from '../../domain';
import * as storage from '../../services/storageService';
import type { ArchivedVersion } from '../../services/storageService';
import { useAppStore } from '../../state/appStore';

interface TemplateEditorProps {
  template: Template;
  collectionPath: string;
  onSave: () => void;
  onCancel: () => void;
}

const categoryOptions = [
  { value: 'instruction', label: 'Instruction' },
  { value: 'system-prompt', label: 'System Prompt' },
  { value: 'readme', label: 'README' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'snippet', label: 'Snippet' },
  { value: 'other', label: 'Other' },
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  collectionPath,
  onSave,
  onCancel,
}) => {
  const { showToast } = useAppStore();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [category, setCategory] = useState<TemplateCategory>(template.category);
  const [tags, setTags] = useState(template.tags.join(', '));
  const suggestions = suggestNextVersions(template.version);
  const [version, setVersion] = useState(suggestions[0]);
  const [versionMode, setVersionMode] = useState<'keep' | 'patch' | 'minor' | 'major' | 'custom'>('keep');
  const [content, setContent] = useState(template.content);
  const [rating, setRating] = useState<number | null>(template.rating ?? null);
  const [saving, setSaving] = useState(false);

  // Version history switcher
  const [history, setHistory] = useState<ArchivedVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState<ArchivedVersion | null>(null);

  // Save as copy
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyName, setCopyName] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      const h = await storage.listTemplateHistory(collectionPath, template.id);
      setHistory(h);
    } catch {
      // silently ignore if no history
    }
  }, [collectionPath, template.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const resolveVersion = (): string => {
    switch (versionMode) {
      case 'patch': return suggestions[0];
      case 'minor': return suggestions[1];
      case 'major': return suggestions[2];
      case 'custom': return version;
      default: return template.version;
    }
  };

  const buildUpdatedTemplate = (): Template => {
    return {
      ...template,
      name,
      description,
      category,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      version: resolveVersion(),
      content,
      rating,
      updatedAt: now(),
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = buildUpdatedTemplate();
      await storage.saveTemplate(collectionPath, updated);
      showToast('Template saved');
      onSave();
    } catch (err) {
      showToast(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const filePath = await saveDialog({
        title: 'Export Template',
        defaultPath: template.filename,
        filters: [{
          name: 'Markdown',
          extensions: ['md']
        }]
      });
      if (filePath) {
        const exportTemplate = buildUpdatedTemplate();
        await storage.exportTemplateToFile(exportTemplate, filePath);
        showToast('Template exported successfully');
      }
    } catch (err) {
      showToast(`Export failed: ${err}`);
    }
  };

  const handleSaveAsCopy = async () => {
    const trimmed = copyName.trim();
    if (!trimmed) {
      showToast('Please enter a name for the copy');
      return;
    }
    setSaving(true);
    try {
      const sourceTemplate = buildUpdatedTemplate();
      await storage.duplicateTemplate(collectionPath, sourceTemplate, trimmed);
      showToast(`Template duplicated as "${trimmed}"`);
      setShowCopyDialog(false);
      setCopyName('');
      onSave();
    } catch (err) {
      showToast(`Duplicate failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (archived: ArchivedVersion) => {
    try {
      const archivedContent = await storage.readArchivedVersion(collectionPath, template.id, archived.filename);
      setContent(archivedContent);
      setVersion(archived.version);
      setVersionMode('custom');
      showToast(`Loaded content from v${archived.version} – save to apply`);
    } catch (err) {
      showToast(`Restore failed: ${err}`);
    }
    setRestoreConfirm(null);
    setShowHistory(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xl,
        }}
      >
        <h2 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary }}>
          Edit Template
        </h2>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {history.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setShowHistory(!showHistory)}
              icon={<Clock size={16} />}
            >
              History ({history.length})
            </Button>
          )}
          <Button variant="ghost" onClick={() => { setCopyName(`${name} (Copy)`); setShowCopyDialog(true); }} icon={<Copy size={16} />}>
            Save as Copy
          </Button>
          <Button variant="ghost" onClick={onCancel} icon={<X size={16} />}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleExport} icon={<Download size={16} />}>
            Export
          </Button>
          <Button onClick={handleSave} disabled={saving} icon={<Save size={16} />}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Version History Drawer */}
      {showHistory && history.length > 0 && (
        <div
          style={{
            marginBottom: spacing.xl,
            padding: spacing.lg,
            background: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>
              Version History
            </h3>
            <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>
              Click “Load” to load a version into the editor
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {/* Current version */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                padding: `${spacing.sm} ${spacing.md}`,
                background: `${colors.accent.green}11`,
                border: `1px solid ${colors.accent.green}33`,
                borderRadius: radius.md,
              }}
            >
              <Badge color={colors.accent.green}>v{template.version}</Badge>
              <span style={{ fontSize: font.size.sm, color: colors.text.primary, flex: 1 }}>
                Current version
              </span>
              <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>
                {formatDate(template.updatedAt)}
              </span>
            </div>

            {/* Archived versions */}
            {history.map((v) => (
              <div
                key={v.filename}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: radius.md,
                  transition: `background ${transition.fast}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Badge color={colors.accent.purple}>v{v.version}</Badge>
                <span style={{ fontSize: font.size.sm, color: colors.text.secondary, flex: 1 }}>
                  Archived {formatDate(v.archivedAt)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw size={12} />}
                  onClick={() => setRestoreConfirm(v)}
                >
                  Load
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta fields */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Select label="Category" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value as TemplateCategory)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <Select 
            label="Version" 
            options={[
              { value: 'keep', label: `Keep current (v${template.version})` },
              { value: 'patch', label: `Patch (v${suggestions[0]})` },
              { value: 'minor', label: `Minor (v${suggestions[1]})` },
              { value: 'major', label: `Major (v${suggestions[2]})` },
              { value: 'custom', label: 'Custom version…' },
            ]} 
            value={versionMode} 
            onChange={(e) => setVersionMode(e.target.value as 'keep' | 'patch' | 'minor' | 'major' | 'custom')} 
          />
          {versionMode === 'custom' && (
            <Input 
              value={version} 
              onChange={(e) => setVersion(e.target.value)} 
              placeholder="e.g., 2.0.0"
            />
          )}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Input
            label="Tags (comma-separated)"
            icon={<Tag size={16} />}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. agent, copilot, react"
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <label
              style={{
                fontSize: font.size.sm,
                color: colors.text.secondary,
                fontWeight: font.weight.medium,
              }}
            >
              Quality Rating
            </label>
            <RatingControl size="md" value={rating} onChange={setRating} />
          </div>
        </div>
      </div>

      {/* Content editor */}
      <div style={{ marginBottom: spacing.sm }}>
        <label
          style={{
            fontSize: font.size.sm,
            color: colors.text.secondary,
            fontWeight: font.weight.medium,
          }}
        >
          Content (Markdown)
        </label>
      </div>
      <textarea
        className="selectable"
        aria-label="Template content"
        placeholder="Enter template content…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: '100%',
          minHeight: 400,
          padding: spacing.lg,
          background: colors.bg.tertiary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radius.md,
          color: colors.text.primary,
          fontSize: font.size.md,
          fontFamily: font.mono,
          lineHeight: 1.6,
          resize: 'vertical',
        }}
      />

      {/* Save as Copy Dialog */}
      {showCopyDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowCopyDialog(false)}
        >
          <div
            style={{
              background: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              borderRadius: radius.lg,
              padding: spacing.xl,
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0, marginBottom: spacing.md }}>
              Save as Copy
            </h3>
            <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginBottom: spacing.lg }}>
              Create a duplicate of this template with a new name. The copy will start at version 1.0.0 with the current editor content.
            </p>
            <Input
              label="New template name"
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
              placeholder="e.g., My Template (v2)"
            />
            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', marginTop: spacing.xl }}>
              <Button variant="secondary" onClick={() => setShowCopyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAsCopy} disabled={saving || !copyName.trim()} icon={<Copy size={16} />}>
                {saving ? 'Duplicating…' : 'Duplicate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restore version confirm */}
      <ConfirmDialog
        isOpen={!!restoreConfirm}
        title="Load Archived Version"
        message={`Load the content from v${restoreConfirm?.version ?? ''} into the editor? Your unsaved changes will be replaced. You still need to save to apply.`}
        confirmText="Load"
        onConfirm={() => restoreConfirm && handleRestoreVersion(restoreConfirm)}
        onCancel={() => setRestoreConfirm(null)}
        variant="primary"
      />
    </div>
  );
};
