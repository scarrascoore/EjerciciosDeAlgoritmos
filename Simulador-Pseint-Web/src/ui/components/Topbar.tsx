interface TopbarProps {
  onRun: () => void;
  onStop: () => void;
  onClearConsole: () => void;
  onClearEditor: () => void;
  isRunning: boolean;
}

export function Topbar({
  onRun,
  onStop,
  onClearConsole,
  onClearEditor,
  isRunning,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__logo">{`</>`}</span>
        <div>
          <h1 className="topbar__title">Simulador PSeInt Web</h1>
          <p className="topbar__subtitle">
            Editor de pseudocódigo y consola de salida
          </p>
        </div>
      </div>

      <div className="topbar__controls">
        <div className="topbar__actions">
          <button
            className="btn btn--secondary"
            onClick={onClearEditor}
            disabled={isRunning}
          >
            Limpiar editor
          </button>

          <button
            className="btn btn--secondary"
            onClick={onClearConsole}
            disabled={isRunning}
          >
            Reiniciar consola
          </button>

          {!isRunning ? (
            <button className="btn btn--primary" onClick={onRun}>
              Ejecutar
            </button>
          ) : (
            <button className="btn btn--danger" onClick={onStop}>
              Detener
            </button>
          )}
        </div>

        <div className={`run-indicator ${isRunning ? "is-running" : ""}`}>
          <span className="run-indicator__dot" />
          <span>{isRunning ? "En ejecución" : "Listo"}</span>
        </div>
      </div>
    </header>
  );
}