interface TopbarProps {
  onRun: () => void;
  onClearConsole: () => void;
}

export function Topbar({ onRun, onClearConsole }: TopbarProps) {
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

      <div className="topbar__actions">
        <button className="btn btn--secondary" onClick={onClearConsole}>
          Limpiar consola
        </button>
        <button className="btn btn--primary" onClick={onRun}>
          Ejecutar
        </button>
      </div>
    </header>
  );
}