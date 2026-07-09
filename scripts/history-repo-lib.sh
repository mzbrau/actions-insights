#!/usr/bin/env bash

SOURCE_REPO="${ACTIONS_INSIGHTS_SOURCE:-mzbrau/actions-insights}"
SOURCE_REF="${ACTIONS_INSIGHTS_REF:-main}"
SOURCE_CHECKOUT=""
TEMPLATE_DIR=""
WEB_DIR=""
MODELS_DIR=""

resolve_source_dirs() {
  local script_dir repo_root
  script_dir="$(cd "$(dirname "${BASH_SOURCE[1]:-${BASH_SOURCE[0]}}")" && pwd)"
  repo_root="$(cd "${script_dir}/.." && pwd)"

  if [[ -d "${repo_root}/templates/history-repo" ]]; then
    TEMPLATE_DIR="${repo_root}/templates/history-repo"
    WEB_DIR="${repo_root}/web"
    MODELS_DIR="${repo_root}/packages/history-models"
    return
  fi

  SOURCE_CHECKOUT="$(mktemp -d)"
  git clone --depth 1 --branch "${SOURCE_REF}" \
    "https://github.com/${SOURCE_REPO}.git" "${SOURCE_CHECKOUT}/src"
  TEMPLATE_DIR="${SOURCE_CHECKOUT}/src/templates/history-repo"
  WEB_DIR="${SOURCE_CHECKOUT}/src/web"
  MODELS_DIR="${SOURCE_CHECKOUT}/src/packages/history-models"
}

validate_history_repo() {
  local repo_path="$1"

  if [[ ! -d "${repo_path}" ]]; then
    echo "Repository path not found: ${repo_path}" >&2
    return 1
  fi

  if [[ ! -f "${repo_path}/config.json" ]]; then
    echo "Not a history repository: missing config.json" >&2
    return 1
  fi

  if ! node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('${repo_path}/config.json', 'utf8'));
    if (!Object.prototype.hasOwnProperty.call(cfg, 'defaultRepository')) {
      process.exit(1);
    }
  "; then
    echo "Not a history repository: config.json is missing defaultRepository" >&2
    return 1
  fi

  if [[ ! -f "${repo_path}/data/repositories.json" ]]; then
    echo "Not a history repository: missing data/repositories.json" >&2
    return 1
  fi

  if [[ ! -f "${repo_path}/web/package.json" ]]; then
    echo "Not a history repository: missing web/package.json" >&2
    return 1
  fi

  if [[ ! -f "${repo_path}/.github/workflows/pages.yml" ]]; then
    echo "Not a history repository: missing .github/workflows/pages.yml" >&2
    return 1
  fi
}

sync_dashboard() {
  local repo_path="$1"
  local verify_flag="${2:-}"
  local script_dir prepare_script

  if [[ ! -d "${WEB_DIR}" ]]; then
    echo "Source web directory not found: ${WEB_DIR}" >&2
    return 1
  fi

  script_dir="$(cd "$(dirname "${BASH_SOURCE[1]:-${BASH_SOURCE[0]}}")" 2>/dev/null && pwd)" || script_dir=""
  if [[ -n "${script_dir}" && -f "${script_dir}/prepare-standalone-web.sh" ]]; then
    prepare_script="${script_dir}/prepare-standalone-web.sh"
  elif [[ -n "${SOURCE_CHECKOUT}" && -f "${SOURCE_CHECKOUT}/src/scripts/prepare-standalone-web.sh" ]]; then
    prepare_script="${SOURCE_CHECKOUT}/src/scripts/prepare-standalone-web.sh"
  else
    prepare_script="$(mktemp)"
    curl -fsSL \
      "https://raw.githubusercontent.com/${SOURCE_REPO}/${SOURCE_REF}/scripts/prepare-standalone-web.sh" \
      -o "${prepare_script}"
    chmod +x "${prepare_script}"
  fi

  mkdir -p "${repo_path}/web"
  cp -R "${WEB_DIR}/." "${repo_path}/web/"
  rm -rf "${repo_path}/web/node_modules" "${repo_path}/web/dist"

  printf 'export const APP_VERSION = %s;\n' \
    "$(node -e "console.log(JSON.stringify(process.argv[1]))" "${SOURCE_REF}")" \
    > "${repo_path}/web/src/version.ts"

  if [[ "${verify_flag}" == true ]]; then
    bash "${prepare_script}" --verify "${repo_path}/web" "${MODELS_DIR}"
  else
    bash "${prepare_script}" "${repo_path}/web" "${MODELS_DIR}"
  fi

  mkdir -p "${repo_path}/.github/workflows"
  cp "${TEMPLATE_DIR}/.github/workflows/pages.yml" \
    "${repo_path}/.github/workflows/pages.yml"
}

