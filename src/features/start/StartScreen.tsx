import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  GitBranch,
  Clock,
  ArrowRight,
  FolderOpen,
  TrendingUp,
} from 'lucide-react';
import { colors, spacing, font } from '../../ui/theme';
import { Card, SectionHeader, Badge } from '../../ui/components';
import { useAppStore } from '../../state/appStore';
import type { TemplateMetadata } from '../../domain';


/* ─── Quick-action tiles ─── */

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Templates',
    description: 'Create, edit & manage agent instructions and prompts',
    icon: <FileText size={28} />,
    to: '/templates',
    gradient: 'rgba(47, 51, 71, 0.72)',
  },
  {
    label: 'Repo Creator',
    description: 'Set up a new GitHub repository with templates',
    icon: <GitBranch size={28} />,
    to: '/repo-creator',
    gradient: 'rgba(47, 51, 71, 0.72)',
  },
];

export const StartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { collections, templates } = useAppStore();
  const [recentTemplates, setRecentTemplates] = useState<TemplateMetadata[]>([]);

  useEffect(() => {
    // Sort by lastUsedAt or updatedAt descending, take top 5
    const sorted = [...templates]
      .sort((a, b) => {
        const da = a.lastUsedAt ?? a.updatedAt;
        const db = b.lastUsedAt ?? b.updatedAt;
        return db.localeCompare(da);
      })
      .slice(0, 5);
    setRecentTemplates(sorted);
  }, [templates]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: spacing['3xl'] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
          <span style={{ fontSize: '2rem', color: colors.accent.blue, lineHeight: 1 }}>本</span>
          <h1
            style={{
              fontSize: font.size['3xl'],
              fontWeight: 700,
              color: colors.text.primary,
              margin: 0,
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: '0.04em',
            }}
          >
            AI Promptbook
          </h1>
        </div>
        <p style={{ fontSize: font.size.lg, color: colors.text.secondary, maxWidth: 600 }}>
          Your workspace for agentic engineering — manage agent instructions, system prompts,
          and project templates in one place.
        </p>
      </div>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing['3xl'],
        }}
      >
        {quickActions.map((action) => (
          <Card
            key={action.to}
            interactive
            onClick={() => navigate(action.to)}
            style={{ background: action.gradient }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ color: colors.accent.blue }}>{action.icon}</div>
              <ArrowRight size={18} color={colors.text.muted} />
            </div>
            <h3
              style={{
                fontSize: font.size.xl,
                fontWeight: font.weight.semibold,
                color: colors.text.primary,
                marginTop: spacing.md,
              }}
            >
              {action.label}
            </h3>
            <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginTop: spacing.xs }}>
              {action.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing.lg,
          marginBottom: spacing['3xl'],
        }}
      >
        {[
          { label: 'Collections', value: collections.length, icon: <FolderOpen size={18} /> },
          { label: 'Templates', value: templates.length, icon: <FileText size={18} /> },
          {
            label: 'Total Uses',
            value: templates.reduce((sum, t) => sum + t.useCount, 0),
            icon: <TrendingUp size={18} />,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, color: colors.text.muted }}>
              {stat.icon}
              <span style={{ fontSize: font.size.sm }}>{stat.label}</span>
            </div>
            <div
              style={{
                fontSize: font.size['2xl'],
                fontWeight: font.weight.bold,
                color: colors.text.primary,
                marginTop: spacing.sm,
              }}
            >
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Recently Used */}
      <SectionHeader title="Recently Used" subtitle="Templates you've worked with most recently" />
      {recentTemplates.length === 0 ? (
        <Card>
          <p style={{ color: colors.text.muted, textAlign: 'center', padding: spacing.xl }}>
            No templates yet. Create or import your first template to get started.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {recentTemplates.map((tpl) => (
            <Card
              key={tpl.id}
              interactive
              onClick={() => navigate('/templates')}
              style={{ padding: `${spacing.md} ${spacing.xl}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <FileText size={18} color={colors.accent.blue} />
                  <div>
                    <div style={{ fontWeight: font.weight.medium, color: colors.text.primary }}>
                      {tpl.name}
                    </div>
                    <div style={{ fontSize: font.size.sm, color: colors.text.muted }}>
                      {tpl.filename}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <Badge>{tpl.category}</Badge>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      fontSize: font.size.sm,
                      color: colors.text.muted,
                    }}
                  >
                    <Clock size={14} />
                    {tpl.lastUsedAt
                      ? new Date(tpl.lastUsedAt).toLocaleDateString()
                      : new Date(tpl.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
