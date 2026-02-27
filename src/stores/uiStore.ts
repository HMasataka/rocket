import { create } from "zustand";

export type ToastKind = "success" | "error" | "info" | "warning";
export type PageId =
  | "changes"
  | "branches"
  | "history"
  | "blame"
  | "file-history"
  | "stash"
  | "rebase"
  | "cherry-pick"
  | "revert"
  | "hosting";

interface BlameTarget {
  path: string;
  commitOid: string | null;
}

interface FileHistoryTarget {
  path: string;
}

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

export type DiffViewMode = "inline" | "split";

interface UIState {
  selectedFile: string | null;
  selectedFileStaged: boolean;
  activePage: PageId;
  activeModal: string | null;
  toasts: Toast[];
  blameTarget: BlameTarget | null;
  fileHistoryTarget: FileHistoryTarget | null;
  diffViewMode: DiffViewMode;
}

interface UIActions {
  selectFile: (path: string, staged: boolean) => void;
  clearSelection: () => void;
  setActivePage: (page: PageId) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (message: string, kind: ToastKind) => void;
  removeToast: (id: number) => void;
  openBlame: (path: string, commitOid: string | null) => void;
  openFileHistory: (path: string) => void;
  setDiffViewMode: (mode: DiffViewMode) => void;
}

const AUTO_DISMISS_MS = 4000;
let nextToastId = 0;

export const useUIStore = create<UIState & UIActions>((set) => ({
  selectedFile: null,
  selectedFileStaged: false,
  activePage: "changes" as PageId,
  activeModal: null,
  toasts: [],
  blameTarget: null,
  fileHistoryTarget: null,
  diffViewMode: "inline" as DiffViewMode,

  selectFile: (path: string, staged: boolean) => {
    set({ selectedFile: path, selectedFileStaged: staged });
  },

  clearSelection: () => {
    set({ selectedFile: null, selectedFileStaged: false });
  },

  setActivePage: (page: PageId) => {
    set({ activePage: page });
  },

  openModal: (id: string) => {
    set({ activeModal: id });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  addToast: (message: string, kind: ToastKind) => {
    const id = nextToastId++;
    set((state) => ({
      toasts: [...state.toasts, { id, message, kind }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, AUTO_DISMISS_MS);
  },

  removeToast: (id: number) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  openBlame: (path: string, commitOid: string | null) => {
    set({ blameTarget: { path, commitOid }, activePage: "blame" });
  },

  openFileHistory: (path: string) => {
    set({ fileHistoryTarget: { path }, activePage: "file-history" });
  },

  setDiffViewMode: (mode: DiffViewMode) => {
    set({ diffViewMode: mode });
  },
}));
