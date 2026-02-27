import { useCallback, useEffect } from "react";
import { createPullRequestUrl, openInBrowser } from "../../services/hosting";
import { useGitStore } from "../../stores/gitStore";
import { useHostingStore } from "../../stores/hostingStore";
import { useUIStore } from "../../stores/uiStore";
import { IssueList } from "./IssueList";
import { PrDetailPanel } from "./PrDetailPanel";
import { PrList } from "./PrList";

export function HostingPage() {
  const hostingInfo = useHostingStore((s) => s.hostingInfo);
  const pullRequests = useHostingStore((s) => s.pullRequests);
  const issues = useHostingStore((s) => s.issues);
  const selectedPrDetail = useHostingStore((s) => s.selectedPrDetail);
  const selectedPrNumber = useHostingStore((s) => s.selectedPrNumber);
  const activeTab = useHostingStore((s) => s.activeTab);
  const loading = useHostingStore((s) => s.loading);
  const defaultBranch = useHostingStore((s) => s.defaultBranch);
  const fetchHostingInfo = useHostingStore((s) => s.fetchHostingInfo);
  const fetchDefaultBranch = useHostingStore((s) => s.fetchDefaultBranch);
  const fetchPullRequests = useHostingStore((s) => s.fetchPullRequests);
  const fetchIssues = useHostingStore((s) => s.fetchIssues);
  const selectPr = useHostingStore((s) => s.selectPr);
  const setActiveTab = useHostingStore((s) => s.setActiveTab);
  const currentBranch = useGitStore((s) => s.currentBranch);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    fetchHostingInfo().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchDefaultBranch().catch(() => {});
    fetchPullRequests().catch((e: unknown) => {
      addToast(String(e), "error");
    });
    fetchIssues().catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [
    fetchHostingInfo,
    fetchDefaultBranch,
    fetchPullRequests,
    fetchIssues,
    addToast,
  ]);

  const handleOpenInBrowser = useCallback(() => {
    if (!hostingInfo) return;
    openInBrowser(hostingInfo.url).catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [hostingInfo, addToast]);

  const handleCreatePr = useCallback(() => {
    if (!currentBranch) return;
    const base = defaultBranch ?? "main";
    createPullRequestUrl(currentBranch, base)
      .then((url) => openInBrowser(url))
      .catch((e: unknown) => {
        addToast(String(e), "error");
      });
  }, [currentBranch, defaultBranch, addToast]);

  const handleViewOnGitHub = useCallback(() => {
    if (!hostingInfo || !selectedPrNumber) return;
    const url = `${hostingInfo.url}/pull/${selectedPrNumber}`;
    openInBrowser(url).catch((e: unknown) => {
      addToast(String(e), "error");
    });
  }, [hostingInfo, selectedPrNumber, addToast]);

  return (
    <div className="hosting-layout">
      <div className="hosting-header">
        <div className="hosting-info">
          <div
            className={`provider-badge ${hostingInfo?.provider.toLowerCase() ?? "github"}`}
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              role="img"
              aria-label="Provider"
            >
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            {hostingInfo?.provider ?? "GitHub"}
          </div>
          <span className="hosting-repo">
            {hostingInfo
              ? `${hostingInfo.owner}/${hostingInfo.repo}`
              : "Loading..."}
          </span>
        </div>
        <div className="hosting-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleOpenInBrowser}
          >
            Open in Browser
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCreatePr}
          >
            Create PR
          </button>
        </div>
      </div>

      <div className="hosting-tabs">
        <button
          type="button"
          className={`hosting-tab${activeTab === "pulls" ? " active" : ""}`}
          onClick={() => setActiveTab("pulls")}
        >
          Pull Requests
          <span className="tab-count">{pullRequests.length}</span>
        </button>
        <button
          type="button"
          className={`hosting-tab${activeTab === "issues" ? " active" : ""}`}
          onClick={() => setActiveTab("issues")}
        >
          Issues
          <span className="tab-count">{issues.length}</span>
        </button>
      </div>

      <div className="hosting-content">
        {activeTab === "pulls" && (
          <>
            <PrList
              pullRequests={pullRequests}
              selectedNumber={selectedPrNumber}
              onSelect={selectPr}
            />
            <PrDetailPanel
              detail={selectedPrDetail}
              loading={loading}
              onViewOnGitHub={handleViewOnGitHub}
            />
          </>
        )}
        {activeTab === "issues" && <IssueList issues={issues} />}
      </div>
    </div>
  );
}
