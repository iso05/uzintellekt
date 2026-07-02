#!/usr/bin/env bash
# Drift-guard: the shared UI layer lives in packages/ui and is imported via the
# @shared alias. No app may reintroduce a local src/shared copy or @/shared
# imports — that is exactly how dashboard and admin diverged before unification.
set -euo pipefail

cd "$(dirname "$0")/.."

fail=0

for app in admin dashboard; do
  if [ -d "$app/src/shared" ]; then
    echo "❌ $app/src/shared exists — shared code must live in packages/ui (import via @shared)."
    fail=1
  fi
done

hits="$(grep -rn "@/shared/" admin/src dashboard/src \
  --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.cjs' \
  2>/dev/null || true)"
if [ -n "$hits" ]; then
  echo "❌ Found '@/shared/' imports — use '@shared/' (packages/ui) instead:"
  echo "$hits"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "✅ No local src/shared and no @/shared imports — the shared layer is unified in packages/ui."
fi

exit $fail
