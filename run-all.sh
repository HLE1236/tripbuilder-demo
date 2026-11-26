#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "===================================================="
echo "  TripBuilder — He thong dat tour may do ban dia"
echo "  - Backend API        : http://localhost:8080"
echo "  - Cong Khach hang    : http://localhost:5173"
echo "  - Cong Tour Guide    : http://localhost:5174"
echo "  - Cong Admin Tong    : http://localhost:5175"
echo "===================================================="
echo

for cmd in java node npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[LOI] Khong tim thay '$cmd'. Vui long cai dat JDK 17+ va Node.js 20+ truoc khi chay."
    exit 1
  fi
done

chmod +x "$ROOT/TripBuilder-backend/mvnw"

if [ ! -d "$ROOT/TripBuilder-frontend-client/node_modules" ]; then
  echo "[1/4] Cai dat dependencies cho TripBuilder-frontend-client..."
  (cd "$ROOT/TripBuilder-frontend-client" && npm install)
fi

if [ ! -d "$ROOT/TripBuilder-frontend-guide/node_modules" ]; then
  echo "[2/4] Cai dat dependencies cho TripBuilder-frontend-guide..."
  (cd "$ROOT/TripBuilder-frontend-guide" && npm install)
fi

if [ ! -d "$ROOT/TripBuilder-frontend-admin/node_modules" ]; then
  echo "[3/4] Cai dat dependencies cho TripBuilder-frontend-admin..."
  (cd "$ROOT/TripBuilder-frontend-admin" && npm install)
fi

LOG_DIR="${TMPDIR:-/tmp}/tripbuilder-logs"
mkdir -p "$LOG_DIR"

PIDS=()

cleanup() {
  echo
  echo "Dang dung tat ca service TripBuilder..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  wait 2>/dev/null || true
  echo "Da dung xong."
}

trap cleanup INT TERM EXIT

echo "[4/4] Khoi dong Backend (:8080) va 3 Cong Frontend (:5173, :5174, :5175)..."
echo "      Log luu tai: $LOG_DIR"

(
  cd "$ROOT/TripBuilder-backend"
  exec ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
) >"$LOG_DIR/backend.log" 2>&1 &
PIDS+=("$!")

(
  cd "$ROOT/TripBuilder-frontend-client"
  exec npm run dev
) >"$LOG_DIR/client.log" 2>&1 &
PIDS+=("$!")

(
  cd "$ROOT/TripBuilder-frontend-guide"
  exec npm run dev
) >"$LOG_DIR/guide.log" 2>&1 &
PIDS+=("$!")

(
  cd "$ROOT/TripBuilder-frontend-admin"
  exec npm run dev
) >"$LOG_DIR/admin.log" 2>&1 &
PIDS+=("$!")

echo "Dang cho cac service khoi dong..."
sleep 6

open_url() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  fi
}

open_url "http://localhost:5173"
open_url "http://localhost:5174"
open_url "http://localhost:5175"

echo
echo "===================================================="
echo "  Khoi chay hoan tat! Mat khau mau chung: 123456"
echo "    - Khach hang : an.nguyen@gmail.com"
echo "    - Tour Guide : binh.guide@tripbuilder.vn"
echo "    - Admin Tong : admin@tripbuilder.vn"
echo "  Nhan Ctrl+C de dung toan bo 4 service."
echo "===================================================="

wait