ensure_gitignore() {
  local repo_path="$1"

  if [[ -f "${repo_path}/.gitignore" ]]; then
    return
  fi

  if [[ -f "${TEMPLATE_DIR}/.gitignore" ]]; then
    cp "${TEMPLATE_DIR}/.gitignore" "${repo_path}/.gitignore"
  fi
}

untrack_node_modules() {
  local repo_path="$1"

  if git -C "${repo_path}" ls-files -- web/node_modules | grep -q .; then
    git -C "${repo_path}" rm -r --cached web/node_modules
  fi
}

cleanup_source_checkout() {
  if [[ -n "${SOURCE_CHECKOUT}" ]]; then
    rm -rf "${SOURCE_CHECKOUT}"
    SOURCE_CHECKOUT=""
  fi
}

history_repo_is_interactive() {
  [[ -t 0 ]] && return 0
  if [[ -r /dev/tty && -w /dev/tty ]]; then
    if (exec 3<>/dev/tty) 2>/dev/null; then
      exec 3<&-
      exec 3>&-
      return 0
    fi
  fi
  return 1
}

history_repo_prompt() {
  local prompt="$1"
  local __var_name="$2"
  if [[ -t 0 ]]; then
    # shellcheck disable=SC2162
    read -r -p "${prompt}" "${__var_name}"
    return 0
  fi
  if [[ -r /dev/tty && -w /dev/tty ]]; then
    # shellcheck disable=SC2162
    read -r -p "${prompt}" "${__var_name}" </dev/tty 2>/dev/null && return 0
  fi
  return 1
}

history_repo_confirm_plan() {
  local print_fn="$1"
  local edit_fn="$2"
  local answer=""

  while true; do
    "${print_fn}"
    if ! history_repo_prompt $'\nProceed? [Y]es / [n]o / [e]dit: ' answer; then
      echo "" >&2
      echo "Unable to read confirmation input. Re-run with --yes to proceed without confirmation." >&2
      exit 1
    fi
    case "${answer:-Y}" in
      [Yy]|"")
        return 0
        ;;
      [Nn])
        echo "Cancelled."
        exit 0
        ;;
      [Ee])
        "${edit_fn}"
        ;;
      *)
        echo "Please enter Y, n, or e."
        ;;
    esac
  done
}

history_repo_require_confirmation() {
  local print_fn="$1"
  local edit_fn="$2"
  local assume_yes="$3"

  if [[ "${assume_yes}" == true ]]; then
    "${print_fn}"
    return 0
  fi

  if history_repo_is_interactive; then
    history_repo_confirm_plan "${print_fn}" "${edit_fn}"
    return 0
  fi

  "${print_fn}"
  echo "" >&2
  echo "Non-interactive session. Re-run with --yes to proceed without confirmation." >&2
  exit 1
}

resolve_init_full_repo() {
  local gh_user
  gh_user="$(gh api user -q .login)"

  if [[ -z "${REPO_NAME}" ]]; then
    REPO_NAME="${gh_user}-actions-insights"
  fi

  if [[ -n "${ORG_FLAG}" ]]; then
    FULL_REPO="${ORG_FLAG}/${REPO_NAME}"
  else
    FULL_REPO="${gh_user}/${REPO_NAME}"
  fi
}

init_visibility_label() {
  if [[ "${VISIBILITY}" == "--private" ]]; then
    echo "private"
  else
    echo "public"
  fi
}

init_repo_status_label() {
  if gh repo view "${FULL_REPO}" >/dev/null 2>&1; then
    echo "already exists (will initialize/extend)"
  else
    echo "will be created"
  fi
}

print_init_plan_summary() {
  local org_label default_label

  if [[ -n "${ORG_FLAG}" ]]; then
    org_label="${ORG_FLAG}"
  else
    org_label="(personal account)"
  fi

  if [[ -n "${DEFAULT_REPO}" ]]; then
    default_label="${DEFAULT_REPO}"
  else
    default_label="(not set)"
  fi

  cat <<EOF

Actions Insights — Initialize history repository

Repository:       ${FULL_REPO} ($(init_repo_status_label))
Visibility:       $(init_visibility_label)
Organization:     ${org_label}
Default source:   ${default_label}
Dashboard source: ${SOURCE_REPO}@${SOURCE_REF}

Steps:
  1. Create GitHub repository (if missing)
  2. Copy history repository template (config.json, data/, etc.)
  3. Sync React dashboard, vendor history-models, and pages.yml
  4. Set config.json default repository (if configured)
  5. Commit and push to main
  6. Enable GitHub Pages (GitHub Actions source)
EOF

  if [[ "${DRY_RUN:-false}" == true ]]; then
    echo ""
    echo "[dry-run] No changes will be made."
  fi
}

