import React, { useState, useRef, useEffect } from 'react';
import { colors, radius, spacing, font, transition } from '../theme';

/* ───── Button ───── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${colors.accent.blue}, ${colors.accent.purple})`,
    color: colors.text.primary,
    border: 'none',
  },
  secondary: {
    background: colors.bg.surface,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
  },
  ghost: {
    background: 'transparent',
    color: colors.text.secondary,
    border: '1px solid transparent',
  },
  danger: {
    background: colors.accent.red,
    color: colors.text.primary,
    border: 'none',
  },
};

const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
  sm: { padding: `${spacing.xs} ${spacing.md}`, fontSize: font.size.sm },
  md: { padding: `${spacing.sm} ${spacing.lg}`, fontSize: font.size.md },
  lg: { padding: `${spacing.md} ${spacing.xl}`, fontSize: font.size.lg },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  style,
  ...rest
}) => (
  <button
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      fontWeight: font.weight.medium,
      cursor: rest.disabled ? 'not-allowed' : 'pointer',
      opacity: rest.disabled ? 0.5 : 1,
      transition: `all ${transition.fast}`,
      whiteSpace: 'nowrap',
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    }}
    {...rest}
  >
    {icon}
    {children}
  </button>
);

/* ───── Card ───── */

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  interactive?: boolean;
}

const cardBg = 'rgba(35, 39, 56, 0.72)';
const cardBgHover = 'rgba(42, 46, 66, 0.82)';

export const Card: React.FC<CardProps> = ({ children, style, onClick, interactive }) => (
  <div
    onClick={onClick}
    {...(onClick && { role: 'button' })}
    tabIndex={onClick ? 0 : undefined}
    {...(onClick && { 'aria-pressed': false })}
    style={{
      background: cardBg,
      backdropFilter: 'blur(8px)',
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: radius.lg,
      padding: spacing.xl,
      transition: `all ${transition.fast}`,
      cursor: interactive || onClick ? 'pointer' : 'default',
      ...style,
    }}
    onMouseEnter={(e) => {
      if (interactive || onClick) {
        e.currentTarget.style.borderColor = colors.accent.blue;
        if (!style?.background) {
          e.currentTarget.style.background = cardBgHover;
        }
      }
    }}
    onMouseLeave={(e) => {
      if (interactive || onClick) {
        e.currentTarget.style.borderColor = colors.border.subtle;
        e.currentTarget.style.background = (style?.background as string) ?? cardBg;
      }
    }}
  >
    {children}
  </div>
);

/* ───── Badge ───── */

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, color = colors.accent.blue }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: `2px ${spacing.sm}`,
      borderRadius: radius.full,
      fontSize: font.size.xs,
      fontWeight: font.weight.medium,
      background: `rgba(35, 39, 56, 0.85)`,
      color,
      border: `1px solid ${color}44`,
    }}
  >
    {children}
  </span>
);

/* ───── Input ───── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, style, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
    {label && (
      <label style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: font.weight.medium }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <span style={{ position: 'absolute', left: spacing.md, color: colors.text.muted, display: 'flex' }}>
          {icon}
        </span>
      )}
      <input
        className="selectable"
        style={{
          width: '100%',
          padding: `${spacing.sm} ${spacing.lg}`,
          paddingLeft: icon ? '40px' : spacing.lg,
          background: colors.bg.tertiary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radius.md,
          color: colors.text.primary,
          fontSize: font.size.md,
          ...style,
        }}
        {...rest}
      />
    </div>
  </div>
);

/* ───── TextArea ───── */

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, style, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
    {label && (
      <label style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: font.weight.medium }}>
        {label}
      </label>
    )}
    <textarea
      className="selectable"
      style={{
        width: '100%',
        padding: spacing.lg,
        background: colors.bg.tertiary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.md,
        color: colors.text.primary,
        fontSize: font.size.md,
        resize: 'vertical',
        minHeight: '100px',
        fontFamily: font.family,
        ...style,
      }}
      {...rest}
    />
  </div>
);

