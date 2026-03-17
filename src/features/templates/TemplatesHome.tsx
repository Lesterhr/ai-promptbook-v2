import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  FolderOpen,
  Upload,
  RefreshCw,
  Download,
  Trash2,
  FileText,
  LayoutGrid,
  List,
  Sparkles,
  ArrowLeft,
  MoreVertical,
} from 'lucide-react';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Card, Badge, Input, SectionHeader, EmptyState, Select, ConfirmDialog, RatingControl, TokenBar } from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import type { TemplateMetadata } from '../../domain';
import { estimateTokensFromCharCount } from '../../domain';
import * as storage from '../../services/storageService';
import * as syncSvc from '../../services/syncService';
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';
import { TemplateImportDialog } from './TemplateImportDialog';
import { TemplateCreateDialog } from './TemplateCreateDialog';
import { categoryInfoMap } from '../../data/guidelineContent';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'list' | 'editor' | 'preview';
type ListMode = 'flat' | 'hub';

export const TemplatesHome: React.FC = () => {
  const {
    collections,
    setCollections,
    activeCollectionId,
    setActiveCollectionId,
    templates,
    setTemplates,
    activeTemplate,
    setActiveTemplate,
    updateTemplateMetadata,
    githubToken,
    showToast,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [listMode, setListMode] = useState<ListMode>('hub');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ templateId: string; templateName: string } | null>(null);

  const navigate = useNavigate();
  const activeCollection = collections.find((c) => c.id === activeCollectionId) ?? null;

  /* ─── Load data ─── */

  const loadCollections = useCallback(async () => {
    try {
      const cols = await storage.listCollections();
      setCollections(cols);
      if (!activeCollectionId && cols.length > 0) {
        setActiveCollectionId(cols[0].id);
      }
    } catch (err) {
      showToast(`Failed to load collections: ${err}`);
    }
  }, [setCollections, setActiveCollectionId, activeCollectionId, showToast]);

  const loadTemplates = useCallback(async () => {
    if (!activeCollection) {
      setTemplates([]);
      return;
    }
    try {
      const tpls = await storage.listTemplates(activeCollection.path);
      setTemplates(tpls);
    } catch (err) {
      showToast(`Failed to load templates: ${err}`);
    }
  }, [activeCollection, setTemplates, showToast]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /* ─── Actions ─── */

  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    try {
      const col = await storage.createCollection(newColName.trim(), newColDesc.trim());
      setShowNewCollection(false);
      setNewColName('');
      setNewColDesc('');
      await loadCollections();
      setActiveCollectionId(col.id);
      showToast(`Collection "${col.name}" created`);
    } catch (err) {
      showToast(`Error: ${err}`);
    }
  };

  const handleNewTemplate = () => {
    setShowCreateDialog(true);
  };

  const handleTemplateCreated = async (tpl: import('../../domain').Template) => {
    setShowCreateDialog(false);
    await loadTemplates();
    await loadCollections();
    setActiveTemplate(tpl);
    setViewMode('editor');
  };

  const handleRateTemplate = async (templateId: string, rating: number | null) => {
    if (!activeCollection) return;
    try {
      const updated = await storage.patchTemplateMetadata(activeCollection.path, templateId, { rating });
      updateTemplateMetadata(updated.id, { rating: updated.rating });
    } catch (err) {
      showToast(`Rating failed: ${err}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!activeCollection) return;
    const template = templates.find(t => t.id === id);
    if (!template) return;
    setDeleteConfirm({ id, name: template.name });
  };

  const confirmDeleteTemplate = async () => {
    if (!activeCollection || !deleteConfirm) return;
    try {
      await storage.deleteTemplate(activeCollection.path, deleteConfirm.id);
      await loadTemplates();
      await loadCollections();
      if (activeTemplate?.id === deleteConfirm.id) {
        setActiveTemplate(null);
        setViewMode('list');
      }
      showToast('Template deleted');
    } catch (err) {
      showToast(`Error: ${err}`);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleMoveTemplate = async (targetCollectionId: string) => {
    if (!activeCollection || !moveTarget) return;
    const targetCol = collections.find((c) => c.id === targetCollectionId);
    if (!targetCol) return;
    try {
      await storage.moveTemplate(activeCollection.path, targetCol.path, moveTarget.templateId);
      await loadTemplates();
      await loadCollections();
      showToast(`Moved "${moveTarget.templateName}" to "${targetCol.name}"`);
    } catch (err) {
      showToast(`Move failed: ${err}`);
    } finally {
      setMoveTarget(null);
    }
  };

  const handleOpenTemplate = async (meta: TemplateMetadata) => {
    if (!activeCollection) return;
    const tpl = await storage.readTemplate(activeCollection.path, meta);
    setActiveTemplate(tpl);
    setViewMode('preview');
  };

  const handleSync = async (direction: 'push' | 'pull') => {
    if (!activeCollection || !githubToken) {
      showToast('Configure a GitHub token in Settings first');
      return;
    }
    setSyncing(true);
    try {
      if (direction === 'push') {
        await syncSvc.pushCollection(activeCollection, githubToken);
        showToast('Pushed successfully');
      } else {
        await syncSvc.pullCollection(activeCollection, githubToken);
        await loadTemplates();
        showToast('Pulled successfully');
      }
    } catch (err) {
      showToast(`Sync failed: ${err}`);
    } finally {
      setSyncing(false);
    }
  };

  /* ─── Filtered templates ─── */

  const filtered = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  /* ─── Render inner view ─── */

  if (viewMode === 'editor' && activeTemplate && activeCollection) {
    return (
      <TemplateEditor
        template={activeTemplate}
        collectionPath={activeCollection.path}
        onSave={async () => {
          await loadTemplates();
          setViewMode('list');
          setActiveTemplate(null);
        }}
        onCancel={() => {
          setViewMode('list');
          setActiveTemplate(null);
        }}
      />
    );
  }

  if (viewMode === 'preview' && activeTemplate) {
    return (
      <TemplatePreview
        template={activeTemplate}
        collectionPath={activeCollection?.path ?? ''}
        onEdit={() => setViewMode('editor')}
        onBack={() => {
          setViewMode('list');
          setActiveTemplate(null);
        }}
        onRate={(rating) => handleRateTemplate(activeTemplate.id, rating)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <SectionHeader
        title="Templates"
        subtitle="Manage your agent instructions, prompts, and resources"
        action={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button variant="ghost" size="sm" icon={<Upload size={16} />} onClick={() => setShowImportDialog(true)}>
              Import
            </Button>
            <Button size="sm" icon={<Plus size={16} />} onClick={handleNewTemplate}>
              New Template
            </Button>
          </div>
        }
      />

      {/* Collection selector */}
      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          alignItems: 'center',
          marginBottom: spacing.xl,
          flexWrap: 'wrap',
        }}
      >
        <FolderOpen size={18} color={colors.text.muted} />
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => setActiveCollectionId(col.id)}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: radius.full,
              fontSize: font.size.sm,
              fontWeight: col.id === activeCollectionId ? font.weight.semibold : font.weight.normal,
              background: col.id === activeCollectionId ? 'rgba(35, 39, 56, 0.85)' : 'rgba(35, 39, 56, 0.85)',
              color: col.id === activeCollectionId ? colors.accent.blue : colors.text.secondary,
              border: `1px solid ${col.id === activeCollectionId ? colors.accent.blue : colors.border.default}`,
              transition: `all ${transition.fast}`,
            }}
          >
            {col.name} ({col.templateCount})
          </button>
        ))}
        <button
          onClick={() => setShowNewCollection(true)}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: radius.full,
            fontSize: font.size.sm,
            color: colors.text.muted,
            background: 'rgba(35, 39, 56, 0.85)',
            border: `1px dashed ${colors.border.default}`,
          }}
        >
          + New
        </button>

        {/* Sync buttons */}
        {activeCollection?.remote && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: spacing.sm }}>
            <Button
              variant="ghost"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => handleSync('pull')}
              disabled={syncing}
            >
              Pull
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={14} className={syncing ? 'spinning' : ''} />}
              onClick={() => handleSync('push')}
              disabled={syncing}
            >
              Push
            </Button>
          </div>
        )}
      </div>

      {/* New collection inline form */}
      {showNewCollection && (
        <Card style={{ marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-end' }}>
            <Input
              label="Collection Name"
              placeholder="e.g. Agent Instructions"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              style={{ flex: 1 }}
            />
            <Input
              label="Description"
              placeholder="Optional description"
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              style={{ flex: 2 }}
            />
            <Button size="sm" onClick={handleCreateCollection}>
              Create
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNewCollection(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search & filter bar */}
      <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.lg, alignItems: 'flex-end' }}>
        {(categoryFilter !== 'all' || listMode === 'flat') && (
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={() => { setCategoryFilter('all'); setListMode('hub'); setSearch(''); }}
          >
            Back
          </Button>
        )}
        <div style={{ flex: 1 }}>
          <Input
            placeholder="Search templates…"
            icon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Categories' },
            { value: 'instruction', label: 'Instructions' },
            { value: 'system-prompt', label: 'System Prompts' },
            { value: 'readme', label: 'READMEs' },
            { value: 'workflow', label: 'Workflows' },
            { value: 'snippet', label: 'Snippets' },
            { value: 'other', label: 'Other' },
          ]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ width: 180 }}
        />
        {/* View toggle */}
        <div style={{ display: 'flex', border: `1px solid ${colors.border.default}`, borderRadius: radius.md, overflow: 'hidden' }}>
          <button
            onClick={() => setListMode('hub')}
            title="Category view"
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              background: listMode === 'hub' ? `${colors.accent.blue}22` : colors.bg.tertiary,
              color: listMode === 'hub' ? colors.accent.blue : colors.text.muted,
              display: 'flex', alignItems: 'center',
              borderRight: `1px solid ${colors.border.default}`,
            }}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setListMode('flat')}
            title="List view"
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              background: listMode === 'flat' ? `${colors.accent.blue}22` : colors.bg.tertiary,
              color: listMode === 'flat' ? colors.accent.blue : colors.text.muted,
              display: 'flex', alignItems: 'center',
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Template list / hub */}
      {!activeCollection ? (
        <EmptyState
          icon={<FolderOpen size={48} />}
          title="No Collection Selected"
          description="Create a collection to start organising your templates."
          action={<Button onClick={() => setShowNewCollection(true)} icon={<Plus size={16} />}>Create Collection</Button>}
        />
      ) : listMode === 'hub' && categoryFilter === 'all' && !search ? (
        /* ── Category Hub View ── */
        <div>
          {/* Category cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg, marginBottom: spacing['2xl'] }}>
            {Object.values(categoryInfoMap).map((cat) => {
              const count = templates.filter((t) => t.category === cat.id).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => { setCategoryFilter(cat.id); setListMode('flat'); }}
                  style={{
                    background: 'rgba(35, 39, 56, 0.72)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: radius.lg,
                    padding: spacing.xl,
                    cursor: 'pointer',
                    transition: `all ${transition.fast}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border.subtle; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: radius.md,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${cat.color}22`, color: cat.color,
                    }}>
                      {cat.id === 'system-prompt' ? <Sparkles size={20} /> : <FileText size={20} />}
                    </div>
                    <span style={{
                      fontSize: font.size['2xl'], fontWeight: font.weight.bold,
                      color: count > 0 ? cat.color : colors.text.muted,
                    }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: 4 }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: font.size.xs, color: colors.text.muted, lineHeight: 1.4 }}>
                    {cat.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
                    <span
                      onClick={(e) => { e.stopPropagation(); navigate('/wiki'); }}
                      style={{ fontSize: font.size.xs, color: colors.accent.blue, cursor: 'pointer' }}
                    >
                      View Guide →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent templates below the hub */}
          {templates.length > 0 && (
            <>
              <h3 style={{
                fontSize: font.size.lg, fontWeight: font.weight.semibold,
                color: colors.text.primary, marginBottom: spacing.md,
              }}>
                All Templates ({templates.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {templates.map((tpl) => (
                  <TemplateRow key={tpl.id} tpl={tpl} onOpen={handleOpenTemplate} onDelete={handleDeleteTemplate} onMove={(id, name) => setMoveTarget({ templateId: id, templateName: name })} onRate={handleRateTemplate} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No Templates"
          description={search ? 'No templates match your search.' : 'Create or import your first template.'}
          action={
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button onClick={handleNewTemplate} icon={<Plus size={16} />}>
                New Template
              </Button>
              <Button variant="secondary" onClick={() => setShowImportDialog(true)} icon={<Upload size={16} />}>
                Import
              </Button>
            </div>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {filtered.map((tpl) => (
            <TemplateRow key={tpl.id} tpl={tpl} onOpen={handleOpenTemplate} onDelete={handleDeleteTemplate} onMove={(id, name) => setMoveTarget({ templateId: id, templateName: name })} onRate={handleRateTemplate} />
          ))}
        </div>
      )}

      {/* Import dialog */}
      {showImportDialog && activeCollection && (
        <TemplateImportDialog
          collectionPath={activeCollection.path}
          onClose={() => setShowImportDialog(false)}
          onImported={async () => {
            await loadTemplates();
            await loadCollections();
          }}
        />
      )}

      {/* Create dialog */}
      {showCreateDialog && (
        <TemplateCreateDialog
          onCreated={handleTemplateCreated}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTemplate}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Move to collection dialog */}
      {moveTarget && (
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
          onClick={() => setMoveTarget(null)}
        >
          <div
            style={{
              background: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              borderRadius: radius.lg,
              padding: spacing.xl,
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0, marginBottom: spacing.sm }}>
              Move Template
            </h3>
            <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginBottom: spacing.lg }}>
              Move &ldquo;{moveTarget.templateName}&rdquo; to:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {collections
                .filter((c) => c.id !== activeCollectionId)
                .map((col) => (
                  <button
                    key={col.id}
                    onClick={() => handleMoveTemplate(col.id)}
                    style={{
                      padding: `${spacing.sm} ${spacing.lg}`,
                      background: 'rgba(35, 39, 56, 0.85)',
                      border: `1px solid ${colors.border.default}`,
                      borderRadius: radius.md,
                      color: colors.text.primary,
                      fontSize: font.size.md,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: `all ${transition.fast}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent.blue; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border.default; }}
                  >
                    <FolderOpen size={16} color={colors.accent.blue} />
                    {col.name}
                  </button>
                ))}
              {collections.filter((c) => c.id !== activeCollectionId).length === 0 && (
                <p style={{ fontSize: font.size.sm, color: colors.text.muted, textAlign: 'center', padding: spacing.lg }}>
                  No other collections available. Create a new collection first.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing.lg }}>
              <Button variant="secondary" onClick={() => setMoveTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Extracted TemplateRow ── */

const TemplateRow: React.FC<{
  tpl: TemplateMetadata;
  onOpen: (tpl: TemplateMetadata) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, name: string) => void;
  onRate: (id: string, rating: number | null) => void;
}> = ({ tpl, onOpen, onDelete, onMove, onRate }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    // Use capture phase so we get the event before anything else
    document.addEventListener('mousedown', close, true);
    return () => document.removeEventListener('mousedown', close, true);
  }, [menuOpen]);

  return (
    <Card
      interactive
      onClick={() => onOpen(tpl)}
      style={{ padding: `${spacing.md} ${spacing.xl}`, position: 'relative', zIndex: menuOpen ? 100 : 'auto', overflow: menuOpen ? 'visible' : undefined }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 0 }}>
          <FileText size={18} color={colors.accent.blue} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: font.weight.medium,
                color: colors.text.primary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tpl.name}
            </div>
            {tpl.description && (
              <div
                style={{
                  fontSize: font.size.sm,
                  color: colors.text.muted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tpl.description}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexShrink: 0 }}>
          <Badge>{tpl.category}</Badge>
          <span style={{
            fontSize: font.size.xs,
            color: colors.text.muted,
            background: 'rgba(35, 39, 56, 0.85)',
            padding: `1px ${spacing.sm}`,
            borderRadius: radius.full,
          }}>v{tpl.version}</span>
          <span style={{
            fontSize: font.size.xs,
            color: colors.text.muted,
            background: 'rgba(35, 39, 56, 0.85)',
            padding: `1px ${spacing.sm}`,
            borderRadius: radius.full,
          }}>
            {tpl.useCount} uses
          </span>
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
            <RatingControl size="sm" value={tpl.rating} onChange={(r) => onRate(tpl.id, r)} />
          </div>
          {tpl.charCount != null && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
              <TokenBar tokens={estimateTokensFromCharCount(tpl.charCount)} size="sm" />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tpl.id);
            }}
            style={{
              color: colors.text.muted,
              padding: spacing.xs,
              borderRadius: radius.sm,
              display: 'flex',
            }}
            title="Delete template"
          >
            <Trash2 size={14} />
          </button>
          <div ref={menuRef} style={{ position: 'relative', zIndex: menuOpen ? 1001 : 'auto' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              style={{
                color: colors.text.muted,
                padding: spacing.xs,
                borderRadius: radius.sm,
                display: 'flex',
              }}
              title="More actions"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: spacing.xs,
                  background: colors.bg.surface,
                  border: `1px solid ${colors.border.default}`,
                    borderRadius: radius.md,
                    boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                    zIndex: 1001,
                    minWidth: 200,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onMove(tpl.id, tpl.name);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      width: '100%',
                      padding: `${spacing.sm} ${spacing.lg}`,
                      fontSize: font.size.sm,
                      color: colors.text.secondary,
                      textAlign: 'left',
                      transition: `background ${transition.fast}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg.hover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FolderOpen size={14} />
                    Move to Collection…
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
