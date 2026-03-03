/**
 * Dialog for creating a new Agent project.
 * Collects project name, description, and initial root agent type.
 */

import React, { useState } from 'react';
import { X, Bot, Layers, GitFork, RotateCcw } from 'lucide-react';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Input, TextArea } from '../../ui/components';
import type { AgentType } from '../../domain';

interface AgentCreateDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onCreate: (name: string, description: string, rootType: AgentType) => void;
}

const AGENT_TYPE_OPTIONS: { type: AgentType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: 'llm', label: 'LLM Agent', description: 'Single agent powered by a language model with tools', icon: <Bot size={20} /> },
  { type: 'sequential', label: 'Sequential Pipeline', description: 'Agents run one after another in order', icon: <Layers size={20} /> },
  { type: 'parallel', label: 'Parallel Fan-Out', description: 'Multiple agents run simultaneously', icon: <GitFork size={20} /> },
  { type: 'loop', label: 'Loop Agent', description: 'Sub-agents repeat until a condition is met', icon: <RotateCcw size={20} /> },
];

export const AgentCreateDialog: React.FC<AgentCreateDialogProps> = ({ isOpen, onCancel, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rootType, setRootType] = useState<AgentType>('sequential');

  if (!isOpen) return null;

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, description.trim(), rootType);
    setName('');
    setDescription('');
    setRootType('sequential');
  };

  return (
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
      onClick={onCancel}
    >
      <div
        style={{
          background: colors.bg.surface,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radius.lg,
          padding: spacing.xl,
          maxWidth: 560,
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
          <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0 }}>
            New Agent Project
          </h2>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: colors.text.muted, cursor: 'pointer', padding: spacing.xs }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Name & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, marginBottom: spacing.xl }}>
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Research Pipeline"
            autoFocus
          />
          <TextArea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this agent workflow do?"
            rows={2}
          />
        </div>

        {/* Root Agent Type */}
        <div style={{ marginBottom: spacing.xl }}>
          <label style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: font.weight.medium, display: 'block', marginBottom: spacing.sm }}>
            Workflow Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
            {AGENT_TYPE_OPTIONS.map((opt) => {
              const isSelected = opt.type === rootType;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setRootType(opt.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: spacing.sm,
                    padding: spacing.md,
                    background: isSelected ? `${colors.accent.blue}11` : colors.bg.tertiary,
                    border: `1px solid ${isSelected ? colors.accent.blue : colors.border.default}`,
                    borderRadius: radius.md,
                    color: colors.text.primary,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: `all ${transition.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = colors.border.strong;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = colors.border.default;
                  }}
                >
                  <span style={{ color: isSelected ? colors.accent.blue : colors.text.muted, flexShrink: 0, marginTop: 2 }}>
                    {opt.icon}
                  </span>
                  <div>
                    <div style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold }}>{opt.label}</div>
                    <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: 2 }}>{opt.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create Project</Button>
        </div>
      </div>
    </div>
  );
};
