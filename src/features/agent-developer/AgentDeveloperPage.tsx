/**
 * AgentDeveloperPage – Main entry point for the Agent Developer Mode.
 *
 * Provides project list → editor view switching, with a 3-panel editor:
 *   Left:   Workflow canvas (visual agent tree)
 *   Center: Agent node editor (selected agent config)
 *   Right:  Code preview (generated ADK TypeScript)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, ArrowLeft, Bot, Trash2, Copy,
  Code, LayoutGrid, Save,
} from 'lucide-react';
import { colors, spacing, font, radius } from '../../ui/theme';
import {
  Button, Card, Badge, SectionHeader, EmptyState,
  ConfirmDialog, ModelBadge, TabBar,
} from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import type { AgentProjectMeta, AgentNodeConfig, AgentType } from '../../domain';
import { createLlmAgent, createWorkflowAgent, AVAILABLE_MODELS, uuid } from '../../domain';
import * as agentService from '../../services/agentService';
import { AgentCreateDialog } from './AgentCreateDialog';
import { AgentNodeEditor } from './AgentNodeEditor';
import { WorkflowCanvas } from './WorkflowCanvas';
import { CodePreview } from './CodePreview';

type ViewMode = 'list' | 'editor';
type EditorTab = 'canvas' | 'code';

export const AgentDeveloperPage: React.FC = () => {
  const {
    agentProjects,
    setAgentProjects,
    activeAgentProject,
    setActiveAgentProject,
    modelCredentials,
    showToast,
    collections,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>('canvas');
  const [saving, setSaving] = useState(false);

  /* ── Load project list ── */
  const loadProjects = useCallback(async () => {
    try {
      const projects = await agentService.listProjects();
      setAgentProjects(projects);
    } catch (err) {
      showToast(`Failed to load agent projects: ${err}`);
    }
  }, [setAgentProjects, showToast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /* ── Create project ── */
  const handleCreate = async (name: string, description: string, rootType: AgentType) => {
    try {
      const project = await agentService.createEmptyProject(name, description);

      // Replace root agent with desired type if not LLM
      if (rootType !== 'llm') {
        const rootIdx = project.agents.findIndex((a) => a.id === project.rootAgentId);
        if (rootIdx >= 0) {
          const workflow = createWorkflowAgent(name, uuid(), rootType);
          // Create a default LLM sub-agent
          const subAgent = createLlmAgent('Agent 1', uuid());
          workflow.subAgentIds = [subAgent.id];
          project.agents[rootIdx] = workflow;
          project.rootAgentId = workflow.id;
          project.agents.push(subAgent);
        }
      }

      await agentService.saveProject(project);
      setActiveAgentProject(project);
      setSelectedAgentId(project.rootAgentId);
      setViewMode('editor');
      setShowCreateDialog(false);
      await loadProjects();
      showToast(`Project "${name}" created`);
    } catch (err) {
      showToast(`Create failed: ${err}`);
    }
  };

  /* ── Open project ── */
  const handleOpenProject = async (meta: AgentProjectMeta) => {
    try {
      const project = await agentService.loadProject(meta.id);
      setActiveAgentProject(project);
      setSelectedAgentId(project.rootAgentId);
      setViewMode('editor');
    } catch (err) {
      showToast(`Failed to open project: ${err}`);
    }
  };

  /* ── Save active project ── */
  const handleSave = async () => {
    if (!activeAgentProject) return;
    setSaving(true);
    try {
      await agentService.saveProject(activeAgentProject);
      await loadProjects();
      showToast('Project saved');
    } catch (err) {
      showToast(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete project ── */
  const handleDelete = async (id: string) => {
    try {
      await agentService.deleteProject(id);
      await loadProjects();
      if (activeAgentProject?.id === id) {
        setActiveAgentProject(null);
        setViewMode('list');
      }
      showToast('Project deleted');
    } catch (err) {
      showToast(`Delete failed: ${err}`);
    }
  };

  /* ── Duplicate project ── */
  const handleDuplicate = async (id: string) => {
    try {
      await agentService.duplicateProject(id);
      await loadProjects();
      showToast('Project duplicated');
    } catch (err) {
      showToast(`Duplicate failed: ${err}`);
    }
  };

  /* ── Update agent in active project ── */
  const handleAgentChange = (updated: AgentNodeConfig) => {
    if (!activeAgentProject) return;
    const agents = activeAgentProject.agents.map((a) => a.id === updated.id ? updated : a);
    setActiveAgentProject({ ...activeAgentProject, agents, updatedAt: new Date().toISOString() });
  };

  /* ── Add agent to project ── */
  const handleAddAgent = (parentId: string) => {
    if (!activeAgentProject) return;
    const newAgent = createLlmAgent(`Agent ${activeAgentProject.agents.length + 1}`, uuid());
    const agents = activeAgentProject.agents.map((a) =>
      a.id === parentId
        ? { ...a, subAgentIds: [...a.subAgentIds, newAgent.id] }
        : a,
    );
    setActiveAgentProject({
      ...activeAgentProject,
      agents: [...agents, newAgent],
      updatedAt: new Date().toISOString(),
    });
    setSelectedAgentId(newAgent.id);
  };

  /* ── Delete agent from project ── */
  const handleDeleteAgent = (agentId: string) => {
    if (!activeAgentProject || agentId === activeAgentProject.rootAgentId) return;
    const agents = activeAgentProject.agents
      .filter((a) => a.id !== agentId)
      .map((a) => ({
        ...a,
        subAgentIds: a.subAgentIds.filter((id) => id !== agentId),
      }));
    setActiveAgentProject({ ...activeAgentProject, agents, updatedAt: new Date().toISOString() });
    if (selectedAgentId === agentId) setSelectedAgentId(activeAgentProject.rootAgentId);
  };

  /* ── Template bridge ── */
  const handleSaveAsTemplate = async (agent: AgentNodeConfig) => {
    if (!collections.length) {
      showToast('Create a collection first to save templates');
      return;
    }
    try {
      await agentService.saveInstructionAsTemplate(agent, collections[0].path);
      showToast(`Instruction saved as template in "${collections[0].name}"`);
    } catch (err) {
      showToast(`Save failed: ${err}`);
    }
  };

  const handleLoadFromTemplate = () => {
    showToast('Select a template from the Templates page and use it as instruction');
  };

  /* ── Back to list ── */
  const handleBackToList = () => {
    setViewMode('list');
    setActiveAgentProject(null);
    setSelectedAgentId(null);
  };

  const selectedAgent = activeAgentProject?.agents.find((a) => a.id === selectedAgentId) ?? null;

  /* ═══════════════════ RENDER ═══════════════════ */

  /* ── Editor view ── */
  if (viewMode === 'editor' && activeAgentProject) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: spacing.md }}>
        {/* Editor Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexShrink: 0 }}>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={handleBackToList}>
            Back
          </Button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0 }}>
              {activeAgentProject.name}
            </h2>
            {activeAgentProject.description && (
              <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: 2 }}>
                {activeAgentProject.description}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <TabBar
              tabs={[
                { id: 'canvas', label: 'Builder', icon: <LayoutGrid size={14} /> },
                { id: 'code', label: 'Code', icon: <Code size={14} /> },
              ]}
              activeTab={editorTab}
              onTabChange={(id) => setEditorTab(id as EditorTab)}
            />
            <Button
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Editor Body */}
        {editorTab === 'canvas' ? (
          <div style={{ display: 'flex', flex: 1, gap: spacing.md, overflow: 'hidden' }}>
            {/* Left: Workflow Canvas */}
            <div
              style={{
                flex: 1,
                background: colors.bg.secondary,
                borderRadius: radius.lg,
                border: `1px solid ${colors.border.subtle}`,
                overflow: 'auto',
              }}
            >
              <WorkflowCanvas
                agents={activeAgentProject.agents}
                rootAgentId={activeAgentProject.rootAgentId}
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
                onAddAgent={handleAddAgent}
              />
            </div>

            {/* Right: Agent Editor Panel */}
            {selectedAgent && (
              <div
                style={{
                  width: 420,
                  flexShrink: 0,
                  background: colors.bg.surface,
                  borderRadius: radius.lg,
                  border: `1px solid ${colors.border.subtle}`,
                  overflow: 'auto',
                  padding: spacing.lg,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                  <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>
                    Agent Configuration
                  </div>
                  {selectedAgent.id !== activeAgentProject.rootAgentId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAgent(selectedAgent.id)}
                      style={{ background: 'none', border: 'none', color: colors.accent.red, cursor: 'pointer', padding: 2 }}
                      title="Remove this agent"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <AgentNodeEditor
                  agent={selectedAgent}
                  allAgents={activeAgentProject.agents}
                  credentials={modelCredentials}
                  onChange={handleAgentChange}
                  onAddSubAgent={handleAddAgent}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onLoadFromTemplate={handleLoadFromTemplate}
                />
              </div>
            )}
          </div>
        ) : (
          /* Code Preview */
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodePreview
              project={activeAgentProject}
              credentials={modelCredentials}
              showToast={showToast}
            />
          </div>
        )}
      </div>
    );
  }

  /* ── Project List view ── */
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <SectionHeader
        title="Agent Developer"
        subtitle="Build multi-agent workflows with Google ADK"
        action={
          <Button icon={<Plus size={16} />} onClick={() => setShowCreateDialog(true)}>
            New Project
          </Button>
        }
      />

      {agentProjects.length === 0 ? (
        <EmptyState
          icon={<Bot size={48} />}
          title="No Agent Projects"
          description="Create your first agent workflow to get started. Projects generate ready-to-run ADK TypeScript code."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setShowCreateDialog(true)}>
              Create Project
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing.lg }}>
          {agentProjects.map((meta) => (
            <ProjectCard
              key={meta.id}
              meta={meta}
              onOpen={() => handleOpenProject(meta)}
              onDuplicate={() => handleDuplicate(meta.id)}
              onDelete={() => setDeleteConfirm({ id: meta.id, name: meta.name })}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <AgentCreateDialog
        isOpen={showCreateDialog}
        onCancel={() => setShowCreateDialog(false)}
        onCreate={handleCreate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Agent Project"
        message={`Delete "${deleteConfirm?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm.id);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

/* ───── ProjectCard ───── */

interface ProjectCardProps {
  meta: AgentProjectMeta;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ meta, onOpen, onDuplicate, onDelete }) => (
  <Card interactive onClick={onOpen} style={{ cursor: 'pointer' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Bot size={18} style={{ color: colors.accent.blue }} />
          <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>
            {meta.name}
          </h3>
        </div>
        <Badge color={colors.accent.purple}>{meta.agentCount} agent{meta.agentCount !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Description */}
      {meta.description && (
        <p style={{
          fontSize: font.size.sm,
          color: colors.text.secondary,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {meta.description}
        </p>
      )}

      {/* Models used */}
      {meta.models.length > 0 && (
        <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
          {meta.models.slice(0, 3).map((m) => {
            const info = AVAILABLE_MODELS.find((am) => am.modelString === m);
            return <ModelBadge key={m} modelString={info?.label ?? m} provider={info?.provider} size="sm" />;
          })}
          {meta.models.length > 3 && (
            <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>+{meta.models.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>
          Updated {new Date(meta.updatedAt).toLocaleDateString()}
        </span>
        <div style={{ display: 'flex', gap: spacing.xs }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            style={{ background: 'none', border: 'none', color: colors.text.muted, cursor: 'pointer', padding: 4 }}
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'none', border: 'none', color: colors.accent.red, cursor: 'pointer', padding: 4 }}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  </Card>
);
