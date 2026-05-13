import type { EditorExample } from "../../shared/examples/editorExamples";

interface TopbarProps {
  onRun: () => void;
  onClearConsole: () => void;
  onClearEditor: () => void;
  onLoadExample: (exampleId: string) => void;
  isRunning: boolean;
  selectedExampleId: string;
  examples: EditorExample[];
}

export function Topbar({
  onRun,
  onClearConsole,
  onClearEditor,
  onLoadExample,
  isRunning,
  selectedExampleId,
  examples,
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
        <label className="topbar__selectWrap">
          <span className="topbar__selectLabel">Ejemplos</span>
          <select
            className="topbar__select"
            value={selectedExampleId}
            onChange={(event) => onLoadExample(event.target.value)}
            disabled={isRunning}
          >
            {examples.map((example) => (
              <option key={example.id} value={example.id}>
                {example.label}
              </option>
            ))}
          </select>
        </label>

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

          <button
            className="btn btn--primary"
            onClick={onRun}
            disabled={isRunning}
          >
            {isRunning ? "Ejecutando..." : "Ejecutar"}
          </button>
        </div>

        <div className={`run-indicator ${isRunning ? "is-running" : ""}`}>
          <span className="run-indicator__dot" />
          <span>{isRunning ? "En ejecución" : "Listo"}</span>
        </div>
      </div>
    </header>
  );
}