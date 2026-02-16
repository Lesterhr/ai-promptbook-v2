import React from 'react';
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
        <p style={{ fontSize: font.size.md, color: colors.text.secondary, marginTop: spacing.xs }}>{subtitle}</p>
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
