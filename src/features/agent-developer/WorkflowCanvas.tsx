/**
 * WorkflowCanvas – Visual representation of the agent workflow.
 *
 * Displays agents as connected cards in a tree/flow layout.
 * Users can select agents to edit, add/remove sub-agents, and
 * reorder the workflow.
 */

import React from 'react';
import { Bot, Layers, GitFork, RotateCcw, Plus } from 'lucide-react';
import { colors, spacing, font, radius, transition, shadow } from '../../ui/theme';
import { Button, ModelBadge } from '../../ui/components';
import type { AgentNodeConfig, AgentType } from '../../domain';
import { AVAILABLE_MODELS } from '../../domain';

interface WorkflowCanvasProps {
  agents: AgentNodeConfig[];
  rootAgentId: string;
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onAddAgent: (parentId: string) => void;
}

const TYPE_ICONS: Record<AgentType, React.ReactNode> = {
  llm: <Bot size={16} />,
  sequential: <Layers size={16} />,
  parallel: <GitFork size={16} />,
  loop: <RotateCcw size={16} />,
};

const TYPE_COLORS: Record<AgentType, string> = {
  llm: colors.accent.blue,
  sequential: colors.accent.green,
  parallel: colors.accent.purple,
  loop: colors.accent.amber,
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  agents,
  rootAgentId,
  selectedAgentId,
  onSelectAgent,
  onAddAgent,
}) => {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const rootAgent = agentMap.get(rootAgentId);

  if (!rootAgent) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.text.muted }}>
        No root agent configured
      </div>
    );
  }

  return (
    <div
      style={{
        padding: spacing.xl,
        overflow: 'auto',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <AgentNode
        agent={rootAgent}
        agentMap={agentMap}
        selectedAgentId={selectedAgentId}
        onSelectAgent={onSelectAgent}
        onAddAgent={onAddAgent}
        depth={0}
      />
    </div>
  );
};

/* ───── AgentNode (recursive) ───── */

interface AgentNodeProps {
  agent: AgentNodeConfig;
  agentMap: Map<string, AgentNodeConfig>;
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onAddAgent: (parentId: string) => void;
  depth: number;
}

const AgentNode: React.FC<AgentNodeProps> = ({
  agent,
  agentMap,
  selectedAgentId,
  onSelectAgent,
  onAddAgent,
  depth,
}) => {
  const isSelected = agent.id === selectedAgentId;
  const color = TYPE_COLORS[agent.type];
  const subAgents = agent.subAgentIds.map((id) => agentMap.get(id)).filter(Boolean) as AgentNodeConfig[];

  const modelInfo = agent.model ? AVAILABLE_MODELS.find((m) => m.modelString === agent.model) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Agent Card */}
      <button
        type="button"
        onClick={() => onSelectAgent(agent.id)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
          padding: spacing.md,
          minWidth: 200,
          maxWidth: 280,
          background: isSelected ? `${color}11` : colors.bg.surface,
          border: `2px solid ${isSelected ? color : colors.border.default}`,
          borderRadius: radius.lg,
          cursor: 'pointer',
          textAlign: 'left',
          transition: `all ${transition.fast}`,
          boxShadow: isSelected ? shadow.glow(color) : shadow.sm,
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.boxShadow = shadow.md;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = colors.border.default;
            e.currentTarget.style.boxShadow = shadow.sm;
          }
        }}
      >
        {/* Agent type & name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ color }}>{TYPE_ICONS[agent.type]}</span>
          <span style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.primary }}>
            {agent.name || 'Untitled'}
          </span>
        </div>

        {/* Description */}
        {agent.description && (
          <div style={{
            fontSize: font.size.xs,
            color: colors.text.muted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {agent.description}
          </div>
        )}

        {/* Model badge */}
        {modelInfo && (
          <div style={{ marginTop: 2 }}>
            <ModelBadge modelString={modelInfo.label} provider={modelInfo.provider} size="sm" />
          </div>
        )}

        {/* Tool count */}
        {agent.tools.length > 0 && (
          <div style={{ fontSize: font.size.xs, color: colors.accent.purple }}>
            {agent.tools.length} tool{agent.tools.length !== 1 ? 's' : ''}
          </div>
        )}
      </button>

      {/* Connector line to children */}
      {(subAgents.length > 0 || depth < 3) && (
        <>
          <div style={{
            width: 2,
            height: 24,
            background: colors.border.default,
          }} />

          {/* Sub-agents */}
          {subAgents.length > 0 && (
            <div style={{
              display: 'flex',
              gap: spacing.lg,
              position: 'relative',
            }}>
              {/* Horizontal connector line */}
              {subAgents.length > 1 && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `calc(100% - 200px)`,
                  height: 2,
                  background: colors.border.default,
                }} />
              )}

              {subAgents.map((sub) => (
                <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 2, height: 20, background: colors.border.default }} />
                  <AgentNode
                    agent={sub}
                    agentMap={agentMap}
                    selectedAgentId={selectedAgentId}
                    onSelectAgent={onSelectAgent}
                    onAddAgent={onAddAgent}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add sub-agent button – always visible */}
          {depth < 3 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onAddAgent(agent.id);
              }}
            >
              Add Agent
            </Button>
          )}
        </>
      )}
    </div>
  );
};
