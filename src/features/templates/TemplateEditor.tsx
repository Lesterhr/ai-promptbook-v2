import React, { useState } from 'react';
import { Save, X, Tag, Download } from 'lucide-react';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { colors, spacing, font, radius } from '../../ui/theme';
import { Button, Input, Select } from '../../ui/components';
import type { Template, TemplateCategory } from '../../domain';
import { now } from '../../domain';
import * as storage from '../../services/storageService';
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
  const [version, setVersion] = useState(template.version);
  const [versionMode, setVersionMode] = useState<'keep' | 'new'>('keep');
  const [content, setContent] = useState(template.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: Template = {
        ...template,
        name,
        description,
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        version: versionMode === 'new' ? version : template.version,
        content,
        updatedAt: now(),
      };
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
        const exportTemplate: Template = {
          ...template,
          name,
          description,
          category,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          version: versionMode === 'new' ? version : template.version,
          content,
          updatedAt: now(),
        };
        await storage.exportTemplateToFile(exportTemplate, filePath);
        showToast('Template exported successfully');
      }
    } catch (err) {
      showToast(`Export failed: ${err}`);
    }
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
              { value: 'new', label: 'Create new version' },
            ]} 
            value={versionMode} 
            onChange={(e) => setVersionMode(e.target.value as 'keep' | 'new')} 
          />
          {versionMode === 'new' && (
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
    </div>
  );
};
