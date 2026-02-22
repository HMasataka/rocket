import type { ReactNode } from "react";
import { Sidebar } from "../organisms/Sidebar";
import { Statusbar } from "../organisms/Statusbar";
import { Titlebar } from "../organisms/Titlebar";
import { Toolbar } from "../organisms/Toolbar";

interface AppShellProps {
  branch: string | null;
  changesCount: number;
  hasRemotes: boolean;
  onFetch: () => void;
  onPull: () => void;
  onPush: () => void;
  onRemote: () => void;
  children: ReactNode;
}

export function AppShell({
  branch,
  changesCount,
  hasRemotes,
  onFetch,
  onPull,
  onPush,
  onRemote,
  children,
}: AppShellProps) {
  return (
    <div className="app">
      <Titlebar />
      <Toolbar
        onFetch={onFetch}
        onPull={onPull}
        onPush={onPush}
        onRemote={onRemote}
        disabled={!hasRemotes}
      />
      <div className="main-layout">
        <Sidebar changesCount={changesCount} />
        <main className="content">{children}</main>
      </div>
      <Statusbar branch={branch} />
    </div>
  );
}