edit_init_settings() {
  local choice="" name="" org="" vis="" vis_current="" def=""

  while true; do
    echo ""
    echo "What would you like to change?"
    echo "  1) Repository name"
    echo "  2) Organization"
    echo "  3) Visibility"
    echo "  4) Default source repository"
    echo "  5) Back to summary"
    history_repo_prompt "Choice [1-5]: " choice
    case "${choice}" in
      1)
        history_repo_prompt "Repository name [${REPO_NAME}]: " name
        if [[ -n "${name}" ]]; then
          REPO_NAME="${name}"
          resolve_init_full_repo
        fi
        ;;
      2)
        history_repo_prompt "Organization (blank for personal) [${ORG_FLAG}]: " org
        ORG_FLAG="${org}"
        resolve_init_full_repo
        ;;
      3)
        vis_current="$(init_visibility_label)"
        history_repo_prompt "Visibility (public/private) [${vis_current}]: " vis
        case "${vis:-${vis_current}}" in
          private|--private)
            VISIBILITY="--private"
            ;;
          *)
            VISIBILITY="--public"
            ;;
        esac
        ;;
      4)
        history_repo_prompt "Default source repository (owner/repo, blank to clear) [${DEFAULT_REPO}]: " def
        DEFAULT_REPO="${def}"
        ;;
      5|"")
        return
        ;;
      *)
        echo "Invalid choice."
        ;;
    esac
  done
}

update_verify_label() {
  if [[ "${VERIFY}" == true ]]; then
    echo "yes"
  else
    echo "no"
  fi
}

print_update_plan_summary() {
  cat <<EOF

Actions Insights — Update history repository

Target:           ${FULL_REPO}
Dashboard source: ${SOURCE_REPO}@${SOURCE_REF}
Verify build:     $(update_verify_label)
PR branch:        ${BRANCH}

Unchanged:        data/ and config.json

Steps:
  1. Clone and validate history repository structure
  2. Sync web/ dashboard from source
  3. Update .github/workflows/pages.yml
  4. Fix .gitignore and untrack web/node_modules if needed
  5. Commit, push branch, and open pull request
EOF

  if [[ "${DRY_RUN:-false}" == true ]]; then
    echo ""
    echo "[dry-run] No changes will be made."
  fi
}

