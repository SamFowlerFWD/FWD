#!/bin/sh
# Makes a new random password shared by the website and the daily timer, and
# saves it in both places. It is never shown or written to a file.
# Run from fwd-site/: sh scripts/set-cron-secret.sh   then redeploy the site.
set -e
SECRET=$(openssl rand -hex 32)
printf '%s' "$SECRET" | wrangler pages secret put CRON_SECRET --project-name fwd-site
printf '%s' "$SECRET" | wrangler secret put CRON_SECRET --config cron-worker/wrangler.toml
