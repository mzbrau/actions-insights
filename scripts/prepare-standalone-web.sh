#!/usr/bin/env bash
set -euo pipefail

# Prepares a copied web/ directory for standalone use in a history repository:
# vendors @actions-insights/history-models and generates package-lock.json.

VERIFY=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --verify)
      VERIFY=true
      shift
      ;;
    -h|--help)
      VERIFY=false
      break
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      break
      ;;
  esac
done

WEB_DIR="${1:-}"
MODELS_DIR="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

usage() {
  echo "Usage: prepare-standalone-web.sh [--verify] <web-dir> <history-models-dir>" >&2
  echo "  Example: prepare-standalone-web.sh /path/to/history-repo/web ${REPO_ROOT}/packages/history-models" >&2
}

if [[ -z "${WEB_DIR}" || -z "${MODELS_DIR}" ]]; then
  usage
  exit 1
fi

if [[ ! -d "${WEB_DIR}" ]]; then
  echo "Web directory not found: ${WEB_DIR}" >&2
  usage
  exit 1
fi

if [[ ! -f "${WEB_DIR}/package.json" && -f "${WEB_DIR}/web/package.json" ]]; then
  echo "Note: ${WEB_DIR} looks like a history repo root; using ${WEB_DIR}/web" >&2
  WEB_DIR="${WEB_DIR}/web"
fi

if [[ ! -f "${WEB_DIR}/package.json" ]]; then
  echo "Web package.json not found: ${WEB_DIR}/package.json" >&2
  echo "Pass the web/ directory inside your history repository (not the repo root)." >&2
  usage
  exit 1
fi

if [[ ! -f "${MODELS_DIR}/package.json" ]]; then
  if [[ -f "${REPO_ROOT}/${MODELS_DIR}/package.json" ]]; then
    MODELS_DIR="${REPO_ROOT}/${MODELS_DIR}"
  elif [[ -f "${REPO_ROOT}/packages/history-models/package.json" ]]; then
    MODELS_DIR="${REPO_ROOT}/packages/history-models"
  else
    echo "history-models package not found: ${MODELS_DIR}" >&2
    echo "Pass an absolute path or run this script from an actions-insights checkout." >&2
    usage
    exit 1
  fi
fi

VENDOR_DIR="${WEB_DIR}/vendor/history-models"
rm -rf "${VENDOR_DIR}"
mkdir -p "${VENDOR_DIR}/src"
cp "${MODELS_DIR}/package.json" "${VENDOR_DIR}/"
cp "${MODELS_DIR}/src/"*.ts "${VENDOR_DIR}/src/"

node -e "
const fs = require('fs');
const path = require('path');

const webDir = process.argv[1];
const modelsPath = './vendor/history-models';

const pkgPath = path.join(webDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.dependencies['@actions-insights/history-models'] = 'file:' + modelsPath;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const vitePath = path.join(webDir, 'vite.config.ts');
let vite = fs.readFileSync(vitePath, 'utf8');
vite = vite.replace(
  /path\.resolve\(__dirname, '\.\.\/packages\/history-models\/src\/index\.ts'\)/,
  \"path.resolve(__dirname, './vendor/history-models/src/index.ts')\"
);
fs.writeFileSync(vitePath, vite);

const tsconfigPath = path.join(webDir, 'tsconfig.json');
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
tsconfig.compilerOptions.paths['@actions-insights/history-models'] = [
  './vendor/history-models/src/index.ts',
];
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
" "${WEB_DIR}"

(
  cd "${WEB_DIR}"
  npm_config_fund=false npm_config_audit=false npm install --package-lock-only
  if [[ "${VERIFY}" == true ]]; then
    npm_config_fund=false npm_config_audit=false npm ci
    npm run build
  fi
)

rm -rf "${WEB_DIR}/node_modules" "${WEB_DIR}/dist"

echo "Standalone web prepared at ${WEB_DIR}"
