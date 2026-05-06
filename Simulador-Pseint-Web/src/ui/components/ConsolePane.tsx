import type { ConsoleLine } from "../../domain/models/ConsoleLine";

interface ConsolePaneProps {
  lines: ConsoleLine[];
}

export function ConsolePane({ lines }: ConsolePaneProps) {
  return (
    <section className="pane pane--console">
      <div className="pane__header">
        <span className="pane__label">CONSOLA DE SALIDA</span>
      </div>

      <div className="console">
        {lines.length === 0 ? (
          <div className="console__empty">
            La consola está vacía. Presiona "Ejecutar".
          </div>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className={`console__line console__line--${line.kind}`}
            >
              {line.timestamp && (
                <span className="console__timestamp">[{line.timestamp}]</span>
              )}
              <span>{line.text}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}