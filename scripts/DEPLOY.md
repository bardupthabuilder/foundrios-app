# Deploy naar productie

## Korte versie

```bash
npm run deploy
```

Dit zorgt automatisch dat `foundrios-app.vercel.app` naar de nieuwe deployment wijst.

## Waarom dit script bestaat

In de Vercel-omgeving zijn TWEE projecten:

| Project | Default URL |
|---|---|
| `foundrios-app` (huidige codebase, deze folder) | `foundrios-app-mu.vercel.app` |
| `foundri-os` (oud, ongebruikt) | claimt `foundrios-app.vercel.app` als zijn primary URL |

Resultaat zonder safety-net: `vercel --prod` deploy't naar `foundrios-app-mu.vercel.app`,
maar de canonical `foundrios-app.vercel.app` blijft naar het oude project wijzen.

Het script `deploy-prod.sh` lost dat op door na elke deploy expliciet de alias
`foundrios-app.vercel.app` over te zetten naar de nieuwe deployment.

## Wat het script doet

1. `vercel --prod --yes` — bouw + upload naar Vercel
2. Parse de fresh deploy URL uit de output
3. `vercel alias set <deploy-url> foundrios-app.vercel.app` — alias overzetten

## Vereisten

- Vercel CLI geïnstalleerd: `npm i -g vercel`
- Ingelogd: `vercel login` (eenmalig)
- `NODE_OPTIONS=--use-system-ca` is in het script ingebakken (lost SSL-cert issue op deze machine op)

## Permanente oplossing (optioneel, niet nu)

Het probleem is structureel oplosbaar door:

1. In Vercel-dashboard: project `foundri-os` openen → Settings → Domains → `foundrios-app.vercel.app` verwijderen
2. Project `foundrios-app` openen → Settings → Domains → `foundrios-app.vercel.app` toevoegen
3. Daarna kan `vercel --prod` zonder script

NIET zelf doen zonder Bart's go — `foundri-os` project zou andere live afhankelijkheden kunnen hebben.

## Wanneer het script faalt

Bij een build-error: het script stopt en alias wordt NIET gewijzigd.
Voordeel: de oude (werkende) versie blijft live tot de nieuwe build groen is.

Bij parse-error van de deploy URL: het script meldt dit en geeft het handmatige commando.

## Handmatige fallback

Als het script niet werkt:

```bash
# 1. Deploy
NODE_OPTIONS=--use-system-ca vercel --prod --yes

# 2. Pak laatste deploy URL uit output (foundrios-XXXXXX-bardupthabuilders-projects.vercel.app)

# 3. Alias zetten
NODE_OPTIONS=--use-system-ca vercel alias set foundrios-XXXXXX-bardupthabuilders-projects.vercel.app foundrios-app.vercel.app --scope=bardupthabuilders-projects
```
