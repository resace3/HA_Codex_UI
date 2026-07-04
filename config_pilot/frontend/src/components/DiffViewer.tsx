import type { DiffStatus } from "../api/types";

type Props = {
  diffStatus: DiffStatus | null;
  diffText?: string;
};

export default function DiffViewer({ diffStatus, diffText }: Props) {
  const lines = (diffText ?? "+ added line\n- removed line").split("\n").filter(Boolean);
  return (
    <section className="diff-viewer">
      <h3>Diffs</h3>
      <p>Source: {diffStatus?.source ?? "snapshot"}</p>
      <ul className="changed-files">
        {(diffStatus?.files ?? []).map((file) => (
          <li key={`${file.status}-${file.path}`}>
            <span>{file.status}</span> {file.path}
          </li>
        ))}
      </ul>
      <pre aria-label="Diff output">
        {lines.map((line) => (
          <span key={line} className={line.startsWith("+") ? "added" : line.startsWith("-") ? "removed" : ""}>
            {line}
            {"\n"}
          </span>
        ))}
      </pre>
    </section>
  );
}
