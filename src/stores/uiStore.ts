import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";
export type PageId = "changes" | "branches";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface UIState {
  selectedFile: string | null;
  selectedFileStaged: boolean;
  activePage: PageId;
  activeModal: string | null;
  toasts: Toast[];
}

interface UIActions {
  selectFile: (path: string, staged: boolean) => void;
  clearSelection: () => void;
  setActivePage: (page: PageId) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (message: string, kind: ToastKind) => void;
  removeToast: (id: number) => void;
}

const AUTO_DISMISS_MS = 4000;
let nextToastId = 0;

export const useUIStore = create<UIState & UIActions>((set) => ({
  selectedFile: null,
  selectedFileStaged: false,
  activePage: "changes" as PageId,
  activeModal: null,
  toasts: [],

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
}));
