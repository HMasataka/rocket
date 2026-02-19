export function Titlebar() {
  return (
    <div className="titlebar">
      <div className="window-controls">
        <div className="window-dot close" />
        <div className="window-dot minimize" />
        <div className="window-dot maximize" />
      </div>
      <span className="titlebar-title">Rocket</span>
    </div>
  );
}
