#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="${REPO_ROOT}/extensions/gh-actions-insights"
EXTENSION_REPO="${EXTENSION_REPO:-mzbrau/gh-actions-insights}"
TAG="${1:-}"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "${WORKDIR}"' EXIT

cp "${EXT_DIR}/gh-actions-insights" "${WORKDIR}/"
cp "${EXT_DIR}/gh-manifest.yml" "${WORKDIR}/"
cp "${EXT_DIR}/README.md" "${WORKDIR}/"
cp "${REPO_ROOT}/LICENSE" "${WORKDIR}/"
mkdir -p "${WORKDIR}/scripts"
cp "${REPO_ROOT}/scripts/init-history-repo.sh" "${WORKDIR}/scripts/"
cp "${REPO_ROOT}/scripts/update-history-repo.sh" "${WORKDIR}/scripts/"
cp "${REPO_ROOT}/scripts/import-history-repo.sh" "${WORKDIR}/scripts/"
cp "${REPO_ROOT}/scripts/history-repo-lib.sh" "${WORKDIR}/scripts/"
cp "${REPO_ROOT}/scripts/prepare-standalone-web.sh" "${WORKDIR}/scripts/"

chmod +x "${WORKDIR}/gh-actions-insights" \
  "${WORKDIR}/scripts/init-history-repo.sh" \
  "${WORKDIR}/scripts/update-history-repo.sh" \
  "${WORKDIR}/scripts/import-history-repo.sh" \
  "${WORKDIR}/scripts/history-repo-lib.sh" \
  "${WORKDIR}/scripts/prepare-standalone-web.sh"

pushd "${WORKDIR}" >/dev/null
git init -b main
git add -A
git commit -m "Release extension${TAG:+ ${TAG}}"

if gh repo view "${EXTENSION_REPO}" >/dev/null 2>&1; then
  git remote add origin "https://github.com/${EXTENSION_REPO}.git"
  git push -f origin main
else
  gh repo create "${EXTENSION_REPO}" --public --source=. --remote=origin --push
  gh api -X PUT "repos/${EXTENSION_REPO}/topics" -f names='["gh-extension"]' || true
fi

if [[ -n "${TAG}" ]]; then
  git tag "${TAG}"
  git push origin "${TAG}"
fi
popd >/dev/null

echo "Published ${EXTENSION_REPO}"
echo "Install with: gh extension install ${EXTENSION_REPO}"