edit_update_settings() {
  local choice="" repo="" ref="" verify="" verify_current=""

  while true; do
    echo ""
    echo "What would you like to change?"
    echo "  1) Target repository"
    echo "  2) Dashboard source ref"
    echo "  3) Verify build"
    echo "  4) Back to summary"
    history_repo_prompt "Choice [1-4]: " choice
    case "${choice}" in
      1)
        history_repo_prompt "Target repository (owner/repo) [${FULL_REPO}]: " repo
        if [[ -n "${repo}" ]]; then
          if [[ "${repo}" != */* ]]; then
            echo "Repository must be owner/repo." >&2
            continue
          fi
          if ! gh repo view "${repo}" >/dev/null 2>&1; then
            echo "Repository not found or not accessible: ${repo}" >&2
            continue
          fi
          FULL_REPO="${repo}"
        fi
        ;;
      2)
        history_repo_prompt "Source ref [${SOURCE_REF}]: " ref
        if [[ -n "${ref}" ]]; then
          SOURCE_REF="${ref}"
        fi
        ;;
      3)
        verify_current="$(update_verify_label)"
        history_repo_prompt "Verify build (yes/no) [${verify_current}]: " verify
        case "${verify:-${verify_current}}" in
          yes|y|Y|true)
            VERIFY=true
            ;;
          *)
            VERIFY=false
            ;;
        esac
        ;;
      4|"")
        return
        ;;
      *)
        echo "Invalid choice."
        ;;
    esac
  done
}

import_artifact_label() {
  local labels=()
  if [[ ${#IMPORT_ARTIFACT_NAMES[@]} -gt 0 ]]; then
    labels+=("names: ${IMPORT_ARTIFACT_NAMES[*]}")
  fi
  if [[ ${#IMPORT_ARTIFACT_PATTERNS[@]} -gt 0 ]]; then
    labels+=("patterns: ${IMPORT_ARTIFACT_PATTERNS[*]}")
  fi
  if [[ ${#labels[@]} -eq 0 ]]; then
    echo "auto-detect parseable artifacts"
  else
    (IFS=', '; echo "${labels[*]}")
  fi
}

import_since_label() {
  if [[ -n "${IMPORT_SINCE}" ]]; then
    echo "${IMPORT_SINCE}"
  else
    echo "(not set)"
  fi
}

import_branch_label() {
  if [[ -n "${IMPORT_BRANCH}" ]]; then
    echo "${IMPORT_BRANCH}"
  else
    echo "(all branches)"
  fi
}

import_workflow_label() {
  if [[ -n "${IMPORT_WORKFLOW}" ]]; then
    echo "${IMPORT_WORKFLOW}"
  else
    echo "(all workflows)"
  fi
}

print_import_plan_summary() {
  cat <<EOF

Actions Insights — Import history from source repository

Source repo:      ${SOURCE_REPO_ARG}
History repo:     ${HISTORY_REPO}
Artifacts:        $(import_artifact_label)
Test results:     ${IMPORT_TEST_GLOB}
Workflow filter:  $(import_workflow_label)
Branch filter:    $(import_branch_label)
Since:            $(import_since_label)
Run limit:        ${IMPORT_LIMIT}
History limit:    ${IMPORT_HISTORY_LIMIT}
Retain days:      ${IMPORT_RETAIN_DAYS}
PR branch:        ${BRANCH}

Steps:
  1. Clone and validate history repository structure
  2. List completed workflow runs on the source repository
  3. Download raw test-result artifacts and parse TRX/JUnit/NUnit/xUnit
  4. Convert runs to history JSON and write under data/
  5. Commit, push branch, and open pull request
EOF

  if [[ "${DRY_RUN:-false}" == true ]]; then
    echo ""
    echo "[dry-run] No changes will be made."
  fi
}

edit_import_settings() {
  local choice="" source="" history="" name="" pattern="" workflow="" branch="" since="" limit=""

  while true; do
    echo ""
    echo "What would you like to change?"
    echo "  1) Source repository"
    echo "  2) History repository"
    echo "  3) Artifact name"
    echo "  4) Artifact pattern"
    echo "  5) Workflow filter"
    echo "  6) Branch filter"
    echo "  7) Since date"
    echo "  8) Run limit"
    echo "  9) Back to summary"
    history_repo_prompt "Choice [1-9]: " choice
    case "${choice}" in
      1)
        history_repo_prompt "Source repository (owner/repo) [${SOURCE_REPO_ARG}]: " source
        if [[ -n "${source}" ]]; then
          if [[ "${source}" != */* ]]; then
            echo "Repository must be owner/repo." >&2
            continue
          fi
          SOURCE_REPO_ARG="${source}"
        fi
        ;;
      2)
        history_repo_prompt "History repository (owner/repo) [${HISTORY_REPO}]: " history
        if [[ -n "${history}" ]]; then
          if [[ "${history}" != */* ]]; then
            echo "Repository must be owner/repo." >&2
            continue
          fi
          if ! gh repo view "${history}" >/dev/null 2>&1; then
            echo "Repository not found or not accessible: ${history}" >&2
            continue
          fi
          HISTORY_REPO="${history}"
        fi
        ;;
      3)
        history_repo_prompt "Artifact name (blank to clear) [${IMPORT_ARTIFACT_NAMES[*]-}]: " name
        if [[ -n "${name}" ]]; then
          IMPORT_ARTIFACT_NAMES=("${name}")
        else
          IMPORT_ARTIFACT_NAMES=()
        fi
        ;;
      4)
        history_repo_prompt "Artifact pattern (blank to clear) [${IMPORT_ARTIFACT_PATTERNS[*]-}]: " pattern
        if [[ -n "${pattern}" ]]; then
          IMPORT_ARTIFACT_PATTERNS=("${pattern}")
        else
          IMPORT_ARTIFACT_PATTERNS=()
        fi
        ;;
      5)
        history_repo_prompt "Workflow filter (blank for all) [${IMPORT_WORKFLOW}]: " workflow
        IMPORT_WORKFLOW="${workflow}"
        ;;
      6)
        history_repo_prompt "Branch filter (blank for all) [${IMPORT_BRANCH}]: " branch
        IMPORT_BRANCH="${branch}"
        ;;
      7)
        history_repo_prompt "Since date (ISO, blank for none) [${IMPORT_SINCE}]: " since
        IMPORT_SINCE="${since}"
        ;;
      8)
        history_repo_prompt "Run limit [${IMPORT_LIMIT}]: " limit
        if [[ -n "${limit}" ]]; then
          IMPORT_LIMIT="${limit}"
        fi
        ;;
      9|"")
        return
        ;;
      *)
        echo "Invalid choice."
        ;;
    esac
  done
}
