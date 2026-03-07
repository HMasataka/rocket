import type { ReactNode } from "react";
import type { RemoteInfo } from "../../services/git";
import { useUIStore } from "../../stores/uiStore";
import { Sidebar } from "../organisms/Sidebar";
import { Statusbar } from "../organisms/Statusbar";
import { Titlebar } from "../organisms/Titlebar";
import { Toolbar } from "../organisms/Toolbar";

interface AppShellProps {
  branch: string | null;
  merging?: boolean;
  rebasing?: boolean;
  changesCount: number;
  hasRemotes: boolean;
  remotes: RemoteInfo[];
  onFetch: () => void;
  onPull: () => void;
  onPush: () => void;
  onTags: () => void;
  onRemote: () => void;
  children: ReactNode;
}

export function AppShell({
  branch,
  merging,
  rebasing,
  changesCount,
  hasRemotes,
  remotes,
  onFetch,
  onPull,
  onPush,
  onTags,
  onRemote,
  children,
}: AppShellProps) {
  const defaultRemoteName = remotes[0]?.name ?? null;
  const activePage = useUIStore((s) => s.activePage);
  const hideSidebar = activePage === "open-repository";

  return (
    <div className="app">
      <Titlebar />
      <Toolbar
        branch={branch}
        defaultRemoteName={defaultRemoteName}
        onFetch={onFetch}
        onPull={onPull}
        onPush={onPush}
        onTags={onTags}
        onRemote={onRemote}
        disabled={!hasRemotes}
      />
      <div className="main-layout">
        {!hideSidebar && <Sidebar changesCount={changesCount} />}
        <main className="content">{children}</main>
      </div>
      <Statusbar branch={branch} merging={merging} rebasing={rebasing} />
    </div>
  );
}
