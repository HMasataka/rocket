import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface UIState {
  selectedFile: string | null;
  selectedFileStaged: boolean;
  toasts: Toast[];
}

interface UIActions {
  selectFile: (path: string, staged: boolean) => void;
  clearSelection: () => void;
  addToast: (message: string, kind: ToastKind) => void;
  removeToast: (id: number) => void;
}

const AUTO_DISMISS_MS = 4000;
let nextToastId = 0;

export const useUIStore = create<UIState & UIActions>((set) => ({
  selectedFile: null,
  selectedFileStaged: false,
  toasts: [],

  selectFile: (path: string, staged: boolean) => {
    set({ selectedFile: path, selectedFileStaged: staged });
  },

  clearSelection: () => {
    set({ selectedFile: null, selectedFileStaged: false });
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
