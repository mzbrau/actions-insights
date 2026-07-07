#!/usr/bin/env bash
set -euo pipefail

SOURCE_REPO="${ACTIONS_INSIGHTS_SOURCE:-mzbrau/actions-insights}"
SOURCE_REF="${ACTIONS_INSIGHTS_REF:-main}"
SOURCE_CHECKOUT=""

cleanup() {
  if [[ -n "${SOURCE_CHECKOUT}" ]]; then
    rm -rf "${SOURCE_CHECKOUT}"
  fi
  if [[ -n "${WORKDIR:-}" ]]; then
    rm -rf "${WORKDIR}"
  fi
}

trap cleanup EXIT

resolve_source_dirs() {
  local script_dir repo_root
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  repo_root="$(cd "${script_dir}/.." && pwd)"

  if [[ -d "${repo_root}/templates/history-repo" ]]; then
    TEMPLATE_DIR="${repo_root}/templates/history-repo"
    WEB_DIR="${repo_root}/web"
    return
  fi

  SOURCE_CHECKOUT="$(mktemp -d)"
  git clone --depth 1 --branch "${SOURCE_REF}" \
    "https://github.com/${SOURCE_REPO}.git" "${SOURCE_CHECKOUT}/src"
  TEMPLATE_DIR="${SOURCE_CHECKOUT}/src/templates/history-repo"
  WEB_DIR="${SOURCE_CHECKOUT}/src/web"
}

usage() {
  cat <<'EOF'
Usage: init-history-repo.sh init [name] [flags]

Create an Actions Insights history repository with React dashboard and GitHub Pages.

Flags:
  --org <name>                 Create in organization
  --public                     Public repository (default)
  --private                    Private repository
  --default-repository <repo>  Default source repository (owner/repo)
  --dry-run                    Print actions without executing
  -h, --help                   Show help

Install without cloning this repository:

  curl -fsSL https://raw.githubusercontent.com/mzbrau/actions-insights/main/scripts/init-history-repo.sh | bash -s -- init
EOF
}

REPO_NAME=""
ORG_FLAG=""
VISIBILITY="--public"
DEFAULT_REPO=""
DRY_RUN=false
COMMAND=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    init)
      COMMAND="init"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --org)
      ORG_FLAG="$2"
      shift 2
      ;;
    --public)
      VISIBILITY="--public"
      shift
      ;;
    --private)
      VISIBILITY="--private"
      shift
      ;;
    --default-repository)
      DEFAULT_REPO="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      if [[ -z "${REPO_NAME}" ]]; then
        REPO_NAME="$1"
        shift
      else
        echo "Unknown argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ "${COMMAND}" != "init" ]]; then
  usage
  exit 1
fi

if [[ -z "${REPO_NAME}" ]]; then
  USER="$(gh api user -q .login)"
  REPO_NAME="${USER}-actions-insights"
fi

if [[ -n "${ORG_FLAG}" ]]; then
  FULL_REPO="${ORG_FLAG}/${REPO_NAME}"
else
  FULL_REPO="$(gh api user -q .login)/${REPO_NAME}"
fi

resolve_source_dirs

if [[ ! -d "${TEMPLATE_DIR}" ]]; then
  echo "Templates not found at ${TEMPLATE_DIR}." >&2
  exit 1
fi

echo "Creating history repository: ${FULL_REPO}"

if [[ "${DRY_RUN}" == true ]]; then
  echo "[dry-run] gh repo create ${FULL_REPO} ${VISIBILITY}"
  echo "[dry-run] Copy template from ${TEMPLATE_DIR}"
  echo "[dry-run] Enable GitHub Pages (GitHub Actions source)"
  exit 0
fi

if ! gh repo view "${FULL_REPO}" >/dev/null 2>&1; then
  gh repo create "${FULL_REPO}" ${VISIBILITY} --description "Actions Insights test history dashboard"
fi

WORKDIR="$(mktemp -d)"

git clone "https://github.com/${FULL_REPO}.git" "${WORKDIR}/repo"
cp -R "${TEMPLATE_DIR}/." "${WORKDIR}/repo/"
if [[ -d "${WEB_DIR}" ]]; then
  mkdir -p "${WORKDIR}/repo/web"
  cp -R "${WEB_DIR}/." "${WORKDIR}/repo/web/"
  rm -rf "${WORKDIR}/repo/web/node_modules" "${WORKDIR}/repo/web/dist"
fi

if [[ -n "${DEFAULT_REPO}" ]]; then
  node -e "
    const fs = require('fs');
    const p = '${WORKDIR}/repo/config.json';
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    cfg.defaultRepository = '${DEFAULT_REPO}';
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2) + '\n');
  "
fi

pushd "${WORKDIR}/repo" >/dev/null
git add -A
if git diff --cached --quiet; then
  echo "Repository already initialized."
else
  git commit -m "Initialize Actions Insights history repository"
  git push origin HEAD
fi
popd >/dev/null

OWNER="${FULL_REPO%%/*}"
REPO="${FULL_REPO##*/}"
gh api -X POST "repos/${FULL_REPO}/pages" \
  -f build_type=workflow \
  -f source[branch]=main \
  -f source[path]=/ 2>/dev/null || \
gh api -X PUT "repos/${FULL_REPO}/pages" \
  -f build_type=workflow \
  -f source[branch]=main \
  -f source[path]=/ || true

cat <<EOF

History repository ready: https://github.com/${FULL_REPO}

Next steps:
1. Create a PAT with contents:write on this repository
2. Add secret ACTIONS_INSIGHTS_HISTORY_TOKEN to your source repositories
3. Enable history publishing in your workflow:

  - uses: mzbrau/actions-insights@v1
    with:
      history-enabled: true
      history-repository: ${FULL_REPO}
      history-token: \${{ secrets.ACTIONS_INSIGHTS_HISTORY_TOKEN }}

Dashboard URL (after Pages deploy): https://${OWNER}.github.io/${REPO}/
EOF
