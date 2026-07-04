import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { yaml } from "@codemirror/lang-yaml";
import { javascript } from "@codemirror/lang-javascript";
import { Save } from "lucide-react";
import type { FileReadResult } from "../api/types";

type Props = {
  file: FileReadResult | null;
  value: string;
  dirty: boolean;
  onChange: (value: string) => void;
  onSave: (confirmed?: boolean) => void;
};

export default function EditorPanel({ file, value, dirty, onChange, onSave }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || file?.binary) {
      return;
    }
    const extensions = [
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      file?.name.endsWith(".ts") || file?.name.endsWith(".js") ? javascript() : yaml(),
    ];
    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [file?.binary, file?.name, file?.path]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) {
      return;
    }
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  return (
    <section className="editor-panel">
      <div className="panel-heading">
        <h2>{file ? file.name : "Editor"}</h2>
        <button type="button" disabled={!file || file.binary || !dirty || !file.writable} onClick={() => onSave(true)} title="Save">
          <Save size={16} /> Save
        </button>
      </div>
      {file?.binary && <p className="readonly-banner">Binary file metadata is shown; editing is disabled.</p>}
      {file && !file.writable && <p className="readonly-banner">Read-only by policy.</p>}
      {!file && <p className="empty-state">Open a text file.</p>}
      {file && !file.binary && <div className="codemirror-host" ref={containerRef} />}
      {dirty && <span className="dirty-dot">Unsaved</span>}
    </section>
  );
}
