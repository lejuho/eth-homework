#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RPC_URL="${RPC_URL:-http://localhost:8545}"
PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

echo "==> Building contracts" >&2
forge build --quiet >&2

# 로그는 모두 stderr — stdout에는 주소만
deploy_no_args() {
  local label="$1"
  local contract="$2"

  echo "==> Deploying ${label}" >&2
  local bytecode
  bytecode="$(forge inspect "${contract}" bytecode 2>/dev/null)"

  local receipt
  receipt="$(cast send \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --create "$bytecode" \
    --json 2>/dev/null)"

  local address
  address="$(printf '%s' "$receipt" | python3 -c "import sys,json; print(json.load(sys.stdin)['contractAddress'])")"
  echo "  Deployed: ${address}" >&2
  echo "$address"
}

deploy_with_args() {
  local label="$1"
  local contract="$2"
  local constructor_sig="$3"
  shift 3

  echo "==> Deploying ${label}" >&2
  local bytecode
  bytecode="$(forge inspect "${contract}" bytecode 2>/dev/null)"

  local encoded_args
  encoded_args="$(cast abi-encode "${constructor_sig}" "$@" 2>/dev/null | sed 's/^0x//')"

  local receipt
  receipt="$(cast send \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --create "${bytecode}${encoded_args}" \
    --json 2>/dev/null)"

  local address
  address="$(printf '%s' "$receipt" | python3 -c "import sys,json; print(json.load(sys.stdin)['contractAddress'])")"
  echo "  Deployed: ${address}" >&2
  echo "$address"
}

# ── 1. RevealVerifier ─────────────────────────────────────────────────────────
VERIFIER_ADDRESS="$(deploy_no_args \
  "RevealVerifier" \
  "contracts/RevealVerifier.sol:Groth16Verifier")"

# ── 2. HexChain ───────────────────────────────────────────────────────────────
HEXCHAIN_ADDRESS="$(deploy_with_args \
  "HexChain" \
  "contracts/HexChain.sol:HexChain" \
  "constructor(address)" \
  "$VERIFIER_ADDRESS")"

cat <<EOF

=== Deployment summary ===
  RevealVerifier (Groth16) : $VERIFIER_ADDRESS
  HexChain                 : $HEXCHAIN_ADDRESS

=== Env values ===
  NEXT_PUBLIC_HEXCHAIN_ADDRESS=$HEXCHAIN_ADDRESS
  CONTRACT_ADDRESS=$HEXCHAIN_ADDRESS
EOF
