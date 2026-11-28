#!/bin/bash
# Runs on the server, called by the Jenkins "SSH To Server + Docker Pull" stage
# as: IMAGE_TAG=<build number> /home/jogama/projects/pato-business/scripts/deploy-docker.sh
set -e

cd /home/mjogama/personal-project/pastry-business/server-docker

echo "=== Pull new image ==="
docker compose pull

echo "=== Restart application ==="
docker compose up -d --remove-orphans

echo "=== Remove unused images ==="
docker image prune -a -f

echo "=== Application is now running ==="