/* ───── Select ───── */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ label, options, style, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
    {label && (
      <label style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: font.weight.medium }}>
        {label}
      </label>
    )}
    <select
      style={{
        width: '100%',
        padding: `${spacing.sm} ${spacing.lg}`,
        background: colors.bg.tertiary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.md,
        color: colors.text.primary,
        fontSize: font.size.md,
        cursor: 'pointer',
        ...style,
      }}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

/* ───── Section Header ───── */

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg }}>
    <div>
      <h2 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary, margin: 0 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: font.size.md, color: '#475569', marginTop: spacing.xs }}>{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);

/* ───── EmptyState ───── */

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      padding: spacing['3xl'],
      textAlign: 'center',
    }}
  >
    <div style={{ color: colors.text.muted, opacity: 0.6 }}>{icon}</div>
    <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary }}>{title}</h3>
    <p style={{ fontSize: font.size.md, color: colors.text.secondary, maxWidth: 400 }}>{description}</p>
    {action}
  </div>
);

/* ───── ConfirmDialog ───── */

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

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
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, margin: 0, marginBottom: spacing.md }}>
          {title}
        </h3>
        <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginBottom: spacing.xl, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ───── RatingControl ───── */

function ratingColor(v: number): string {
  if (v <= 3) return colors.accent.amber;
  if (v <= 7) return colors.accent.blue;
  return colors.accent.green;
}

export interface RatingControlProps {
  /** Current rating 1–10, or null/undefined for unrated */
  value: number | null | undefined;
  /** Called when the user clicks a segment. Passes null when deselecting. */
  onChange: (rating: number | null) => void;
  /** 'sm' = compact inline (list rows), 'md' = full (preview/editor) */
  size?: 'sm' | 'md';
  readOnly?: boolean;
}

