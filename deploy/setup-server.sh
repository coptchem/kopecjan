#!/usr/bin/env bash
# One-time setup of the Hetzner server for kopecjan.cz (Ubuntu 26.04, run as root).
# Safe to run again: every step checks what is already there.
#
#   1. installs Docker Engine and the Compose plugin from the Ubuntu archive
#   2. opens 80/tcp, 443/tcp and 443/udp in UFW (SSH stays as it is)
#   3. clones the repo to /opt/kopecjan and creates an empty .env (mode 600)
#   4. builds and starts the stack (caddy + web)
#
# Nothing else on the server is touched.
set -euo pipefail

REPO=https://github.com/coptchem/kopecjan.git
DIR=/opt/kopecjan

echo "== Docker"
if ! command -v docker >/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq docker.io docker-compose-v2
  systemctl enable --now docker
fi
docker --version
docker compose version

echo "== Firewall"
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw status

echo "== Code"
if [ ! -d "$DIR/.git" ]; then
  git clone --branch main "$REPO" "$DIR"
else
  git -C "$DIR" pull --ff-only
fi
if [ ! -f "$DIR/.env" ]; then
  install -m 600 /dev/null "$DIR/.env"
  cat > "$DIR/.env" <<'ENV'
# Server env for kopecjan.cz. Not in git. See .env.example for every variable.
NEXT_PUBLIC_SITE_URL=https://kopecjan.cz
NEXT_PUBLIC_CHAT_ENABLED=false
ANTHROPIC_API_KEY=
ENV
fi
# Secret for the chat's proof-of-work challenges, generated once on the server.
if ! grep -q '^ALTCHA_HMAC_KEY=.' "$DIR/.env"; then
  sed -i '/^ALTCHA_HMAC_KEY=/d' "$DIR/.env"
  echo "ALTCHA_HMAC_KEY=$(openssl rand -hex 32)" >> "$DIR/.env"
fi

echo "== Build and start"
cd "$DIR"
docker compose up -d --build
docker compose ps

echo "== Health"
for i in $(seq 1 30); do
  if docker compose exec -T web node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.text()).then(t=>{console.log(t);process.exit(0)},()=>process.exit(1))"; then
    echo
    echo "OK: web is healthy. Point DNS for kopecjan.cz and www to this server."
    exit 0
  fi
  sleep 2
done
echo "web did not become healthy, check: docker compose logs web" >&2
exit 1
