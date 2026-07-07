#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_REPO="${ACTIONS_INSIGHTS_SOURCE:-mzbrau/actions-insights}"
SOURCE_REF="${ACTIONS_INSIGHTS_REF:-main}"

if [[ -f "${SCRIPT_DIR}/history-repo-lib.sh" ]]; then
  # shellcheck source=history-repo-lib.sh
  source "${SCRIPT_DIR}/history-repo-lib.sh"
else
  _LIB_TMP="$(mktemp)"
  curl -fsSL \
    "https://raw.githubusercontent.com/${SOURCE_REPO}/${SOURCE_REF}/scripts/history-repo-lib.sh" \
    -o "${_LIB_TMP}"
  # shellcheck source=/dev/null
  source "${_LIB_TMP}"
  rm -f "${_LIB_TMP}"
fi
WORKDIR=""

cleanup() {
  cleanup_source_checkout
  if [[ -n "${WORKDIR}" ]]; then
    rm -rf "${WORKDIR}"
  fi
}

trap cleanup EXIT

usage() {
  cat <<EOF
Usage: update-history-repo.sh update <owner/repo> [flags]

Update an Actions Insights history repository dashboard and Pages workflow,
then open a pull request.

Flags:
  --source-ref <ref>  actions-insights ref to sync from (default: main)
  --verify            Run npm ci and build while preparing web/
  --dry-run           Print actions without executing
  -h, --help          Show help

Install without cloning this repository:

  curl -fsSL https://raw.githubusercontent.com/${SOURCE_REPO}/main/scripts/update-history-repo.sh | \\
    bash -s -- update <owner>/<history-repo>
EOF
}

FULL_REPO=""
DRY_RUN=false
VERIFY=false
COMMAND=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    update)
      COMMAND="update"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --source-ref)
      SOURCE_REF="$2"
      shift 2
      ;;
    --verify)
      VERIFY=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      if [[ -z "${FULL_REPO}" ]]; then
        FULL_REPO="$1"
        shift
      else
        echo "Unknown argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ "${COMMAND}" != "update" ]]; then
  usage
  exit 1
fi

if [[ -z "${FULL_REPO}" ]]; then
  echo "History repository is required: update <owner/repo>" >&2
  usage
  exit 1
fi

if [[ "${FULL_REPO}" != */* ]]; then
  echo "History repository must be owner/repo, got: ${FULL_REPO}" >&2
  exit 1
fi

if ! gh repo view "${FULL_REPO}" >/dev/null 2>&1; then
  echo "Repository not found or not accessible: ${FULL_REPO}" >&2
  exit 1
fi

BRANCH="actions-insights/update-dashboard-$(date +%Y%m%d)"

if [[ "${DRY_RUN}" == true ]]; then
  echo "[dry-run] gh repo view ${FULL_REPO}"
  echo "[dry-run] git clone https://github.com/${FULL_REPO}.git"
  echo "[dry-run] validate_history_repo"
  echo "[dry-run] sync web/ and .github/workflows/pages.yml from ${SOURCE_REPO}@${SOURCE_REF}"
  echo "[dry-run] ensure .gitignore and untrack web/node_modules if needed"
  echo "[dry-run] git checkout -b ${BRANCH}"
  echo "[dry-run] git commit and push"
  echo "[dry-run] gh pr create"
  exit 0
fi

resolve_source_dirs

if [[ ! -d "${TEMPLATE_DIR}" ]]; then
  echo "Templates not found at ${TEMPLATE_DIR}." >&2
  exit 1
fi

WORKDIR="$(mktemp -d)"
git clone "https://github.com/${FULL_REPO}.git" "${WORKDIR}/repo"

validate_history_repo "${WORKDIR}/repo"

pushd "${WORKDIR}/repo" >/dev/null
git checkout -b "${BRANCH}"
popd >/dev/null

sync_dashboard "${WORKDIR}/repo" "${VERIFY}"
ensure_gitignore "${WORKDIR}/repo"
untrack_node_modules "${WORKDIR}/repo"
rm -rf "${WORKDIR}/repo/web/node_modules" "${WORKDIR}/repo/web/dist"

pushd "${WORKDIR}/repo" >/dev/null
git add -A
if git diff --cached --quiet; then
  echo "History repository is already up to date with ${SOURCE_REPO}@${SOURCE_REF}."
  exit 0
fi

git commit -m "Update Actions Insights dashboard from ${SOURCE_REPO}@${SOURCE_REF}"
git push -u origin "${BRANCH}"

PR_URL="$(gh pr create \
  --title "Update Actions Insights dashboard" \
  --body "$(cat <<EOF
Sync dashboard and Pages workflow from [\`${SOURCE_REPO}\`](https://github.com/${SOURCE_REPO}) at \`${SOURCE_REF}\`.

## Changes
- \`web/\` React dashboard source
- \`web/vendor/history-models/\` vendored shared types
- \`web/package-lock.json\`
- \`.github/workflows/pages.yml\`
- \`.gitignore\` (added when missing)

\`data/\` and \`config.json\` are unchanged.
EOF
)")"

popd >/dev/null

echo "Pull request created: ${PR_URL}"