export const RatingControl: React.FC<RatingControlProps> = ({
  value,
  onChange,
  size = 'md',
  readOnly = false,
}) => {
  const current = value ?? null;
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? current;
  const isSm = size === 'sm';
  const segW = isSm ? 14 : 22;
  const segH = isSm ? 8 : 16;
  const segGap = isSm ? 2 : 3;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? spacing.xs : spacing.sm,
        userSelect: 'none',
      }}
      onMouseLeave={() => setHoverValue(null)}
    >
      <div style={{ display: 'flex', gap: segGap }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((seg) => {
          const filled = displayValue !== null && seg <= displayValue;
          const base = ratingColor(seg);
          return (
            <button
              key={seg}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange(current === seg ? null : seg)}
              onMouseEnter={() => !readOnly && setHoverValue(seg)}
              title={current === seg ? `Rated ${seg}/10 – click to remove` : `Rate ${seg}/10`}
              style={{
                width: segW,
                height: segH,
                borderRadius: radius.sm,
                border: 'none',
                background: filled ? base : `${base}28`,
                cursor: readOnly ? 'default' : 'pointer',
                transition: `background ${transition.fast}, transform ${transition.fast}`,
                transform: hoverValue === seg && !readOnly ? 'scaleY(1.3)' : 'scaleY(1)',
                padding: 0,
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
      {isSm ? (
        current !== null && (
          <span
            style={{
              fontSize: font.size.xs,
              color: ratingColor(current),
              fontWeight: font.weight.medium,
              lineHeight: 1,
            }}
          >
            {current}
          </span>
        )
      ) : (
        <span
          style={{
            fontSize: font.size.sm,
            color: displayValue !== null ? ratingColor(displayValue) : colors.text.muted,
            fontWeight: font.weight.medium,
            minWidth: 44,
            textAlign: 'right',
            lineHeight: 1,
          }}
        >
          {displayValue !== null ? `${displayValue}/10` : 'Unrated'}
        </span>
      )}
    </div>
  );
};

/* ───── CodeBlock ───── */

interface CodeBlockProps {
  code: string;
  language?: string;
  maxHeight?: number;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, maxHeight = 400 }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', borderRadius: radius.md, overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${spacing.xs} ${spacing.md}`,
        background: colors.bg.primary,
        borderBottom: `1px solid ${colors.border.subtle}`,
      }}>
        {language && (
          <span style={{ fontSize: font.size.xs, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {language}
          </span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? colors.accent.green : colors.text.muted,
            cursor: 'pointer',
            fontSize: font.size.xs,
            padding: `${spacing.xs} ${spacing.sm}`,
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: spacing.md,
        background: colors.bg.primary,
        color: colors.text.primary,
        fontFamily: font.mono,
        fontSize: font.size.sm,
        lineHeight: 1.6,
        overflow: 'auto',
        maxHeight,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

/* ───── TabBar ───── */

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => (
  <div style={{
    display: 'flex',
    gap: spacing.xs,
    borderBottom: `1px solid ${colors.border.subtle}`,
    paddingBottom: 0,
  }}>
    {tabs.map((tab) => {
      const isActive = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: `${spacing.sm} ${spacing.md}`,
            background: 'none',
            border: 'none',
            borderBottom: `2px solid ${isActive ? colors.accent.blue : 'transparent'}`,
            color: isActive ? colors.text.primary : colors.text.secondary,
            fontSize: font.size.sm,
            fontWeight: isActive ? font.weight.semibold : font.weight.normal,
            cursor: 'pointer',
            transition: `color ${transition.fast}, border-color ${transition.fast}`,
            marginBottom: -1,
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.color = colors.text.primary;
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.color = colors.text.secondary;
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      );
    })}
  </div>
);

/* ───── CollapsibleSection ───── */

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div style={{ borderRadius: radius.md, border: `1px solid ${colors.border.subtle}`, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          background: colors.bg.secondary,
          border: 'none',
          color: colors.text.primary,
          fontSize: font.size.sm,
          fontWeight: font.weight.semibold,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: `transform ${transition.fast}`,
          display: 'inline-block',
          fontSize: font.size.xs,
        }}>
          ▶
        </span>
        <span style={{ flex: 1 }}>{title}</span>
        {badge}
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: isOpen ? (contentHeight ?? 'none') : 0,
          overflow: 'hidden',
          transition: `max-height ${transition.normal}`,
        }}
      >
        <div style={{ padding: spacing.md }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ───── ChipSelect ───── */

interface ChipOption {
  value: string;
  label: string;
  color?: string;
}

interface ChipSelectProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multi?: boolean;
}

export const ChipSelect: React.FC<ChipSelectProps> = ({
  options,
  selected,
  onChange,
  multi = true,
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
    {options.map((opt) => {
      const isSelected = selected.includes(opt.value);
      const chipColor = opt.color ?? colors.accent.blue;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            if (multi) {
              onChange(
                isSelected
                  ? selected.filter((v) => v !== opt.value)
                  : [...selected, opt.value],
              );
            } else {
              onChange(isSelected ? [] : [opt.value]);
            }
          }}
          style={{
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: radius.full,
            border: `1px solid ${isSelected ? chipColor : colors.border.default}`,
            background: isSelected ? `${chipColor}22` : 'transparent',
            color: isSelected ? chipColor : colors.text.secondary,
            fontSize: font.size.xs,
            fontWeight: font.weight.medium,
            cursor: 'pointer',
            transition: `all ${transition.fast}`,
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.borderColor = chipColor;
              e.currentTarget.style.color = chipColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.borderColor = colors.border.default;
              e.currentTarget.style.color = colors.text.secondary;
            }
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

/* ───── ModelBadge ───── */

interface ModelBadgeProps {
  modelString: string;
  provider?: string;
  size?: 'sm' | 'md';
}

export const ModelBadge: React.FC<ModelBadgeProps> = ({ modelString, provider, size = 'sm' }) => {
  const providerColors: Record<string, string> = {
    'google': colors.accent.blue,
    'anthropic': colors.accent.amber,
    'openai': colors.accent.green,
    'meta': colors.accent.purple,
    'vertex-ai': colors.accent.blue,
  };
  const color = (provider && providerColors[provider]) || colors.accent.blue;
  const isSm = size === 'sm';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.xs,
      padding: isSm ? `2px ${spacing.sm}` : `${spacing.xs} ${spacing.md}`,
      borderRadius: radius.full,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      color,
      fontSize: isSm ? font.size.xs : font.size.sm,
      fontWeight: font.weight.medium,
      fontFamily: font.mono,
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: isSm ? 6 : 8,
        height: isSm ? 6 : 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
      {modelString}
    </span>
  );
};
