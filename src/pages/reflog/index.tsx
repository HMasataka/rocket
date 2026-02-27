import { useCallback, useEffect, useState } from "react";
import type { ReflogEntry } from "../../services/reflog";
import { getReflog } from "../../services/reflog";
import { useGitStore } from "../../stores/gitStore";
import { useUIStore } from "../../stores/uiStore";
import { ReflogTable } from "./organisms/ReflogTable";

const REFLOG_LIMIT = 100;

export function ReflogPage() {
  const [entries, setEntries] = useState<ReflogEntry[]>([]);
  const checkoutBranch = useGitStore((s) => s.checkoutBranch);
  const resetToCommit = useGitStore((s) => s.resetToCommit);
  const fetchStatus = useGitStore((s) => s.fetchStatus);
  const fetchBranch = useGitStore((s) => s.fetchBranch);
  const addToast = useUIStore((s) => s.addToast);

  const loadReflog = useCallback(() => {
    getReflog("HEAD", REFLOG_LIMIT)
      .then(setEntries)
      .catch((e: unknown) => addToast(String(e), "error"));
  }, [addToast]);

  useEffect(() => {
    loadReflog();
  }, [loadReflog]);

  const handleCheckout = useCallback(
    async (oid: string) => {
      try {
        await checkoutBranch(oid);
        addToast(`Checked out ${oid.slice(0, 7)} (detached HEAD)`, "success");
        await fetchBranch();
        await fetchStatus();
        loadReflog();
      } catch (e: unknown) {
        addToast(`Checkout failed: ${String(e)}`, "error");
      }
    },
    [checkoutBranch, addToast, fetchBranch, fetchStatus, loadReflog],
  );

  const handleResetToHere = useCallback(
    async (oid: string) => {
      try {
        await resetToCommit(oid, "mixed");
        addToast(`Reset (mixed) to ${oid.slice(0, 7)} completed`, "success");
        await fetchStatus();
        await fetchBranch();
        loadReflog();
      } catch (e: unknown) {
        addToast(`Reset failed: ${String(e)}`, "error");
      }
    },
    [resetToCommit, addToast, fetchStatus, fetchBranch, loadReflog],
  );

  return (
    <div className="operation-layout">
      <div className="operation-header">
        <div className="operation-info">
          <h2 className="operation-title">Reflog</h2>
          <span className="operation-desc">HEAD movement history</span>
        </div>
      </div>
      <div className="reflog-content">
        <ReflogTable
          entries={entries}
          onCheckout={handleCheckout}
          onResetToHere={handleResetToHere}
        />
      </div>
    </div>
  );
}
