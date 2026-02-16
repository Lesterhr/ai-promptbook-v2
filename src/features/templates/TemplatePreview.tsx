import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Pencil, Clock, Hash, Tag } from 'lucide-react';
import { colors, spacing, font, radius } from '../../ui/theme';
import { Button, Badge } from '../../ui/components';
import type { Template } from '../../domain';

interface TemplatePreviewProps {
  template: Template;
  onEdit: () => void;
  onBack: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onEdit, onBack }) => {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xl,
        }}
      >
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <Button onClick={onEdit} icon={<Pencil size={16} />}>
          Edit
        </Button>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: font.size['3xl'],
          fontWeight: font.weight.bold,
          color: colors.text.primary,
          marginBottom: spacing.sm,
        }}
      >
        {template.name}
      </h1>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          gap: spacing.lg,
          alignItems: 'center',
          marginBottom: spacing.xl,
          flexWrap: 'wrap',
        }}
      >
        <Badge>{template.category}</Badge>
        <span style={{ fontSize: font.size.sm, color: colors.text.muted, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <Hash size={14} /> v{template.version}
        </span>
        <span style={{ fontSize: font.size.sm, color: colors.text.muted, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <Clock size={14} />
          Updated {new Date(template.updatedAt).toLocaleDateString()}
        </span>
        {template.lastUsedAt && (
          <span style={{ fontSize: font.size.sm, color: colors.text.muted, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <Clock size={14} />
            Last used {new Date(template.lastUsedAt).toLocaleDateString()}
          </span>
        )}
        {template.tags.length > 0 && (
          <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
            <Tag size={14} color={colors.text.muted} />
            {template.tags.map((tag) => (
              <Badge key={tag} color={colors.accent.purple}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {template.description && (
        <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginBottom: spacing.xl }}>
          {template.description}
        </p>
      )}

      {/* Markdown preview */}
      <div
        className="selectable"
        style={{
          background: colors.bg.surface,
          border: `1px solid ${colors.border.subtle}`,
          borderRadius: radius.lg,
          padding: spacing.xl,
          fontSize: font.size.md,
          lineHeight: 1.7,
          color: colors.text.primary,
          overflow: 'auto',
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, margin: `${spacing.xl} 0 ${spacing.md}`, color: colors.text.primary }}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, margin: `${spacing.lg} 0 ${spacing.sm}`, color: colors.text.primary }}>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, margin: `${spacing.md} 0 ${spacing.xs}`, color: colors.text.primary }}>
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p style={{ margin: `${spacing.sm} 0`, color: colors.text.secondary }}>{children}</p>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.startsWith('language-');
              return isBlock ? (
                <pre
                  style={{
                    background: colors.bg.tertiary,
                    padding: spacing.lg,
                    borderRadius: radius.md,
                    overflow: 'auto',
                    margin: `${spacing.md} 0`,
                    fontFamily: font.mono,
                    fontSize: font.size.sm,
                  }}
                >
                  <code>{children}</code>
                </pre>
              ) : (
                <code
                  style={{
                    background: colors.bg.tertiary,
                    padding: `2px ${spacing.xs}`,
                    borderRadius: radius.sm,
                    fontFamily: font.mono,
                    fontSize: '0.9em',
                  }}
                >
                  {children}
                </code>
              );
            },
            ul: ({ children }) => (
              <ul style={{ paddingLeft: spacing.xl, margin: `${spacing.sm} 0` }}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol style={{ paddingLeft: spacing.xl, margin: `${spacing.sm} 0` }}>{children}</ol>
            ),
            li: ({ children }) => (
              <li style={{ margin: `${spacing.xs} 0`, color: colors.text.secondary }}>{children}</li>
            ),
            a: ({ href, children }) => (
              <a href={href} style={{ color: colors.accent.blue, textDecoration: 'underline' }}>
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote
                style={{
                  borderLeft: `3px solid ${colors.accent.blue}`,
                  paddingLeft: spacing.lg,
                  margin: `${spacing.md} 0`,
                  color: colors.text.muted,
                  fontStyle: 'italic',
                }}
              >
                {children}
              </blockquote>
            ),
          }}
        >
          {template.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
