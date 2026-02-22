import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "../uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStore.setState({
      selectedFile: null,
      selectedFileStaged: false,
      activePage: "changes",
      activeModal: null,
      toasts: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("selectFile", () => {
    it("sets selectedFile and selectedFileStaged", () => {
      useUIStore.getState().selectFile("path/to/file.txt", true);

      const state = useUIStore.getState();
      expect(state.selectedFile).toBe("path/to/file.txt");
      expect(state.selectedFileStaged).toBe(true);
    });
  });

  describe("clearSelection", () => {
    it("resets selectedFile and selectedFileStaged to defaults", () => {
      useUIStore.getState().selectFile("some-file", true);
      useUIStore.getState().clearSelection();

      const state = useUIStore.getState();
      expect(state.selectedFile).toBeNull();
      expect(state.selectedFileStaged).toBe(false);
    });
  });

  describe("addToast", () => {
    it("adds a toast to the list", () => {
      useUIStore.getState().addToast("hello", "info");

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe("hello");
      expect(toasts[0].kind).toBe("info");
    });

    it("auto-removes the toast after timeout", () => {
      useUIStore.getState().addToast("temp", "success");
      expect(useUIStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(4000);

      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it("auto-removes each toast independently", () => {
      useUIStore.getState().addToast("first", "info");
      vi.advanceTimersByTime(2000);

      useUIStore.getState().addToast("second", "error");
      expect(useUIStore.getState().toasts).toHaveLength(2);

      vi.advanceTimersByTime(2000);
      expect(useUIStore.getState().toasts).toHaveLength(1);
      expect(useUIStore.getState().toasts[0].message).toBe("second");

      vi.advanceTimersByTime(2000);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });
  });

  describe("removeToast", () => {
    it("removes a specific toast by id", () => {
      useUIStore.getState().addToast("a", "info");
      useUIStore.getState().addToast("b", "error");

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(2);

      useUIStore.getState().removeToast(toasts[0].id);
      expect(useUIStore.getState().toasts).toHaveLength(1);
      expect(useUIStore.getState().toasts[0].message).toBe("b");
    });
  });

  describe("setActivePage", () => {
    it("changes the active page", () => {
      expect(useUIStore.getState().activePage).toBe("changes");

      useUIStore.getState().setActivePage("branches");

      expect(useUIStore.getState().activePage).toBe("branches");
    });

    it("can switch back to changes", () => {
      useUIStore.getState().setActivePage("branches");
      useUIStore.getState().setActivePage("changes");

      expect(useUIStore.getState().activePage).toBe("changes");
    });
  });

  describe("openModal / closeModal", () => {
    it("opens a modal by id", () => {
      expect(useUIStore.getState().activeModal).toBeNull();

      useUIStore.getState().openModal("create-branch");

      expect(useUIStore.getState().activeModal).toBe("create-branch");
    });

    it("closes the active modal", () => {
      useUIStore.getState().openModal("delete");

      useUIStore.getState().closeModal();

      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it("replaces the active modal when opening a new one", () => {
      useUIStore.getState().openModal("rename");
      useUIStore.getState().openModal("merge");

      expect(useUIStore.getState().activeModal).toBe("merge");
    });
  });
});
