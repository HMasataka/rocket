import { Modal } from "./Modal";
import { SettingsAiTab } from "./SettingsAiTab";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <Modal title="Settings" className="settings-modal" onClose={onClose}>
      <div className="settings-layout">
        <nav className="settings-nav">
          <div className="settings-nav-item active">AI Settings</div>
        </nav>
        <div className="settings-content">
          <SettingsAiTab />
        </div>
      </div>
    </Modal>
  );
}
