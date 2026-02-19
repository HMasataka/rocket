import type { ReactNode } from "react";
import { Sidebar } from "../organisms/Sidebar";
import { Statusbar } from "../organisms/Statusbar";
import { Titlebar } from "../organisms/Titlebar";

interface AppShellProps {
  branch: string | null;
  changesCount: number;
  children: ReactNode;
}

export function AppShell({ branch, changesCount, children }: AppShellProps) {
  return (
    <div className="app">
      <Titlebar />
      <div className="main-layout">
        <Sidebar changesCount={changesCount} />
        <main className="content">{children}</main>
      </div>
      <Statusbar branch={branch} />
    </div>
  );
}
