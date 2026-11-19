#!/usr/bin/env bash
# Forced command for the CI deploy key (.github/workflows/deploy.yml). Accepts only
#   deploy <commit> <web digest> <tools digest> <registry user>
# in SSH_ORIGINAL_COMMAND, with a registry token on stdin. See docs/deployment.md.
set -euo pipefail

readonly REGISTRY=ghcr.io/compile10
readonly COMPOSE=(docker compose -f deploy/compose.yml)
readonly ROLLOUT_VERSION=v0.14
readonly ROLLOUT_SHA256=cdeaba6ae9eee3b0b606286e585bbda6787283d801a6ad6d9b9d2bc347fda05b

fail() {
  echo "deploy: $*" >&2
  exit 1
}

wait_healthy() {
  local id status
  id=$("${COMPOSE[@]}" ps -q web)
  for _ in {1..40}; do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$id")
    [[ $status == healthy ]] && return 0
    sleep 3
  done
  "${COMPOSE[@]}" logs --tail 50 web >&2
  fail "web is $status"
}

# Keeps only the running app images; an image still used by a container is skipped.
remove_old_images() {
  local keep id
  keep=$(docker image inspect -f '{{.Id}}' kaitai-web:current kaitai-tools:current)
  for id in $(docker image ls -q --no-trunc \
    --filter "reference=$REGISTRY/kaitai-web" --filter "reference=$REGISTRY/kaitai-tools" | sort -u); do
    grep -qx "$id" <<<"$keep" || docker image rm "$id" >/dev/null 2>&1 || true
  done
  docker image prune -f >/dev/null
}

# https://github.com/wowu/docker-rollout, pinned and checksummed.
rollout() {
  local bin="$HOME/.cache/kaitai/docker-rollout-$ROLLOUT_VERSION"
  if [[ ! -f $bin ]]; then
    mkdir -p "${bin%/*}"
    curl -fsSL -o "$bin" \
      "https://github.com/wowu/docker-rollout/releases/download/$ROLLOUT_VERSION/docker-rollout"
  fi
  echo "$ROLLOUT_SHA256  $bin" | sha256sum --check --quiet ||
    { rm -f "$bin"; fail "docker-rollout checksum mismatch"; }
  sh "$bin" rollout "$@"
}

# A function, so bash has parsed the whole script before the checkout replaces it.
main() {
  local verb commit web tools user extra token
  read -r verb commit web tools user extra <<<"${SSH_ORIGINAL_COMMAND:-}"
  [[ $verb == deploy && -z $extra ]] ||
    fail "usage: deploy <commit> <web digest> <tools digest> <registry user>"
  [[ $commit =~ ^[0-9a-f]{40}$ ]] || fail "invalid commit"
  [[ $web =~ ^sha256:[0-9a-f]{64}$ && $tools =~ ^sha256:[0-9a-f]{64}$ ]] || fail "invalid image digest"
  [[ $user =~ ^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$ ]] || fail "invalid registry user"
  IFS= read -r token || fail "expected a registry token on stdin"

  cd "$(dirname "$(readlink -f "$0")")/.."
  exec 9>.git/kaitai-deploy.lock
  flock -w 600 9 || fail "another deploy is still running"

  git fetch --quiet origin main
  git merge-base --is-ancestor "$commit" FETCH_HEAD || fail "$commit is not on main"
  local deployed
  deployed=$(cat .git/kaitai-deployed 2>/dev/null || git rev-parse HEAD)
  if [[ $commit != "$deployed" ]] && git merge-base --is-ancestor "$commit" "$deployed"; then
    fail "$commit is older than the deployed $deployed; revert on main to roll back"
  fi
  git checkout --quiet --detach "$commit"

  # Rebuilds produce a new image ID even from the same Dockerfile, which would
  # restart Postgres, so build once per Dockerfile version.
  local pg_image
  pg_image="kaitai-postgres:$(git rev-parse --short=12 HEAD:postgres/Dockerfile)"
  if ! docker image inspect "$pg_image" >/dev/null 2>&1; then
    "${COMPOSE[@]}" build --quiet postgres
    docker tag kaitai-postgres:current "$pg_image"
  fi
  docker tag "$pg_image" kaitai-postgres:current

  # Registry credentials live only for this run.
  DOCKER_CONFIG=$(mktemp -d)
  export DOCKER_CONFIG
  trap 'rm -rf "$DOCKER_CONFIG"' EXIT
  printf '%s' "$token" | docker login ghcr.io -u "$user" --password-stdin >/dev/null
  docker pull --quiet "$REGISTRY/kaitai-web@$web" >/dev/null
  docker pull --quiet "$REGISTRY/kaitai-tools@$tools" >/dev/null
  docker tag "$REGISTRY/kaitai-web@$web" kaitai-web:current
  docker tag "$REGISTRY/kaitai-tools@$tools" kaitai-tools:current

  "${COMPOSE[@]}" up -d --no-build --no-deps postgres
  "${COMPOSE[@]}" up --no-build --exit-code-from migrate migrate
  # Starts the new web container beside the old one, which stops once the new one is healthy.
  rollout -f deploy/compose.yml --timeout 120 --wait-after-healthy 3 web
  "${COMPOSE[@]}" up -d --no-build --remove-orphans
  wait_healthy
  echo "$commit" >.git/kaitai-deployed
  remove_old_images
  echo "deployed $commit"
}

main "$@"; exit
