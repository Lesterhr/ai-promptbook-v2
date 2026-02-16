import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  FileText,
  Sparkles,
  ArrowLeft,
  Plus,
  Lightbulb,
  MessageSquare,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { colors, spacing, font, radius, transition } from '../../ui/theme';
import { Button, Badge } from '../../ui/components';
import {
  disciplines,
  promptModes,
  bestPractices,
  type Discipline,
} from '../../data/guidelineContent';
import { TemplateCreateDialog } from '../templates/TemplateCreateDialog';
import { useAppStore } from '../../state/appStore';
import { useNavigate } from 'react-router-dom';

type Section = 'overview' | 'discipline' | 'best-practices' | 'prompt-modes';

export const GuidelinesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useAppStore();

  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [activeDiscipline, setActiveDiscipline] = useState<Discipline | null>(null);
  const [createDialogDiscipline, setCreateDialogDiscipline] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [activeSection, activeDiscipline]);

  const handleOpenDiscipline = (d: Discipline) => {
    setActiveDiscipline(d);
    setActiveSection('discipline');
  };

  const handleCreate = (disciplineId: string) => {
    setCreateDialogDiscipline(disciplineId);
    setShowCreateDialog(true);
  };

  const handleCreated = () => {
    setShowCreateDialog(false);
    showToast('Template created! Navigate to Templates to start editing.');
    navigate('/templates');
  };

  /* ── Sidebar TOC ── */
  const tocItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen size={16} /> },
    { id: 'best-practices', label: 'Best Practices', icon: <Lightbulb size={16} /> },
    { id: 'prompt-modes', label: 'Prompt Modes', icon: <MessageSquare size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', gap: spacing.xl, maxWidth: 1100, margin: '0 auto', height: 'calc(100vh - 80px)' }}>
      {/* ── Left: Table of Contents ── */}
      <nav
        style={{
          width: 240,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
          paddingTop: spacing.md,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
        }}
      >
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveSection(item.id); setActiveDiscipline(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: radius.md,
              fontSize: font.size.md,
              fontWeight: activeSection === item.id && !activeDiscipline ? font.weight.semibold : font.weight.normal,
              color: activeSection === item.id && !activeDiscipline ? colors.accent.blue : colors.text.secondary,
              background: activeSection === item.id && !activeDiscipline ? `${colors.accent.blue}15` : 'transparent',
              transition: `all ${transition.fast}`,
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Discipline section header */}
        <div style={{
          fontSize: font.size.xs,
          color: colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: `${spacing.lg} ${spacing.md} ${spacing.xs}`,
        }}>
          Disciplines
        </div>

        {disciplines.map((d) => (
          <button
            key={d.id}
            onClick={() => handleOpenDiscipline(d)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: radius.md,
              fontSize: font.size.sm,
              fontWeight: activeDiscipline?.id === d.id ? font.weight.semibold : font.weight.normal,
              color: activeDiscipline?.id === d.id ? d.color : colors.text.secondary,
              background: activeDiscipline?.id === d.id ? `${d.color}15` : 'transparent',
              transition: `all ${transition.fast}`,
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: d.color, flexShrink: 0,
            }} />
            {d.title}
          </button>
        ))}
      </nav>

      {/* ── Right: Content ── */}
      <div ref={contentRef} style={{ flex: 1, overflow: 'auto', paddingBottom: spacing['3xl'] }}>
        {/* ─── Overview ─── */}
        {activeSection === 'overview' && !activeDiscipline && (
          <div>
            <h1 style={{ fontSize: font.size['3xl'], fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: spacing.sm }}>
              Agent Instruction Guidelines
            </h1>
            <p style={{ fontSize: font.size.lg, color: colors.text.secondary, marginBottom: spacing['2xl'], lineHeight: 1.6 }}>
              A practical reference for creating effective AI agent instruction files.
              Each discipline below covers a specific file format and target tool.
              Choose the one that matches your development setup, or use AGENTS.md as a universal starting point.
            </p>

            {/* Discipline cards grid */}
            <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing.lg }}>
              Choose a Discipline
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing['2xl'] }}>
              {disciplines.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: colors.bg.surface,
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: radius.lg,
                    padding: spacing.xl,
                    transition: `all ${transition.fast}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleOpenDiscipline(d)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = d.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border.subtle; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: radius.md,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${d.color}22`, color: d.color,
                    }}>
                      {d.id === 'system-prompt' ? <Sparkles size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: font.weight.semibold, color: colors.text.primary }}>{d.title}</div>
                      <div style={{ fontSize: font.size.xs, color: d.color }}>{d.toolName}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: font.size.sm, color: colors.text.secondary, lineHeight: 1.5, marginBottom: spacing.md }}>
                    {d.shortDescription}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: font.size.xs, color: colors.text.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Learn more <ChevronRight size={12} />
                    </span>
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleCreate(d.id); }}
                      icon={<Plus size={14} />}
                      style={{ background: `${d.color}`, border: 'none' }}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ display: 'flex', gap: spacing.lg }}>
              <button
                onClick={() => setActiveSection('best-practices')}
                style={{
                  flex: 1, padding: spacing.xl,
                  background: colors.bg.surface, border: `1px solid ${colors.border.subtle}`,
                  borderRadius: radius.lg, textAlign: 'left', cursor: 'pointer',
                  transition: `all ${transition.fast}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent.amber; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border.subtle; }}
              >
                <Lightbulb size={24} color={colors.accent.amber} />
                <div style={{ fontWeight: font.weight.semibold, color: colors.text.primary, marginTop: spacing.sm }}>
                  Best Practices
                </div>
                <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: spacing.xs }}>
                  Persona engineering, XML vs. Markdown, negative constraints, and more
                </div>
              </button>
              <button
                onClick={() => setActiveSection('prompt-modes')}
                style={{
                  flex: 1, padding: spacing.xl,
                  background: colors.bg.surface, border: `1px solid ${colors.border.subtle}`,
                  borderRadius: radius.lg, textAlign: 'left', cursor: 'pointer',
                  transition: `all ${transition.fast}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent.purple; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border.subtle; }}
              >
                <MessageSquare size={24} color={colors.accent.purple} />
                <div style={{ fontWeight: font.weight.semibold, color: colors.text.primary, marginTop: spacing.sm }}>
                  Prompt Mode Triggers
                </div>
                <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: spacing.xs }}>
                  7 behavioral modes that small wording changes activate in the model
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ─── Discipline Detail ─── */}
        {activeSection === 'discipline' && activeDiscipline && (
          <div>
            {/* Back + Header */}
            <button
              onClick={() => { setActiveDiscipline(null); setActiveSection('overview'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: spacing.xs,
                fontSize: font.size.sm, color: colors.accent.blue, marginBottom: spacing.lg,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <ArrowLeft size={14} /> Back to Overview
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md }}>
              <div style={{
                width: 48, height: 48, borderRadius: radius.lg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${activeDiscipline.color}22`, color: activeDiscipline.color,
              }}>
                {activeDiscipline.id === 'system-prompt' ? <Sparkles size={24} /> : <FileText size={24} />}
              </div>
              <div>
                <h1 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary, margin: 0 }}>
                  {activeDiscipline.title}
                </h1>
                <Badge color={activeDiscipline.color}>{activeDiscipline.toolName}</Badge>
              </div>
            </div>

            {/* Create button */}
            <Button
              onClick={() => handleCreate(activeDiscipline.id)}
              icon={<Plus size={16} />}
              style={{ marginBottom: spacing['2xl'], background: activeDiscipline.color, border: 'none' }}
            >
              Create {activeDiscipline.title}
            </Button>

            {/* Overview */}
            <Section title="Overview">
              <p style={proseStyle}>{activeDiscipline.guide.overview}</p>
            </Section>

            {/* Placement */}
            <Section title="Where to Place">
              <div style={{
                padding: spacing.lg, background: colors.bg.tertiary,
                borderRadius: radius.md, border: `1px solid ${colors.border.subtle}`,
              }}>
                <code style={{ fontFamily: font.mono, fontSize: font.size.md, color: activeDiscipline.color }}>
                  {activeDiscipline.placement}
                </code>
              </div>
            </Section>

            {/* Key Points */}
            <Section title="Key Points">
              <ul style={{ ...proseStyle, paddingLeft: spacing.xl }}>
                {activeDiscipline.guide.keyPoints.map((point, i) => (
                  <li key={i} style={{ marginBottom: spacing.sm, display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
                    <CheckCircle2 size={16} color={colors.accent.green} style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Structure */}
            <Section title="Recommended Structure">
              <p style={proseStyle}>{activeDiscipline.guide.structureDescription}</p>
            </Section>

            {/* Best Practices */}
            <Section title="Best Practices">
              <ul style={{ ...proseStyle, paddingLeft: spacing.xl }}>
                {activeDiscipline.guide.bestPractices.map((tip, i) => (
                  <li key={i} style={{ marginBottom: spacing.sm, display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
                    <Lightbulb size={14} color={colors.accent.amber} style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Example / Scaffold Preview */}
            <Section title="Example Template">
              <p style={{ ...proseStyle, marginBottom: spacing.md }}>
                This is the recommended starting structure. Click "Create" to use it as a starter.
              </p>
              <pre
                className="selectable"
                style={{
                  background: colors.bg.primary,
                  border: `1px solid ${colors.border.subtle}`,
                  borderRadius: radius.md,
                  padding: spacing.xl,
                  overflow: 'auto',
                  fontFamily: font.mono,
                  fontSize: font.size.sm,
                  lineHeight: 1.7,
                  color: colors.text.secondary,
                  maxHeight: 600,
                }}
              >
                {activeDiscipline.scaffoldContent}
              </pre>
            </Section>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', padding: `${spacing['2xl']} 0` }}>
              <Button
                onClick={() => handleCreate(activeDiscipline.id)}
                icon={<Plus size={16} />}
                style={{ background: activeDiscipline.color, border: 'none' }}
              >
                Create {activeDiscipline.title} Template
              </Button>
            </div>
          </div>
        )}

        {/* ─── Best Practices ─── */}
        {activeSection === 'best-practices' && !activeDiscipline && (
          <div>
            <h1 style={{ fontSize: font.size['3xl'], fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: spacing.sm }}>
              Best Practices
            </h1>
            <p style={{ fontSize: font.size.lg, color: colors.text.secondary, marginBottom: spacing['2xl'], lineHeight: 1.6 }}>
              Cross-cutting principles for writing effective AI agent instructions, derived from analysis of
              2,500+ repositories and documentation from Microsoft, Anthropic, and OpenAI.
            </p>

            {bestPractices.map((bp) => (
              <div key={bp.id} style={{ marginBottom: spacing['2xl'] }}>
                <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing.sm }}>
                  {bp.title}
                </h2>
                <p style={{ ...proseStyle, marginBottom: spacing.md }}>{bp.description}</p>
                <div style={{
                  background: colors.bg.surface, border: `1px solid ${colors.border.subtle}`,
                  borderRadius: radius.md, padding: spacing.xl,
                }}>
                  <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
                    {bp.details.map((detail, i) => (
                      <li key={i} style={{ color: colors.text.secondary, fontSize: font.size.md, lineHeight: 1.7, marginBottom: spacing.xs }}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Prompt Modes ─── */}
        {activeSection === 'prompt-modes' && !activeDiscipline && (
          <div>
            <h1 style={{ fontSize: font.size['3xl'], fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: spacing.sm }}>
              Prompt Mode Triggers
            </h1>
            <p style={{ fontSize: font.size.lg, color: colors.text.secondary, marginBottom: spacing.md, lineHeight: 1.6 }}>
              Small wording changes in your prompts activate dramatically different behavioral modes in the model.
              Understanding these triggers lets you steer AI output precisely.
            </p>
            <div style={{
              padding: spacing.lg, marginBottom: spacing['2xl'],
              background: `${colors.accent.purple}0a`, border: `1px solid ${colors.accent.purple}33`,
              borderRadius: radius.md,
            }}>
              <p style={{ fontSize: font.size.md, color: colors.text.secondary, margin: 0 }}>
                <strong style={{ color: colors.accent.purple }}>Pro tip:</strong> Combine triggers deliberately.
                For example, <em>"Refactor this for production, explain your reasoning"</em> activates both
                Architecture and Teaching modes simultaneously.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
              {promptModes.map((mode, i) => {
                const modeColors = [
                  colors.accent.blue, colors.accent.green, colors.accent.purple,
                  colors.accent.amber, '#06b6d4', '#f97316', colors.accent.red,
                ];
                const modeColor = modeColors[i % modeColors.length];

                return (
                  <div
                    key={mode.name}
                    style={{
                      background: colors.bg.surface,
                      border: `1px solid ${colors.border.subtle}`,
                      borderRadius: radius.lg,
                      padding: spacing.xl,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
                      <Zap size={18} color={modeColor} />
                      <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>
                        {mode.name}
                      </h3>
                    </div>
                    <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginBottom: spacing.md }}>
                      Goal: {mode.goal}
                    </p>
                    <p style={{ fontSize: font.size.md, color: colors.text.secondary, lineHeight: 1.6, marginBottom: spacing.md }}>
                      {mode.description}
                    </p>
                    <div>
                      <span style={{ fontSize: font.size.xs, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Trigger Phrases
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
                        {mode.triggers.map((trigger) => (
                          <span
                            key={trigger}
                            style={{
                              padding: `${spacing.xs} ${spacing.md}`,
                              background: `${modeColor}15`,
                              color: modeColor,
                              border: `1px solid ${modeColor}33`,
                              borderRadius: radius.full,
                              fontSize: font.size.sm,
                              fontFamily: font.mono,
                            }}
                          >
                            "{trigger}"
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Create Dialog ── */}
      {showCreateDialog && (
        <TemplateCreateDialog
          preselectedDisciplineId={createDialogDiscipline}
          onCreated={handleCreated}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
};

/* ── Helpers ── */

const proseStyle: React.CSSProperties = {
  fontSize: font.size.md,
  color: colors.text.secondary,
  lineHeight: 1.7,
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: spacing['2xl'] }}>
    <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, marginBottom: spacing.md }}>
      {title}
    </h2>
    {children}
  </div>
);
