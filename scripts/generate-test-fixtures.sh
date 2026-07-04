#!/usr/bin/env bash
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "This script is intended to run only in GitHub Actions. It did not run locally."
  exit 2
fi

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

mkdir -p test-fixtures/generated
python3 - <<'PY'
from pathlib import Path
root = Path("test-fixtures/generated")
root.mkdir(parents=True, exist_ok=True)
(root / "large-text.txt").write_text("HA_Codex_UI fixture\n" * 10000, encoding="utf-8")
PY
echo "Generated non-secret test fixtures."
