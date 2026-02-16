/**
 * Central application store (Zustand).
 *
 * Holds UI state, collections, templates, and the active GitHub token.
 * Persisted state (tokens, collections) is handled by the storage service;
 * this store only keeps the in-memory view.
 */

import { create } from 'zustand';
import type { Collection, Template, TemplateMetadata } from '../domain';
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
