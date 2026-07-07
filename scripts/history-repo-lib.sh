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
