import Editor from "@monaco-editor/react";

interface EditorPaneProps {
  code: string;
  onChange: (value: string) => void;
}

export function EditorPane({ code, onChange }: EditorPaneProps) {
  return (
    <section className="pane pane--editor">
      <div className="pane__header">
        <span className="pane__label">EDITOR DE PSEUDOCÓDIGO</span>
      </div>

      <div className="pane__body">
        <Editor
          height="100%"
          defaultLanguage="plaintext"
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineNumbers: "on",
          }}
        />
      </div>
    </section>
  );
}