/**
 * Central application store (Zustand).
 *
 * Holds UI state, collections, templates, and the active GitHub token.
 * Persisted state (tokens, collections) is handled by the storage service;
 * this store only keeps the in-memory view.
 */

import { create } from 'zustand';
import type { Collection, Template, TemplateMetadata, AgentProjectMeta, AgentProject, ModelCredential } from '../domain';
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

  /* ── Agent Developer ── */
  agentProjects: AgentProjectMeta[];
  setAgentProjects: (projects: AgentProjectMeta[]) => void;
  activeAgentProject: AgentProject | null;
  setActiveAgentProject: (project: AgentProject | null) => void;
  modelCredentials: ModelCredential[];
  setModelCredentials: (creds: ModelCredential[]) => void;

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

  /* Agent Developer */
  agentProjects: [],
  setAgentProjects: (agentProjects) => set({ agentProjects }),
  activeAgentProject: null,
  setActiveAgentProject: (activeAgentProject) => set({ activeAgentProject }),
  modelCredentials: [],
  setModelCredentials: (modelCredentials) => set({ modelCredentials }),

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
