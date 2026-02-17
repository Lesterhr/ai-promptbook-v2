import React, { useState } from 'react';
import { Plus, FileText, X, Sparkles } from 'lucide-react';
import { colors, spacing, font, radius, transition, shadow } from '../../ui/theme';
import { Button, Input, Select } from '../../ui/components';
import { disciplines, type Discipline } from '../../data/guidelineContent';
import { useAppStore } from '../../state/appStore';
import * as storage from '../../services/storageService';
import type { TemplateCategory } from '../../domain';

interface TemplateCreateDialogProps {
  /** Pre-selected discipline (skip picker). Null = show discipline picker. */
  preselectedDisciplineId?: string | null;
  onCreated: (template: import('../../domain').Template) => void;
  onClose: () => void;
}

export const TemplateCreateDialog: React.FC<TemplateCreateDialogProps> = ({
  preselectedDisciplineId = null,
  onCreated,
  onClose,
}) => {
  const { collections, activeCollectionId } = useAppStore();

  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(
    preselectedDisciplineId ? disciplines.find((d) => d.id === preselectedDisciplineId) ?? null : null,
  );
  const [isBlank, setIsBlank] = useState(false);
  const [filename, setFilename] = useState(
    preselectedDisciplineId
      ? (disciplines.find((d) => d.id === preselectedDisciplineId)?.defaultFilename ?? '')
      : '',
  );
  const [templateName, setTemplateName] = useState('');
  const [collectionId, setCollectionId] = useState(activeCollectionId ?? collections[0]?.id ?? '');
  const [creating, setCreating] = useState(false);

  const selectedCollection = collections.find((c) => c.id === collectionId) ?? null;
  const showConfig = selectedDiscipline !== null || isBlank;

  const handleSelectDiscipline = (d: Discipline) => {
    setSelectedDiscipline(d);
    setIsBlank(false);
    setFilename(d.defaultFilename);
    setTemplateName(d.title);
  };

  const handleSelectBlank = () => {
    setSelectedDiscipline(null);
    setIsBlank(true);
    setFilename('');
    setTemplateName('');
  };

  const handleBack = () => {
    if (preselectedDisciplineId) {
      onClose();
      return;
    }
    setSelectedDiscipline(null);
    setIsBlank(false);
    setFilename('');
    setTemplateName('');
  };

  const handleCreate = async () => {
    if (!selectedCollection || !filename.trim()) return;
    setCreating(true);
    try {
      const name = templateName.trim() || filename.replace(/\.md$|\.mdc$/, '');
      const category: TemplateCategory = selectedDiscipline?.category ?? 'other';
      const content = isBlank
        ? `# ${name}\n\nAdd your content here.\n`
        : (selectedDiscipline?.scaffoldContent ?? '');
      const finalFilename = filename.trim().endsWith('.md') || filename.trim().startsWith('.')
        ? filename.trim()
        : `${filename.trim()}.md`;

      const tpl = await storage.createTemplate(
        selectedCollection.path,
        name,
        category,
        content,
        finalFilename,
      );
      onCreated(tpl);
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.subtle}`,
          borderRadius: radius.xl,
          boxShadow: shadow.lg,
          width: showConfig ? 520 : 720,
          maxHeight: '85vh',
          overflow: 'auto',
          transition: `width ${transition.normal}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${spacing.xl} ${spacing.xl} ${spacing.lg}`,
            borderBottom: `1px solid ${colors.border.subtle}`,
          }}
        >
          <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0 }}>
            {showConfig ? (isBlank ? 'New Blank Template' : `Create ${selectedDiscipline?.title}`) : 'New Template'}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ color: colors.text.muted, padding: spacing.xs, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: spacing.xl }}>
          {/* ── Step: Discipline Picker ── */}
          {!showConfig && (
            <>
              <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginBottom: spacing.lg }}>
                Choose a template type to start with a recommended structure, or create a blank template.
              </p>

              {/* Blank option */}
              <button
                onClick={handleSelectBlank}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  background: colors.bg.tertiary,
                  border: `1px dashed ${colors.border.default}`,
                  borderRadius: radius.md,
                  textAlign: 'left',
                  transition: `all ${transition.fast}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.text.muted; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border.default; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: radius.md, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: `${colors.text.muted}22`, color: colors.text.muted,
                }}>
                  <Plus size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: font.weight.medium, color: colors.text.primary, fontSize: font.size.md }}>
                    Blank Template
                  </div>
                  <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                    Start from scratch with an empty document
                  </div>
                </div>
              </button>

              {/* Discipline divider */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: spacing.md,
                margin: `${spacing.lg} 0`,
              }}>
                <div style={{ flex: 1, height: 1, background: colors.border.subtle }} />
                <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                  Or start from a guideline scaffold
                </span>
                <div style={{ flex: 1, height: 1, background: colors.border.subtle }} />
              </div>

              {/* Discipline cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                {disciplines.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDiscipline(d)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: spacing.md,
                      padding: spacing.lg,
                      background: colors.bg.tertiary,
                      border: `1px solid ${colors.border.subtle}`,
                      borderRadius: radius.md,
                      textAlign: 'left',
                      transition: `all ${transition.fast}`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = d.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border.subtle; }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: radius.md, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${d.color}22`, color: d.color,
                    }}>
                      {d.id === 'system-prompt' ? <Sparkles size={20} /> : <FileText size={20} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: font.weight.semibold, color: colors.text.primary, fontSize: font.size.md }}>
                        {d.title}
                      </div>
                      <div style={{ fontSize: font.size.xs, color: d.color, marginBottom: 4 }}>
                        {d.toolName}
                      </div>
                      <div style={{
                        fontSize: font.size.xs, color: colors.text.muted, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {d.shortDescription}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step: Configure ── */}
          {showConfig && (
            <>
              {!preselectedDisciplineId && (
                <button
                  onClick={handleBack}
                  style={{
                    fontSize: font.size.sm, color: colors.accent.blue,
                    marginBottom: spacing.lg, padding: 0,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  ← Back to template types
                </button>
              )}

              {selectedDiscipline && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: spacing.md,
                  padding: spacing.lg, marginBottom: spacing.xl,
                  background: `${selectedDiscipline.color}0a`,
                  border: `1px solid ${selectedDiscipline.color}33`,
                  borderRadius: radius.md,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: radius.md,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${selectedDiscipline.color}22`, color: selectedDiscipline.color,
                  }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: font.weight.semibold, color: colors.text.primary }}>
                      {selectedDiscipline.title}
                    </div>
                    <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                      {selectedDiscipline.placement}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <Input
                  label="Filename"
                  placeholder="e.g., AGENTS.md, .cursorrules"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />

                <Input
                  label="Template Name"
                  placeholder="Display name for this template"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />

                {collections.length > 0 && (
                  <Select
                    label="Collection"
                    options={collections.map((c) => ({ value: c.id, label: c.name }))}
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                  />
                )}
              </div>

              {collections.length === 0 && (
                <div style={{
                  padding: spacing.lg, marginTop: spacing.lg,
                  background: `${colors.accent.amber}11`,
                  border: `1px solid ${colors.accent.amber}33`,
                  borderRadius: radius.md, fontSize: font.size.sm, color: colors.accent.amber,
                }}>
                  No collections yet. Create a collection first on the Templates page.
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: spacing.md,
                marginTop: spacing.xl, paddingTop: spacing.lg,
                borderTop: `1px solid ${colors.border.subtle}`,
              }}>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={handleCreate}
                  disabled={!filename.trim() || !selectedCollection || creating}
                  icon={<Plus size={16} />}
                >
                  {creating ? 'Creating…' : 'Create Template'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
