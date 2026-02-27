import { useState } from "react";
import { Modal } from "./Modal";
import { SettingsAiTab } from "./SettingsAiTab";
import { SettingsAppearanceTab } from "./SettingsAppearanceTab";
import { SettingsEditorTab } from "./SettingsEditorTab";
import { SettingsKeybindingsTab } from "./SettingsKeybindingsTab";
import { SettingsToolsTab } from "./SettingsToolsTab";

type SettingsTabId = "appearance" | "editor" | "keybindings" | "tools" | "ai";

const TABS: { id: SettingsTabId; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "editor", label: "Editor" },
  { id: "keybindings", label: "Keybindings" },
  { id: "tools", label: "External Tools" },
  { id: "ai", label: "AI Settings" },
];

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("appearance");

  return (
    <Modal title="Settings" className="settings-modal" onClose={onClose}>
      <div className="settings-layout">
        <nav className="settings-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-nav-item${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="settings-content">
          {activeTab === "appearance" && <SettingsAppearanceTab />}
          {activeTab === "editor" && <SettingsEditorTab />}
          {activeTab === "keybindings" && <SettingsKeybindingsTab />}
          {activeTab === "tools" && <SettingsToolsTab />}
          {activeTab === "ai" && <SettingsAiTab />}
        </div>
      </div>
    </Modal>
  );
}
