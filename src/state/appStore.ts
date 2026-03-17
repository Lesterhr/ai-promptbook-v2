/**
 * Central application store (Zustand).
 *
 * Holds UI state, collections, templates, and the active GitHub token.
 * Persisted state (tokens, collections) is handled by the storage service;
 * this store only keeps the in-memory view.
 */

import { create } from 'zustand';
import type { Collection, Template, TemplateMetadata, ByokConfig } from '../domain';
import { DEFAULT_COPILOT_CONFIG } from '../domain';
import type { SavedToken } from '../services/storageService';

interface AppState {
  /* ── Auth ── */
  githubToken: string | null;
  setGithubToken: (token: string | null) => void;
  savedTokens: SavedToken[];
  setSavedTokens: (tokens: SavedToken[]) => void;
  activeTokenId: string | null;
  setActiveTokenId: (id: string | null) => void;

  /* ── Collections ── */
  collections: Collection[];
  setCollections: (cols: Collection[]) => void;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;

  /* ── Templates ── */
  templates: TemplateMetadata[];
  setTemplates: (tpls: TemplateMetadata[]) => void;
  activeTemplate: Template | null;
  setActiveTemplate: (tpl: Template | null) => void;
  updateTemplateMetadata: (id: string, patch: Partial<TemplateMetadata>) => void;

  /* ── Copilot ── */
  copilotAvailable: boolean;
  setCopilotAvailable: (available: boolean) => void;
  copilotVersion: string | null;
  setCopilotVersion: (version: string | null) => void;
  copilotEnabled: boolean;
  setCopilotEnabled: (enabled: boolean) => void;
  copilotModel: string;
  setCopilotModel: (model: string) => void;
  copilotByok: ByokConfig | null;
  setCopilotByok: (byok: ByokConfig | null) => void;
  copilotCliPath: string | null;
  setCopilotCliPath: (path: string | null) => void;

  /* ── UI ── */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  /* Auth */
  githubToken: null,
  setGithubToken: (token) => set({ githubToken: token }),
  savedTokens: [],
  setSavedTokens: (savedTokens) => set({ savedTokens }),
  activeTokenId: null,
  setActiveTokenId: (activeTokenId) => set({ activeTokenId }),

  /* Collections */
  collections: [],
  setCollections: (collections) => set({ collections }),
  activeCollectionId: null,
  setActiveCollectionId: (activeCollectionId) => set({ activeCollectionId }),

  /* Templates */
  templates: [],
  setTemplates: (templates) => set({ templates }),
  activeTemplate: null,
  setActiveTemplate: (activeTemplate) => set({ activeTemplate }),
  updateTemplateMetadata: (id, patch) =>
    set((state) => ({
      templates: state.templates.map((t) => t.id === id ? { ...t, ...patch } : t),
      activeTemplate:
        state.activeTemplate?.id === id
          ? { ...state.activeTemplate, ...patch }
          : state.activeTemplate,
    })),

  /* Copilot */
  copilotAvailable: false,
  setCopilotAvailable: (copilotAvailable) => set({ copilotAvailable }),
  copilotVersion: null,
  setCopilotVersion: (copilotVersion) => set({ copilotVersion }),
  copilotEnabled: DEFAULT_COPILOT_CONFIG.enabled,
  setCopilotEnabled: (copilotEnabled) => set({ copilotEnabled }),
  copilotModel: DEFAULT_COPILOT_CONFIG.model,
  setCopilotModel: (copilotModel) => set({ copilotModel }),
  copilotByok: DEFAULT_COPILOT_CONFIG.byok,
  setCopilotByok: (copilotByok) => set({ copilotByok }),
  copilotCliPath: DEFAULT_COPILOT_CONFIG.cliPath,
  setCopilotCliPath: (copilotCliPath) => set({ copilotCliPath }),

  /* UI */
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toastMessage: null,
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 4000);
  },
  clearToast: () => set({ toastMessage: null }),
}));
