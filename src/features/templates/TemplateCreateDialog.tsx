import React, { useState } from 'react';
import { Plus, FileText, X, Sparkles, Loader } from 'lucide-react';
import { colors, spacing, font, radius, transition, shadow } from '../../ui/theme';
import { Button, Input, Select, TextArea } from '../../ui/components';
import { disciplines, type Discipline } from '../../data/guidelineContent';
import { useAppStore } from '../../state/appStore';
import * as storage from '../../services/storageService';
import { generateContent } from '../../services/copilotService';
import { decryptToken } from '../../services/cryptoService';
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
  const { collections, activeCollectionId, copilotEnabled, copilotModel, copilotByok, copilotCliPath, githubToken, showToast } = useAppStore();

  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(
    preselectedDisciplineId ? disciplines.find((d) => d.id === preselectedDisciplineId) ?? null : null,
  );
  const [isBlank, setIsBlank] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiDiscipline, setAiDiscipline] = useState<Discipline | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [filename, setFilename] = useState(
    preselectedDisciplineId
      ? (disciplines.find((d) => d.id === preselectedDisciplineId)?.defaultFilename ?? '')
      : '',
  );
  const [templateName, setTemplateName] = useState('');
  const [collectionId, setCollectionId] = useState(activeCollectionId ?? collections[0]?.id ?? '');
  const [creating, setCreating] = useState(false);

  const selectedCollection = collections.find((c) => c.id === collectionId) ?? null;
  const showConfig = selectedDiscipline !== null || isBlank || (isAiMode && aiGeneratedContent);

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
    setIsAiMode(false);
    setAiDiscipline(null);
    setAiPrompt('');
    setAiGeneratedContent('');
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
        : aiGeneratedContent
          ? aiGeneratedContent
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

  const handleStartAiMode = () => {
    setIsAiMode(true);
    setIsBlank(false);
    setSelectedDiscipline(null);
  };

  const handleSelectAiDiscipline = (d: Discipline) => {
    setAiDiscipline(d);
    setFilename(d.defaultFilename);
    setTemplateName(d.title);
  };

  const handleGenerate = async () => {
    if (!aiDiscipline || !aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const guide = aiDiscipline.guide;
      const systemMessage = `You are an expert at writing AI agent instruction files.
Your task is to generate a complete, production-ready ${aiDiscipline.title} file.

Use this scaffold as structural reference (fill in the placeholders based on the user's project description):
${aiDiscipline.scaffoldContent}

Quality criteria to follow:
- ${guide.bestPractices.join('\n- ')}

Key structural requirements:
${guide.structureDescription}

Key points to cover:
- ${guide.keyPoints.join('\n- ')}

Return ONLY the complete file content, no explanations or code fences.`;

      const config = { enabled: true, cliPath: copilotCliPath, model: copilotModel, byok: copilotByok };
      let decryptedByokKey: string | null = null;
      if (copilotByok?.apiKeyEncrypted) {
        decryptedByokKey = await decryptToken(copilotByok.apiKeyEncrypted);
      }

      const result = await generateContent(
        { systemMessage, prompt: aiPrompt },
        config,
        githubToken,
        decryptedByokKey,
      );
      setAiGeneratedContent(result.content);
      showToast('Template generated successfully');
    } catch (err) {
      showToast(`Generation failed: ${err}`);
    } finally {
      setGenerating(false);
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
          width: showConfig ? 520 : isAiMode ? 600 : 720,
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
            {showConfig ? (isBlank ? 'New Blank Template' : isAiMode ? 'Generate with AI' : `Create ${selectedDiscipline?.title}`) : isAiMode ? 'Generate with AI' : 'New Template'}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ color: colors.text.muted, padding: spacing.xs, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: spacing.xl }}>
          {/* ── Step: Discipline Picker ── */}
          {!showConfig && !isAiMode && (
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
                  marginBottom: spacing.sm,
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

              {/* Generate with AI option */}
              <button
                onClick={handleStartAiMode}
                disabled={!copilotEnabled}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                  background: copilotEnabled ? `${colors.accent.purple}0a` : colors.bg.tertiary,
                  border: `1px dashed ${copilotEnabled ? colors.accent.purple + '55' : colors.border.default}`,
                  borderRadius: radius.md,
                  textAlign: 'left',
                  transition: `all ${transition.fast}`,
                  cursor: copilotEnabled ? 'pointer' : 'not-allowed',
                  opacity: copilotEnabled ? 1 : 0.5,
                }}
                onMouseEnter={(e) => { if (copilotEnabled) e.currentTarget.style.borderColor = colors.accent.purple; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = copilotEnabled ? colors.accent.purple + '55' : colors.border.default; }}
                title={copilotEnabled ? 'Generate a template using AI' : 'Enable Copilot in Settings → AI / Copilot'}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: radius.md, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: `${colors.accent.purple}22`, color: colors.accent.purple,
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: font.weight.medium, color: copilotEnabled ? colors.text.primary : colors.text.muted, fontSize: font.size.md }}>
                    Generate with AI
                  </div>
                  <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                    {copilotEnabled ? 'Describe your project and let AI create the template' : 'Enable Copilot in Settings to unlock'}
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

          {/* ── Step: AI Prompt ── */}
          {isAiMode && !showConfig && (
            <>
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

              {/* Format selection for AI */}
              <div style={{ marginBottom: spacing.xl }}>
                <label style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: font.weight.medium, display: 'block', marginBottom: spacing.sm }}>
                  Target Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
                  {disciplines.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectAiDiscipline(d)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: spacing.sm,
                        padding: `${spacing.sm} ${spacing.md}`,
                        background: aiDiscipline?.id === d.id ? `${d.color}15` : colors.bg.tertiary,
                        border: `1px solid ${aiDiscipline?.id === d.id ? d.color : colors.border.subtle}`,
                        borderRadius: radius.md, textAlign: 'left', cursor: 'pointer',
                        transition: `all ${transition.fast}`,
                      }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${d.color}22`, color: d.color, flexShrink: 0 }}>
                        <FileText size={12} />
                      </div>
                      <span style={{ fontSize: font.size.sm, color: aiDiscipline?.id === d.id ? colors.text.primary : colors.text.secondary, fontWeight: aiDiscipline?.id === d.id ? font.weight.medium : font.weight.normal }}>
                        {d.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Project description prompt */}
              <TextArea
                label="Describe your project"
                placeholder="e.g. A React 19 + Tauri v2 desktop app for managing AI prompts. Uses TypeScript strict mode, Zustand for state management, inline CSS styles with theme tokens. The app has features for template creation, editing, importing, and GitHub sync."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                style={{ minHeight: 140 }}
              />

              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: spacing.md,
                marginTop: spacing.xl, paddingTop: spacing.lg,
                borderTop: `1px solid ${colors.border.subtle}`,
              }}>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!aiDiscipline || !aiPrompt.trim() || generating}
                  icon={generating ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                >
                  {generating ? 'Generating…' : 'Generate Template'}
                </Button>
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

              {/* AI generated content preview */}
              {isAiMode && aiGeneratedContent && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: spacing.md,
                  padding: spacing.lg, marginBottom: spacing.xl,
                  background: `${colors.accent.purple}0a`,
                  border: `1px solid ${colors.accent.purple}33`,
                  borderRadius: radius.md,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: radius.md,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${colors.accent.purple}22`, color: colors.accent.purple,
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: font.weight.semibold, color: colors.text.primary }}>
                      AI-Generated {aiDiscipline?.title ?? 'Template'}
                    </div>
                    <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                      {aiGeneratedContent.length} characters · Review in editor after creation
                    </div>
                  </div>
                </div>
              )}

              {selectedDiscipline && !isAiMode && (
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
