/**
 * AgentNodeEditor – Edit configuration for a single agent node.
 *
 * Allows editing name, type, model, instruction, tools, temperature,
 * outputKey, sub-agents, and credential reference.
 */

import React, { useState } from 'react';
import {
  Bot, Layers, GitFork, RotateCcw, Wrench, Plus, Trash2,
  FileText, Save,
} from 'lucide-react';
import { colors, spacing, font, radius } from '../../ui/theme';
import { Button, Input, TextArea, Select, Card, Badge, CollapsibleSection, ModelBadge } from '../../ui/components';
import type { AgentNodeConfig, AgentToolConfig, AgentType, ToolParam, ModelCredential } from '../../domain';
import { AVAILABLE_MODELS, BUILTIN_TOOLS, uuid } from '../../domain';

interface AgentNodeEditorProps {
  agent: AgentNodeConfig;
  allAgents: AgentNodeConfig[];
  credentials: ModelCredential[];
  onChange: (updated: AgentNodeConfig) => void;
  onAddSubAgent: (parentId: string) => void;
  onSaveAsTemplate: (agent: AgentNodeConfig) => void;
  onLoadFromTemplate: () => void;
}

const TYPE_OPTIONS = [
  { value: 'llm', label: 'LLM Agent' },
  { value: 'sequential', label: 'Sequential' },
  { value: 'parallel', label: 'Parallel' },
  { value: 'loop', label: 'Loop' },
];

const TYPE_ICONS: Record<AgentType, React.ReactNode> = {
  llm: <Bot size={16} />,
  sequential: <Layers size={16} />,
  parallel: <GitFork size={16} />,
  loop: <RotateCcw size={16} />,
};

