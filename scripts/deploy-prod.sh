#!/usr/bin/env bash
# FoundriOS production deploy + alias-fix
#
# Lost permanent het probleem op dat foundrios-app.vercel.app naar het
# verkeerde Vercel-project (foundri-os) wijst. Deze script doet:
#   1. vercel --prod (build + upload)
#   2. Pak de URL van de zojuist-gemaakte deployment
#   3. Forceer alias foundrios-app.vercel.app naar deze deployment
#
# Gebruik vanuit foundrios-app/ folder:
#   bash scripts/deploy-prod.sh

set -e

CANONICAL_DOMAIN="foundrios-app.vercel.app"
SCOPE="bardupthabuilders-projects"

export NODE_OPTIONS="--use-system-ca"

echo "==> Vercel production deploy starten..."
DEPLOY_OUTPUT=$(vercel --prod --yes --scope="$SCOPE" 2>&1)
echo "$DEPLOY_OUTPUT"

# Parse de fresh deploy URL uit de output (eerste foundrios-XXXXXX-bardupthabuilders... URL)
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" \
  | grep -oE 'https://foundrios-[a-z0-9]+-bardupthabuilders-projects\.vercel\.app' \
  | head -1 \
  | sed 's|https://||')

if [ -z "$DEPLOY_URL" ]; then
  echo "FOUT: kon geen deploy URL parsen uit de Vercel output."
  echo "Alias is NIET bijgewerkt. Check handmatig met:"
  echo "  vercel alias set <deploy-url> $CANONICAL_DOMAIN --scope=$SCOPE"
  exit 1
fi

echo ""
echo "==> Alias overzetten: $CANONICAL_DOMAIN -> $DEPLOY_URL"
vercel alias set "$DEPLOY_URL" "$CANONICAL_DOMAIN" --scope="$SCOPE"

echo ""
echo "==> Klaar. Live op https://$CANONICAL_DOMAIN"
