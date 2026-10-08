#!/bin/bash
# Lightsail launch script: runs once as root on first boot.
set -euo pipefail

# Swap so `next build` fits alongside the running stack on a 2 GB host.
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-v2 git unattended-upgrades
systemctl enable --now docker
usermod -aG docker ubuntu