export const AgentNodeEditor: React.FC<AgentNodeEditorProps> = ({
  agent,
  allAgents,
  credentials,
  onChange,
  onAddSubAgent,
  onSaveAsTemplate,
  onLoadFromTemplate,
}) => {
  const [showAddTool, setShowAddTool] = useState(false);

  const update = (patch: Partial<AgentNodeConfig>) => {
    onChange({ ...agent, ...patch });
  };

  const isLlm = agent.type === 'llm';

  // Available sub-agents (all except self and agents that already have this as parent)
  const availableSubAgents = allAgents.filter((a) => a.id !== agent.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ color: colors.accent.blue }}>{TYPE_ICONS[agent.type]}</span>
        <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0, flex: 1 }}>
          {agent.name || 'Untitled Agent'}
        </h3>
        {isLlm && agent.model && (
          <ModelBadge modelString={agent.model} provider={AVAILABLE_MODELS.find((m) => m.modelString === agent.model)?.provider} />
        )}
      </div>

      {/* Basic Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
        <Input
          label="Name"
          value={agent.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Agent name"
        />
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={agent.type}
          onChange={(e) => update({ type: e.target.value as AgentType })}
        />
      </div>

      <Input
        label="Description"
        value={agent.description}
        onChange={(e) => update({ description: e.target.value })}
        placeholder="What does this agent do?"
      />

      {/* LLM-specific: Model & Credential */}
      {isLlm && (
        <CollapsibleSection title="Model Configuration" defaultOpen={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <Select
              label="Model"
              options={AVAILABLE_MODELS.map((m) => ({ value: m.modelString, label: `${m.label} (${m.provider})` }))}
              value={agent.model}
              onChange={(e) => update({ model: e.target.value })}
            />
            <Select
              label="Credential"
              options={[
                { value: '', label: '— No credential —' },
                ...credentials.map((c) => ({ value: c.id, label: `${c.label} (${c.provider})` })),
              ]}
              value={agent.modelCredentialId ?? ''}
              onChange={(e) => update({ modelCredentialId: e.target.value || undefined })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <Input
                label="Temperature"
                type="number"
                value={agent.temperature?.toString() ?? ''}
                onChange={(e) => update({ temperature: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.0 – 2.0"
              />
              <Input
                label="Output Key"
                value={agent.outputKey ?? ''}
                onChange={(e) => update({ outputKey: e.target.value || undefined })}
                placeholder="e.g. research_result"
              />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Instruction (LLM agents) */}
      {isLlm && (
        <CollapsibleSection
          title="Instruction"
          defaultOpen={true}
          badge={
            <div style={{ display: 'flex', gap: spacing.xs }}>
              <button
                type="button"
                onClick={onLoadFromTemplate}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: colors.accent.blue, fontSize: font.size.xs,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
                title="Load from template"
              >
                <FileText size={12} /> Load
              </button>
              <button
                type="button"
                onClick={() => onSaveAsTemplate(agent)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: colors.accent.green, fontSize: font.size.xs,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
                title="Save as template"
              >
                <Save size={12} /> Save
              </button>
            </div>
          }
        >
          <TextArea
            value={agent.instruction}
            onChange={(e) => update({ instruction: e.target.value })}
            placeholder="You are a helpful assistant that..."
            rows={8}
            style={{ fontFamily: font.mono, fontSize: font.size.sm }}
          />
        </CollapsibleSection>
      )}

      {/* Tools (LLM agents) */}
      {isLlm && (
        <CollapsibleSection
          title="Tools"
          defaultOpen={agent.tools.length > 0}
          badge={<Badge color={colors.accent.purple}>{agent.tools.length}</Badge>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {/* Existing tools */}
            {agent.tools.map((tool, idx) => (
              <ToolRow
                key={tool.name + idx}
                tool={tool}
                onRemove={() => {
                  const next = [...agent.tools];
                  next.splice(idx, 1);
                  update({ tools: next });
                }}
              />
            ))}

            {/* Add built-in tools */}
            <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap', marginTop: spacing.sm }}>
              {BUILTIN_TOOLS
                .filter((bt) => !agent.tools.some((t) => t.name === bt.name))
                .map((bt) => (
                  <Button
                    key={bt.name}
                    variant="ghost"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => update({ tools: [...agent.tools, bt] })}
                  >
                    {bt.name}
                  </Button>
                ))}
              <Button
                variant="ghost"
                size="sm"
                icon={<Wrench size={14} />}
                onClick={() => setShowAddTool(true)}
              >
                Custom Tool
              </Button>
            </div>

            {/* Custom tool inline form */}
            {showAddTool && (
              <CustomToolForm
                onAdd={(tool) => {
                  update({ tools: [...agent.tools, tool] });
                  setShowAddTool(false);
                }}
                onCancel={() => setShowAddTool(false)}
              />
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Sub-Agents (for workflow types or LLM delegation) */}
      <CollapsibleSection
        title="Sub-Agents"
        defaultOpen={agent.subAgentIds.length > 0}
        badge={<Badge>{agent.subAgentIds.length}</Badge>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {agent.subAgentIds.map((subId) => {
            const sub = allAgents.find((a) => a.id === subId);
            return (
              <div
                key={subId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: `${spacing.xs} ${spacing.md}`,
                  background: colors.bg.tertiary,
                  borderRadius: radius.sm,
                }}
              >
                <span style={{ color: colors.text.muted }}>{sub ? TYPE_ICONS[sub.type] : <Bot size={14} />}</span>
                <span style={{ flex: 1, fontSize: font.size.sm, color: colors.text.primary }}>{sub?.name ?? subId}</span>
                <button
                  type="button"
                  onClick={() => update({ subAgentIds: agent.subAgentIds.filter((id) => id !== subId) })}
                  style={{ background: 'none', border: 'none', color: colors.accent.red, cursor: 'pointer', padding: 2 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {/* Add sub-agent selector */}
          {availableSubAgents.length > 0 && (
            <Select
              label="Link existing agent"
              options={[
                { value: '', label: '— Select agent —' },
                ...availableSubAgents
                  .filter((a) => !agent.subAgentIds.includes(a.id))
                  .map((a) => ({ value: a.id, label: a.name })),
              ]}
              onChange={(e) => {
                if (e.target.value) {
                  update({ subAgentIds: [...agent.subAgentIds, e.target.value] });
                }
              }}
              value=""
            />
          )}

          {/* Create a new sub-agent */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => onAddSubAgent(agent.id)}
          >
            Create New Agent
          </Button>
        </div>
      </CollapsibleSection>

      {/* Loop-specific: Max Iterations */}
      {agent.type === 'loop' && (
        <Input
          label="Max Iterations"
          type="number"
          value={agent.maxIterations?.toString() ?? ''}
          onChange={(e) => update({ maxIterations: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          placeholder="e.g. 5"
        />
      )}
    </div>
  );
};

/* ───── ToolRow ───── */

const ToolRow: React.FC<{ tool: AgentToolConfig; onRemove: () => void }> = ({ tool, onRemove }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.xs} ${spacing.md}`,
      background: colors.bg.tertiary,
      borderRadius: radius.sm,
      border: `1px solid ${colors.border.subtle}`,
    }}
  >
    <Wrench size={14} style={{ color: colors.accent.purple, flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.primary }}>
        {tool.name}
        {tool.isBuiltIn && (
          <span style={{ fontSize: font.size.xs, color: colors.text.muted, marginLeft: spacing.xs }}>(built-in)</span>
        )}
      </div>
      {tool.description && (
        <div style={{ fontSize: font.size.xs, color: colors.text.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tool.description}
        </div>
      )}
    </div>
    <button
      type="button"
      onClick={onRemove}
      style={{ background: 'none', border: 'none', color: colors.accent.red, cursor: 'pointer', padding: 2 }}
    >
      <Trash2 size={14} />
    </button>
  </div>
);

/* ───── CustomToolForm ───── */

const CustomToolForm: React.FC<{ onAdd: (tool: AgentToolConfig) => void; onCancel: () => void }> = ({ onAdd, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [returnType, setReturnType] = useState('string');
  const [params, setParams] = useState<ToolParam[]>([]);

  const addParam = () => {
    setParams([...params, { name: '', type: 'string', description: '', required: true }]);
  };

  const updateParam = (idx: number, patch: Partial<ToolParam>) => {
    const next = [...params];
    next[idx] = { ...next[idx], ...patch };
    setParams(next);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: uuid(),
      name: name.trim(),
      description: description.trim(),
      parameters: params.filter((p) => p.name.trim()),
      returnType,
      functionBody: '// TODO: implement',
      isBuiltIn: false,
    });
  };

  return (
    <Card style={{ padding: spacing.md }}>
      <div style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.primary, marginBottom: spacing.md }}>
        Add Custom Tool
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
          <Input label="Function Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="searchWeb" />
          <Input label="Return Type" value={returnType} onChange={(e) => setReturnType(e.target.value)} placeholder="string" />
        </div>
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this tool do?" />

        {/* Parameters */}
        <div style={{ marginTop: spacing.xs }}>
          <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: spacing.xs }}>Parameters</div>
          {params.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.xs }}>
              <Input style={{ flex: 1 }} value={p.name} onChange={(e) => updateParam(idx, { name: e.target.value })} placeholder="name" />
              <Input style={{ width: 100 }} value={p.type} onChange={(e) => updateParam(idx, { type: e.target.value })} placeholder="type" />
              <button
                type="button"
                onClick={() => setParams(params.filter((_, i) => i !== idx))}
                style={{ background: 'none', border: 'none', color: colors.accent.red, cursor: 'pointer' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={addParam}>Add Param</Button>
        </div>

        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.sm }}>
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>Add Tool</Button>
        </div>
      </div>
    </Card>
  );
};
