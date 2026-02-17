import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, ChevronDown, ChevronRight, CheckSquare, Square, Clock, FileText } from 'lucide-react';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Card, Badge, ConfirmDialog } from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import * as storage from '../../services/storageService';
import type { ArchivedVersion } from '../../services/storageService';

interface HistoryGroup {
  templateId: string;
  templateName: string;
  collectionId: string;
  collectionName: string;
  collectionPath: string;
  versions: ArchivedVersion[];
}

export const HistoryManagement: React.FC = () => {
  const { collections, showToast } = useAppStore();
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set()); // "colPath|templateId|filename"
  const [previewContent, setPreviewContent] = useState<{ version: ArchivedVersion; content: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete-selected' | 'delete-all' | 'restore';
    payload?: { colPath: string; templateId: string; version: ArchivedVersion };
  } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const allGroups: HistoryGroup[] = [];
      for (const col of collections) {
        const histories = await storage.listAllHistories(col.path);
        for (const h of histories) {
          allGroups.push({
            templateId: h.templateId,
            templateName: h.templateName,
            collectionId: col.id,
            collectionName: col.name,
            collectionPath: col.path,
            versions: h.versions,
          });
        }
      }
      setGroups(allGroups);
    } catch (err) {
      showToast(`Failed to load history: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [collections, showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const totalVersions = groups.reduce((sum, g) => sum + g.versions.length, 0);

  const makeKey = (colPath: string, templateId: string, filename: string) =>
    `${colPath}|${templateId}|${filename}`;

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === totalVersions) {
      setSelected(new Set());
    } else {
      const all = new Set<string>();
      groups.forEach((g) =>
        g.versions.forEach((v) => all.add(makeKey(g.collectionPath, g.templateId, v.filename))),
      );
      setSelected(all);
    }
  };

  const toggleSelectGroup = (group: HistoryGroup) => {
    const groupKeys = group.versions.map((v) => makeKey(group.collectionPath, group.templateId, v.filename));
    const allSelected = groupKeys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      groupKeys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      // Group selected by colPath+templateId
      const grouped = new Map<string, { colPath: string; templateId: string; filenames: string[] }>();
      for (const key of selected) {
        const [colPath, templateId, filename] = key.split('|');
        const gKey = `${colPath}|${templateId}`;
        if (!grouped.has(gKey)) grouped.set(gKey, { colPath, templateId, filenames: [] });
        grouped.get(gKey)!.filenames.push(filename);
      }
      for (const { colPath, templateId, filenames } of grouped.values()) {
        await storage.deleteArchivedVersions(colPath, templateId, filenames);
      }
      setSelected(new Set());
      showToast(`Deleted ${selected.size} version(s)`);
      await loadAll();
    } catch (err) {
      showToast(`Delete failed: ${err}`);
    }
    setConfirmAction(null);
  };

  const handleDeleteAllHistory = async () => {
    try {
      for (const g of groups) {
        await storage.deleteAllTemplateHistory(g.collectionPath, g.templateId);
      }
      showToast('All history deleted');
      setSelected(new Set());
      await loadAll();
    } catch (err) {
      showToast(`Delete failed: ${err}`);
    }
    setConfirmAction(null);
  };

  const handleRestore = async (colPath: string, templateId: string, version: ArchivedVersion) => {
    try {
      await storage.restoreArchivedVersion(colPath, templateId, version);
      showToast(`Restored v${version.version}`);
      await loadAll();
    } catch (err) {
      showToast(`Restore failed: ${err}`);
    }
    setConfirmAction(null);
  };

  const handlePreview = async (colPath: string, templateId: string, version: ArchivedVersion) => {
    try {
      const content = await storage.readArchivedVersion(colPath, templateId, version.filename);
      setPreviewContent({ version, content });
    } catch (err) {
      showToast(`Preview failed: ${err}`);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.text.muted }}>
        Loading history…
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <div style={{ color: colors.text.secondary, fontSize: font.size.sm }}>
          {totalVersions} archived version(s) across {groups.length} template(s)
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {selected.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => setConfirmAction({ type: 'delete-selected' })}
            >
              Delete selected ({selected.size})
            </Button>
          )}
          {totalVersions > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => setConfirmAction({ type: 'delete-all' })}
            >
              Delete all history
            </Button>
          )}
        </div>
      </div>

      {/* Select all */}
      {totalVersions > 0 && (
        <div
          onClick={toggleSelectAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.sm} ${spacing.md}`,
            cursor: 'pointer',
            color: colors.text.secondary,
            fontSize: font.size.sm,
            marginBottom: spacing.sm,
          }}
        >
          {selected.size === totalVersions ? (
            <CheckSquare size={16} color={colors.accent.blue} />
          ) : (
            <Square size={16} />
          )}
          Select all
        </div>
      )}

      {totalVersions === 0 && (
        <Card style={{ textAlign: 'center', padding: spacing['2xl'] }}>
          <Clock size={32} color={colors.text.muted} style={{ marginBottom: spacing.md }} />
          <p style={{ color: colors.text.secondary, fontSize: font.size.md }}>
            No version history yet. History is created automatically when you save a template with a new version number.
          </p>
        </Card>
      )}

      {/* Groups */}
      {groups.map((group) => {
        const groupKey = `${group.collectionId}|${group.templateId}`;
        const isExpanded = expandedGroups.has(groupKey);
        const groupKeys = group.versions.map((v) => makeKey(group.collectionPath, group.templateId, v.filename));
        const allGroupSelected = groupKeys.every((k) => selected.has(k));
        const someGroupSelected = groupKeys.some((k) => selected.has(k));

        return (
          <Card key={groupKey} style={{ marginBottom: spacing.md, padding: 0 }}>
            {/* Group header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.md} ${spacing.lg}`,
                cursor: 'pointer',
              }}
            >
              <div
                onClick={(e) => { e.stopPropagation(); toggleSelectGroup(group); }}
                style={{ cursor: 'pointer', display: 'flex' }}
              >
                {allGroupSelected ? (
                  <CheckSquare size={16} color={colors.accent.blue} />
                ) : someGroupSelected ? (
                  <CheckSquare size={16} color={colors.text.muted} />
                ) : (
                  <Square size={16} color={colors.text.muted} />
                )}
              </div>
              <div
                onClick={() => toggleGroup(groupKey)}
                style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1, cursor: 'pointer' }}
              >
                {isExpanded ? <ChevronDown size={16} color={colors.text.muted} /> : <ChevronRight size={16} color={colors.text.muted} />}
                <FileText size={16} color={colors.accent.blue} />
                <span style={{ fontWeight: font.weight.medium, color: colors.text.primary, fontSize: font.size.md }}>
                  {group.templateName}
                </span>
                <Badge>{group.versions.length} version(s)</Badge>
                <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>
                  in {group.collectionName}
                </span>
              </div>
            </div>

            {/* Expanded version list */}
            {isExpanded && (
              <div
                style={{
                  borderTop: `1px solid ${colors.border.subtle}`,
                  padding: `${spacing.sm} ${spacing.lg} ${spacing.lg}`,
                }}
              >
                {group.versions.map((v) => {
                  const vKey = makeKey(group.collectionPath, group.templateId, v.filename);
                  const isSelected = selected.has(vKey);

                  return (
                    <div
                      key={v.filename}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.md,
                        padding: `${spacing.sm} ${spacing.md}`,
                        borderRadius: radius.sm,
                        background: isSelected ? `${colors.accent.blue}11` : 'transparent',
                        transition: `background ${transition.fast}`,
                        marginBottom: spacing.xs,
                      }}
                    >
                      <div
                        onClick={() => toggleSelect(vKey)}
                        style={{ cursor: 'pointer', display: 'flex' }}
                      >
                        {isSelected ? (
                          <CheckSquare size={14} color={colors.accent.blue} />
                        ) : (
                          <Square size={14} color={colors.text.muted} />
                        )}
                      </div>

                      <Badge color={colors.accent.purple}>v{v.version}</Badge>

                      <span style={{ fontSize: font.size.sm, color: colors.text.secondary, flex: 1 }}>
                        {formatDate(v.archivedAt)}
                      </span>

                      <div style={{ display: 'flex', gap: spacing.xs }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(group.collectionPath, group.templateId, v)}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<RotateCcw size={12} />}
                          onClick={() =>
                            setConfirmAction({
                              type: 'restore',
                              payload: { colPath: group.collectionPath, templateId: group.templateId, version: v },
                            })
                          }
                        >
                          Restore
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 size={12} />}
                          aria-label="Delete version"
                          onClick={async () => {
                            await storage.deleteArchivedVersions(group.collectionPath, group.templateId, [v.filename]);
                            showToast(`Deleted v${v.version}`);
                            loadAll();
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {/* Preview overlay */}
      {previewContent && (
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
          onClick={() => setPreviewContent(null)}
        >
          <div
            style={{
              background: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              borderRadius: radius.lg,
              padding: spacing.xl,
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0 }}>
                  Version Preview
                </h3>
                <Badge color={colors.accent.purple}>v{previewContent.version.version}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewContent(null)}>
                Close
              </Button>
            </div>
            <pre
              className="selectable"
              style={{
                flex: 1,
                overflow: 'auto',
                padding: spacing.lg,
                background: colors.bg.tertiary,
                borderRadius: radius.md,
                color: colors.text.primary,
                fontSize: font.size.sm,
                fontFamily: font.mono,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
              }}
            >
              {previewContent.content}
            </pre>
          </div>
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={confirmAction?.type === 'delete-selected'}
        title="Delete Selected Versions"
        message={`Are you sure you want to permanently delete ${selected.size} archived version(s)? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmAction(null)}
        variant="danger"
      />
      <ConfirmDialog
        isOpen={confirmAction?.type === 'delete-all'}
        title="Delete All History"
        message={`Are you sure you want to permanently delete all ${totalVersions} archived version(s) across all templates? This cannot be undone.`}
        confirmText="Delete All"
        onConfirm={handleDeleteAllHistory}
        onCancel={() => setConfirmAction(null)}
        variant="danger"
      />
      <ConfirmDialog
        isOpen={confirmAction?.type === 'restore'}
        title="Restore Version"
        message={`This will replace the current template content with v${confirmAction?.payload?.version?.version ?? ''}. The current version will be archived first. Continue?`}
        confirmText="Restore"
        onConfirm={() => {
          if (confirmAction?.payload) {
            handleRestore(
              confirmAction.payload.colPath,
              confirmAction.payload.templateId,
              confirmAction.payload.version,
            );
          }
        }}
        onCancel={() => setConfirmAction(null)}
        variant="primary"
      />
    </div>
  );
};
