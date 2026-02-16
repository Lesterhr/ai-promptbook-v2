import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  GitBranch,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { colors, spacing, font, radius, transition } from '../theme';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <Home size={20} /> },
  { to: '/templates', label: 'Templates', icon: <FileText size={20} /> },
  { to: '/repo-creator', label: 'Repo Creator', icon: <GitBranch size={20} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 60 : 220;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: colors.bg.primary }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          display: 'flex',
          flexDirection: 'column',
          background: colors.bg.secondary,
          borderRight: `1px solid ${colors.border.subtle}`,
          transition: `width ${transition.normal}`,
          overflow: 'hidden',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: `${spacing.xl} ${spacing.lg}`,
            borderBottom: `1px solid ${colors.border.subtle}`,
            minHeight: 64,
          }}
        >
          <Sparkles size={24} color={colors.accent.blue} />
          {!collapsed && (
            <span
              style={{
                fontSize: font.size.lg,
                fontWeight: font.weight.bold,
                color: colors.text.primary,
                whiteSpace: 'nowrap',
              }}
            >
              AI Promptbook
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: spacing.sm, gap: '2px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: radius.md,
                color: isActive ? colors.accent.blue : colors.text.secondary,
                background: isActive ? `${colors.accent.blue}15` : 'transparent',
                fontWeight: isActive ? font.weight.semibold : font.weight.normal,
                fontSize: font.size.md,
                transition: `all ${transition.fast}`,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              })}
            >
              {item.icon}
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.md,
            color: colors.text.muted,
            borderTop: `1px solid ${colors.border.subtle}`,
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: spacing['2xl'],
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
