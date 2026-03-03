/**
 * CodePreview – Displays the generated ADK TypeScript project code
 * with tabs for different files and export functionality.
 */

import React, { useState, useCallback } from 'react';
import { Download, FileText, FileCode, Settings } from 'lucide-react';
import { colors, spacing, font, radius } from '../../ui/theme';
import { Button, TabBar, CodeBlock } from '../../ui/components';
import type { AgentProject, ModelCredential } from '../../domain';
import {
  generateAgentTs,
  generateEnvExample,
  generatePackageJson,
  generateTsConfig,
  generateReadme,
  generateGitignore,
  generateVsCodeSettings,
  exportToDirectory,
} from '../../services/adkCodegenService';
import { resolveProjectCredentials } from '../../services/credentialService';
import { open } from '@tauri-apps/plugin-dialog';

interface CodePreviewProps {
  project: AgentProject;
  credentials: ModelCredential[];
  showToast: (msg: string) => void;
}

type PreviewFile = 'agent.ts' | 'package.json' | 'tsconfig.json' | '.env.example' | 'README.md' | '.gitignore' | '.vscode/settings.json';

const FILE_TABS: { id: PreviewFile; label: string; icon: React.ReactNode }[] = [
  { id: 'agent.ts', label: 'agent.ts', icon: <FileCode size={14} /> },
  { id: 'package.json', label: 'package.json', icon: <Settings size={14} /> },
  { id: '.env.example', label: '.env.example', icon: <FileText size={14} /> },
  { id: 'tsconfig.json', label: 'tsconfig.json', icon: <Settings size={14} /> },
  { id: 'README.md', label: 'README.md', icon: <FileText size={14} /> },
  { id: '.gitignore', label: '.gitignore', icon: <FileText size={14} /> },
  { id: '.vscode/settings.json', label: '.vscode', icon: <Settings size={14} /> },
];

export const CodePreview: React.FC<CodePreviewProps> = ({ project, credentials, showToast }) => {
  const [activeFile, setActiveFile] = useState<PreviewFile>('agent.ts');
  const [exporting, setExporting] = useState(false);

  const getCode = useCallback((file: PreviewFile): string => {
    switch (file) {
      case 'agent.ts':
        return generateAgentTs(project);
      case 'package.json':
        return generatePackageJson(project.name);
      case 'tsconfig.json':
        return generateTsConfig();
      case '.env.example':
        return generateEnvExample(project, credentials);
      case 'README.md':
        return generateReadme(project);
      case '.gitignore':
        return generateGitignore();
      case '.vscode/settings.json':
        return generateVsCodeSettings();
      default:
        return '';
    }
  }, [project, credentials]);

  const getLanguage = (file: PreviewFile): string => {
    if (file.endsWith('.ts')) return 'typescript';
    if (file.endsWith('.json')) return 'json';
    if (file.endsWith('.md')) return 'markdown';
    return 'text';
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Choose export directory',
      });

      if (!selected) {
        setExporting(false);
        return;
      }

      // Resolve credentials
      const credIds = project.agents
        .filter((a) => a.modelCredentialId)
        .map((a) => a.modelCredentialId!);
      const decryptedKeys = await resolveProjectCredentials(credIds);

      await exportToDirectory(project, selected as string, credentials, decryptedKeys);
      showToast(`Project exported to ${selected}`);
    } catch (err) {
      showToast(`Export failed: ${err}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{
          fontSize: font.size.lg,
          fontWeight: font.weight.semibold,
          color: colors.text.primary,
          margin: 0,
        }}>
          Generated Code
        </h3>
        <Button
          variant="primary"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting…' : 'Export Project'}
        </Button>
      </div>

      {/* File tabs */}
      <TabBar
        tabs={FILE_TABS.map((f) => ({ id: f.id, label: f.label, icon: f.icon }))}
        activeTab={activeFile}
        onTabChange={(id) => setActiveFile(id as PreviewFile)}
      />

      {/* Code view */}
      <div style={{ flex: 1, overflow: 'auto', borderRadius: radius.md, border: `1px solid ${colors.border.subtle}` }}>
        <CodeBlock
          code={getCode(activeFile)}
          language={getLanguage(activeFile)}
          maxHeight={600}
        />
      </div>

      {/* Quick start hint */}
      <div style={{
        padding: spacing.md,
        background: colors.bg.tertiary,
        borderRadius: radius.md,
        border: `1px solid ${colors.border.subtle}`,
      }}>
        <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>
          <strong>Quick Start:</strong> Export the project, then run:
        </div>
        <code style={{
          display: 'block',
          marginTop: spacing.xs,
          fontFamily: font.mono,
          fontSize: font.size.sm,
          color: colors.accent.green,
        }}>
          cd {'<exported-dir>'} && npm install && npx @google/adk web
        </code>
      </div>
    </div>
  );
};
