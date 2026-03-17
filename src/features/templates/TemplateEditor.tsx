import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, Tag, Download, Copy, Clock, RotateCcw, FolderOpen, Sparkles, RefreshCw, BarChart3, Loader } from 'lucide-react';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { join } from '@tauri-apps/api/path';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Input, Select, Badge, ConfirmDialog, RatingControl, TextArea } from '../../ui/components';
import type { Template, TemplateCategory } from '../../domain';
import { now, suggestNextVersions } from '../../domain';
import type { QualityScore } from '../../domain';
import * as storage from '../../services/storageService';
import type { ArchivedVersion } from '../../services/storageService';
import { generateContent, scoreTemplate } from '../../services/copilotService';
import { decryptToken } from '../../services/cryptoService';
import { disciplines } from '../../data/guidelineContent';
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
  const { showToast, copilotEnabled, copilotModel, copilotByok, copilotCliPath, githubToken } = useAppStore();
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

  // AI dialogs
  const [showImproveDialog, setShowImproveDialog] = useState(false);
  const [improvePrompt, setImprovePrompt] = useState('');
  const [improvedContent, setImprovedContent] = useState('');
  const [improving, setImproving] = useState(false);

  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertTargetId, setConvertTargetId] = useState('');
  const [convertedContent, setConvertedContent] = useState('');
  const [converting, setConverting] = useState(false);

  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [scoring, setScoring] = useState(false);

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

  const handleRevealInExplorer = async () => {
    try {
      const fullPath = await join(collectionPath, template.filename);
      await revealItemInDir(fullPath);
    } catch (err) {
      showToast(`Could not open explorer: ${err}`);
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

  /** Find the discipline matching the current template's category/filename */
  const currentDiscipline = disciplines.find((d) =>
    d.defaultFilename === template.filename || d.category === template.category,
  ) ?? disciplines[0];

  /** Build copilot config object */
  const copilotConfig = { enabled: true, cliPath: copilotCliPath, model: copilotModel, byok: copilotByok };

  /** Decrypt BYOK key if needed */
  const getByokKey = async (): Promise<string | null> => {
    if (copilotByok?.apiKeyEncrypted) return decryptToken(copilotByok.apiKeyEncrypted);
    return null;
  };

  /* ── AI: Improve ── */
  const handleImprove = async () => {
    setImproving(true);
    try {
      const guide = currentDiscipline.guide;
      const systemMessage = `You are an expert at improving AI agent instruction files.
Analyse the template below and improve it based on these quality criteria:

Best Practices:
- ${guide.bestPractices.join('\n- ')}

Key Points to cover:
- ${guide.keyPoints.join('\n- ')}

Structure:
${guide.structureDescription}

${improvePrompt.trim() ? `Additional user instructions: ${improvePrompt}` : 'Apply general quality improvements: completeness, clarity, specificity, best practices, and formatting consistency.'}

Return ONLY the complete improved file content, no explanations or code fences.`;

      const byokKey = await getByokKey();
      const result = await generateContent(
        { systemMessage, prompt: content },
        copilotConfig,
        githubToken,
        byokKey,
      );
      setImprovedContent(result.content);
    } catch (err) {
      showToast(`Improve failed: ${err}`);
    } finally {
      setImproving(false);
    }
  };

  const handleAcceptImproved = () => {
    setContent(improvedContent);
    setShowImproveDialog(false);
    setImprovedContent('');
    setImprovePrompt('');
    showToast('Improved content applied — save to persist');
  };

  /* ── AI: Convert Format ── */
  const handleConvert = async () => {
    const targetDiscipline = disciplines.find((d) => d.id === convertTargetId);
    if (!targetDiscipline) return;
    setConverting(true);
    try {
      const systemMessage = `You are an expert at converting AI agent instruction files between formats.

Source format: ${currentDiscipline.title}
Target format: ${targetDiscipline.title}

Target structure reference:
${targetDiscipline.scaffoldContent}

Target format description:
${targetDiscipline.guide.structureDescription}

Target best practices:
- ${targetDiscipline.guide.bestPractices.join('\n- ')}

Convert the source template to the target format. Preserve ALL content semantics and information. Adapt the structure, syntax, and conventions to match the target format.

Return ONLY the complete converted file content, no explanations or code fences.`;

      const byokKey = await getByokKey();
      const result = await generateContent(
        { systemMessage, prompt: content },
        copilotConfig,
        githubToken,
        byokKey,
      );
      setConvertedContent(result.content);
    } catch (err) {
      showToast(`Conversion failed: ${err}`);
    } finally {
      setConverting(false);
    }
  };

  const handleAcceptConverted = async () => {
    const targetDiscipline = disciplines.find((d) => d.id === convertTargetId);
    if (!targetDiscipline) return;
    try {
      const tpl = await storage.createTemplate(
        collectionPath,
        `${template.name} (${targetDiscipline.title})`,
        targetDiscipline.category,
        convertedContent,
        targetDiscipline.defaultFilename,
      );
      showToast(`Converted template created: ${tpl.name}`);
      setShowConvertDialog(false);
      setConvertedContent('');
      setConvertTargetId('');
      onSave();
    } catch (err) {
      showToast(`Save converted template failed: ${err}`);
    }
  };

  /* ── AI: Quality Score ── */
  const handleScore = async () => {
    setScoring(true);
    try {
      const guide = currentDiscipline.guide;
      const referenceGuide = `Format: ${currentDiscipline.title}\n\nBest Practices:\n- ${guide.bestPractices.join('\n- ')}\n\nKey Points:\n- ${guide.keyPoints.join('\n- ')}\n\nStructure:\n${guide.structureDescription}`;

      const byokKey = await getByokKey();
      const result = await scoreTemplate(content, referenceGuide, copilotConfig, githubToken, byokKey);
      setQualityScore(result);
    } catch (err) {
      showToast(`Scoring failed: ${err}`);
    } finally {
      setScoring(false);
    }
  };

  const handleApplyScore = () => {
    if (qualityScore) {
      setRating(qualityScore.overall);
      showToast(`Rating set to ${qualityScore.overall}/10 — save to persist`);
    }
    setShowScoreDialog(false);
    setQualityScore(null);
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
          <Button variant="ghost" onClick={handleRevealInExplorer} icon={<FolderOpen size={16} />}>
            Show in Explorer
          </Button>
          <Button variant="ghost" onClick={() => { setCopyName(`${name} (Copy)`); setShowCopyDialog(true); }} icon={<Copy size={16} />}>
            Save as Copy
          </Button>
          {/* AI buttons */}
          <Button
            variant="ghost"
            onClick={() => setShowImproveDialog(true)}
            disabled={!copilotEnabled}
            icon={<Sparkles size={16} />}
            title={copilotEnabled ? 'Improve with AI' : 'Enable Copilot in Settings → AI / Copilot'}
          >
            Improve
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowConvertDialog(true)}
            disabled={!copilotEnabled}
            icon={<RefreshCw size={16} />}
            title={copilotEnabled ? 'Convert to another format' : 'Enable Copilot in Settings → AI / Copilot'}
          >
            Convert
          </Button>
          <Button
            variant="ghost"
            onClick={() => { setShowScoreDialog(true); handleScore(); }}
            disabled={!copilotEnabled}
            icon={<BarChart3 size={16} />}
            title={copilotEnabled ? 'AI quality analysis' : 'Enable Copilot in Settings → AI / Copilot'}
          >
            Score
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

      {/* ── AI: Improve Dialog ── */}
      {showImproveDialog && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => { if (!improving) setShowImproveDialog(false); }}
        >
          <div
            style={{ background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.lg, padding: spacing.xl, maxWidth: 640, width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0, marginBottom: spacing.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <Sparkles size={20} color={colors.accent.purple} />
              Improve with AI
            </h3>

            {!improvedContent && (
              <>
                <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginBottom: spacing.lg }}>
                  AI will analyse your template against best practices for <strong>{currentDiscipline.title}</strong> and generate an improved version.
                </p>
                <TextArea
                  label="Improvement focus (optional)"
                  placeholder="e.g. Make the persona section more specific, add missing error handling rules, improve code examples..."
                  value={improvePrompt}
                  onChange={(e) => setImprovePrompt(e.target.value)}
                  style={{ minHeight: 80 }}
                />
                <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', marginTop: spacing.xl }}>
                  <Button variant="secondary" onClick={() => setShowImproveDialog(false)} disabled={improving}>Cancel</Button>
                  <Button
                    onClick={handleImprove}
                    disabled={improving}
                    icon={improving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                  >
                    {improving ? 'Improving…' : 'Improve'}
                  </Button>
                </div>
              </>
            )}

            {improvedContent && (
              <>
                <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginBottom: spacing.sm }}>
                  Preview of improved content ({improvedContent.length} characters):
                </div>
                <textarea
                  readOnly
                  value={improvedContent}
                  style={{
                    width: '100%', minHeight: 300, padding: spacing.md,
                    background: colors.bg.tertiary, border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.md, color: colors.text.primary,
                    fontSize: font.size.sm, fontFamily: font.mono, lineHeight: 1.5, resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', marginTop: spacing.xl }}>
                  <Button variant="secondary" onClick={() => { setImprovedContent(''); }}>
                    Regenerate
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowImproveDialog(false); setImprovedContent(''); setImprovePrompt(''); }}>
                    Reject
                  </Button>
                  <Button onClick={handleAcceptImproved} icon={<Sparkles size={16} />}>
                    Accept Changes
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── AI: Convert Dialog ── */}
      {showConvertDialog && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => { if (!converting) setShowConvertDialog(false); }}
        >
          <div
            style={{ background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.lg, padding: spacing.xl, maxWidth: 640, width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0, marginBottom: spacing.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <RefreshCw size={20} color={colors.accent.blue} />
              Convert Format
            </h3>

            {!convertedContent && (
              <>
                <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginBottom: spacing.lg }}>
                  Convert this <strong>{currentDiscipline.title}</strong> template to another agent instruction format. A new template will be created — the original remains unchanged.
                </p>
                <Select
                  label="Target Format"
                  options={disciplines.filter((d) => d.id !== currentDiscipline.id).map((d) => ({ value: d.id, label: d.title }))}
                  value={convertTargetId}
                  onChange={(e) => setConvertTargetId(e.target.value)}
                />
                <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', marginTop: spacing.xl }}>
                  <Button variant="secondary" onClick={() => setShowConvertDialog(false)} disabled={converting}>Cancel</Button>
                  <Button
                    onClick={handleConvert}
                    disabled={!convertTargetId || converting}
                    icon={converting ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                  >
                    {converting ? 'Converting…' : 'Convert'}
                  </Button>
                </div>
              </>
            )}

            {convertedContent && (
              <>
                <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginBottom: spacing.sm }}>
                  Converted to {disciplines.find((d) => d.id === convertTargetId)?.title ?? 'target format'} ({convertedContent.length} characters):
                </div>
                <textarea
                  readOnly
                  value={convertedContent}
                  style={{
                    width: '100%', minHeight: 300, padding: spacing.md,
                    background: colors.bg.tertiary, border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.md, color: colors.text.primary,
                    fontSize: font.size.sm, fontFamily: font.mono, lineHeight: 1.5, resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', marginTop: spacing.xl }}>
                  <Button variant="ghost" onClick={() => { setShowConvertDialog(false); setConvertedContent(''); setConvertTargetId(''); }}>
                    Discard
                  </Button>
                  <Button onClick={handleAcceptConverted} icon={<RefreshCw size={16} />}>
                    Save as New Template
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── AI: Quality Score Dialog ── */}
      {showScoreDialog && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => { if (!scoring) { setShowScoreDialog(false); setQualityScore(null); } }}
        >
          <div
            style={{ background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.lg, padding: spacing.xl, maxWidth: 560, width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <BarChart3 size={20} color={colors.accent.green} />
              AI Quality Analysis
            </h3>

            {scoring && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.lg, padding: spacing.xl }}>
                <Loader size={32} color={colors.accent.blue} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: font.size.md, color: colors.text.secondary }}>Analysing template quality…</p>
              </div>
            )}

            {!scoring && qualityScore && (
              <>
                {/* Overall score */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.lg,
                  padding: spacing.xl, marginBottom: spacing.xl,
                  background: colors.bg.tertiary, borderRadius: radius.lg,
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: radius.full,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${qualityScore.overall >= 7 ? colors.accent.green : qualityScore.overall >= 4 ? colors.accent.amber : colors.accent.red}22`,
                    border: `3px solid ${qualityScore.overall >= 7 ? colors.accent.green : qualityScore.overall >= 4 ? colors.accent.amber : colors.accent.red}`,
                  }}>
                    <span style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary }}>
                      {qualityScore.overall}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: font.weight.semibold, color: colors.text.primary, fontSize: font.size.lg }}>
                      Overall Score
                    </div>
                    <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                      out of 10 · based on {currentDiscipline.title} standards
                    </div>
                  </div>
                </div>

                {/* Dimension scores */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.xl }}>
                  {([
                    { label: 'Completeness', value: qualityScore.completeness },
                    { label: 'Clarity', value: qualityScore.clarity },
                    { label: 'Specificity', value: qualityScore.specificity },
                    { label: 'Best Practices', value: qualityScore.bestPractices },
                    { label: 'Structure', value: qualityScore.structure },
                  ] as const).map((dim) => (
                    <div key={dim.label} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: radius.md,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: colors.bg.tertiary, fontWeight: font.weight.semibold,
                        color: dim.value >= 7 ? colors.accent.green : dim.value >= 4 ? colors.accent.amber : colors.accent.red,
                        fontSize: font.size.sm,
                      }}>
                        {dim.value}
                      </div>
                      <span style={{ fontSize: font.size.sm, color: colors.text.secondary }}>{dim.label}</span>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                {qualityScore.suggestions.length > 0 && (
                  <div style={{ marginBottom: spacing.xl }}>
                    <div style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing.sm }}>
                      Improvement Suggestions
                    </div>
                    <ul style={{ margin: 0, paddingLeft: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                      {qualityScore.suggestions.map((s, i) => (
                        <li key={i} style={{ fontSize: font.size.sm, color: colors.text.secondary, lineHeight: 1.5 }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => { setShowScoreDialog(false); setQualityScore(null); }}>
                    Close
                  </Button>
                  <Button onClick={handleApplyScore} icon={<BarChart3 size={16} />}>
                    Apply Rating ({qualityScore.overall}/10)
                  </Button>
                </div>
              </>
            )}
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
