import type { DiagnosticsReport } from "../api/types";

type Props = {
  diagnostics: DiagnosticsReport | null;
};

export default function DiagnosticsPanel({ diagnostics }: Props) {
  return (
    <section className="diagnostics-panel">
      <h3>Diagnostics</h3>
      <div className="diagnostic-list">
        {(diagnostics?.checks ?? []).map((check) => (
          <div className="diagnostic-row" data-status={check.status} key={check.id}>
            <span>{check.label}</span>
            <strong>{check.status}</strong>
          </div>
        ))}
        {!diagnostics && <p className="empty-state">Loading diagnostics.</p>}
      </div>
    </section>
  );
}
