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
  if [[ -n "${WORKDIR}" ]]; then
    rm -rf "${WORKDIR}"
  fi
}

trap cleanup EXIT

usage() {
  cat <<EOF
Usage: import-history-repo.sh import <source-repo> <history-repo> [flags]

Import historical test results from workflow artifacts into a history repository,
then open a pull request.

Flags:
  --artifact-name <name>     Artifact name to download (repeatable)
  --artifact-pattern <glob>  Artifact name glob (repeatable)
  --test-results-glob <glob> Glob inside artifact (default: **/*.{trx,xml})
  --workflow <name|id>       Filter by workflow
  --branch <name>            Filter by branch
  --since <ISO date>         Only runs after date
  --limit <n>                Max runs to scan (default: 50)
  --history-limit <n>        Branch history limit (default: 20)
  --retain-days <n>          Retention window (default: 30)
  --data-path <path>         History data root (default: data)
  --dry-run                  Print planned actions without executing
  --yes, -y                  Proceed without confirmation
  -h, --help                 Show help

Requires gh, git, and node (>=20).

Install without cloning this repository:

  curl -fsSL https://raw.githubusercontent.com/${SOURCE_REPO}/main/scripts/import-history-repo.sh | \\
    bash -s -- import <owner>/<source-repo> <owner>/<history-repo>
EOF
}

SOURCE_REPO_ARG=""
HISTORY_REPO=""
DRY_RUN=false
ASSUME_YES=false
COMMAND=""
BRANCH=""
IMPORT_TEST_GLOB="**/*.{trx,xml}"
IMPORT_WORKFLOW=""
IMPORT_BRANCH=""
IMPORT_SINCE=""
IMPORT_LIMIT="50"
IMPORT_HISTORY_LIMIT="20"
IMPORT_RETAIN_DAYS="30"
IMPORT_DATA_PATH="data"
IMPORT_ARTIFACT_NAMES=()
IMPORT_ARTIFACT_PATTERNS=()

resolve_import_script() {
  if [[ -f "${SCRIPT_DIR}/import-history.ts" ]]; then
    echo "${SCRIPT_DIR}/import-history.ts"
    return
  fi
  if [[ -f "${SCRIPT_DIR}/../scripts/import-history.ts" ]]; then
    echo "${SCRIPT_DIR}/../scripts/import-history.ts"
    return
  fi
  echo ""
}

resolve_monorepo_root() {
  if [[ -f "${SCRIPT_DIR}/import-history.ts" ]]; then
    cd "${SCRIPT_DIR}/.." && pwd
    return
  fi
  if [[ -f "${SCRIPT_DIR}/../scripts/import-history.ts" ]]; then
    cd "${SCRIPT_DIR}/../.." && pwd
    return
  fi
  echo ""
}

run_import_ts() {
  local import_script repo_root
  import_script="$(resolve_import_script)"
  repo_root="$(resolve_monorepo_root)"

  if [[ -z "${import_script}" || -z "${repo_root}" ]]; then
    echo "import-history.ts not found. Run from an actions-insights checkout." >&2
    exit 1
  fi

  local args=(
    "${SOURCE_REPO_ARG}"
    --repo-path "${WORKDIR}/repo"
    --test-results-glob "${IMPORT_TEST_GLOB}"
    --limit "${IMPORT_LIMIT}"
    --history-limit "${IMPORT_HISTORY_LIMIT}"
    --retain-days "${IMPORT_RETAIN_DAYS}"
    --data-path "${IMPORT_DATA_PATH}"
  )
  local name
  for name in "${IMPORT_ARTIFACT_NAMES[@]}"; do
    args+=(--artifact-name "${name}")
  done
  for name in "${IMPORT_ARTIFACT_PATTERNS[@]}"; do
    args+=(--artifact-pattern "${name}")
  done
  if [[ -n "${IMPORT_WORKFLOW}" ]]; then
    args+=(--workflow "${IMPORT_WORKFLOW}")
  fi
  if [[ -n "${IMPORT_BRANCH}" ]]; then
    args+=(--branch "${IMPORT_BRANCH}")
  fi
  if [[ -n "${IMPORT_SINCE}" ]]; then
    args+=(--since "${IMPORT_SINCE}")
  fi
  if [[ "${DRY_RUN}" == true ]]; then
    args+=(--dry-run)
  fi

  pushd "${repo_root}" >/dev/null
  npx tsx "${import_script}" "${args[@]}"
  popd >/dev/null
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    import)
      COMMAND="import"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --artifact-name)
      IMPORT_ARTIFACT_NAMES+=("$2")
      shift 2
      ;;
    --artifact-pattern)
      IMPORT_ARTIFACT_PATTERNS+=("$2")
      shift 2
      ;;
    --test-results-glob)
      IMPORT_TEST_GLOB="$2"
      shift 2
      ;;
    --workflow)
      IMPORT_WORKFLOW="$2"
      shift 2
      ;;
    --branch)
      IMPORT_BRANCH="$2"
      shift 2
      ;;
    --since)
      IMPORT_SINCE="$2"
      shift 2
      ;;
    --limit)
      IMPORT_LIMIT="$2"
      shift 2
      ;;
    --history-limit)
      IMPORT_HISTORY_LIMIT="$2"
      shift 2
      ;;
    --retain-days)
      IMPORT_RETAIN_DAYS="$2"
      shift 2
      ;;
    --data-path)
      IMPORT_DATA_PATH="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --yes|-y)
      ASSUME_YES=true
      shift
      ;;
    *)
      if [[ -z "${SOURCE_REPO_ARG}" ]]; then
        SOURCE_REPO_ARG="$1"
      elif [[ -z "${HISTORY_REPO}" ]]; then
        HISTORY_REPO="$1"
      else
        echo "Unknown argument: $1" >&2
        usage
        exit 1
      fi
      shift
      ;;
  esac
done

if [[ "${COMMAND}" != "import" ]]; then
  usage
  exit 1
fi

if [[ -z "${SOURCE_REPO_ARG}" || -z "${HISTORY_REPO}" ]]; then
  echo "Source and history repositories are required: import <source-repo> <history-repo>" >&2
  usage
  exit 1
fi

if [[ "${SOURCE_REPO_ARG}" != */* || "${HISTORY_REPO}" != */* ]]; then
  echo "Repositories must be owner/repo." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required on PATH." >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required on PATH." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node (>=20) is required on PATH." >&2
  exit 1
fi

if ! gh repo view "${SOURCE_REPO_ARG}" >/dev/null 2>&1; then
  echo "Source repository not found or not accessible: ${SOURCE_REPO_ARG}" >&2
  exit 1
fi

if ! gh repo view "${HISTORY_REPO}" >/dev/null 2>&1; then
  echo "History repository not found or not accessible: ${HISTORY_REPO}" >&2
  exit 1
fi

SOURCE_KEY="${SOURCE_REPO_ARG//\//.}"
BRANCH="actions-insights/import-${SOURCE_KEY}-$(date +%Y%m%d)"

if [[ "${DRY_RUN}" == true ]]; then
  print_import_plan_summary
  WORKDIR="$(mktemp -d)"
  git clone "https://github.com/${HISTORY_REPO}.git" "${WORKDIR}/repo"
  run_import_ts
  exit 0
fi

history_repo_require_confirmation print_import_plan_summary edit_import_settings "${ASSUME_YES}"

WORKDIR="$(mktemp -d)"
git clone "https://github.com/${HISTORY_REPO}.git" "${WORKDIR}/repo"
validate_history_repo "${WORKDIR}/repo"

pushd "${WORKDIR}/repo" >/dev/null
git checkout -b "${BRANCH}"
popd >/dev/null

if ! run_import_ts; then
  echo "Import finished with no new runs written." >&2
  exit 1
fi

pushd "${WORKDIR}/repo" >/dev/null
git add -A
if git diff --cached --quiet; then
  echo "No history changes to commit."
  exit 0
fi

git commit -m "actions-insights: import history for ${SOURCE_REPO_ARG}"
git push -u origin "${BRANCH}"

PR_URL="$(gh pr create \
  --title "Import Actions Insights history for ${SOURCE_REPO_ARG}" \
  --body "$(cat <<EOF
Backfill test history for [\`${SOURCE_REPO_ARG}\`](https://github.com/${SOURCE_REPO_ARG}) from workflow artifacts.

## Import settings
- Artifacts: $(import_artifact_label)
- Test results glob: \`${IMPORT_TEST_GLOB}\`
- Workflow filter: $(import_workflow_label)
- Branch filter: $(import_branch_label)
- Since: $(import_since_label)
- Run limit: ${IMPORT_LIMIT}

\`web/\` and \`config.json\` are unchanged.
EOF
)")"

popd >/dev/null

echo "Pull request created: ${PR_URL}"
