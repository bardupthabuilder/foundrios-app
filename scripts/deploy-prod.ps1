# FoundriOS production deploy + alias-fix (PowerShell versie)
#
# Doel: lost permanent het probleem op dat foundrios-app.vercel.app naar het
# verkeerde Vercel-project (foundri-os) wijst. Doet:
#   1. vercel --prod (build + upload)
#   2. Pak de URL van de zojuist-gemaakte deployment
#   3. Forceer alias foundrios-app.vercel.app naar deze deployment
#
# Gebruik vanuit foundrios-app/ folder:
#   .\scripts\deploy-prod.ps1

# Geen $ErrorActionPreference="Stop" en geen 2>&1: native exe stderr (Vercel
# warnings) wordt in PowerShell 5.1 anders gezien als hard error.

$CanonicalDomain = "foundrios-app.vercel.app"
$Scope = "bardupthabuilders-projects"

$env:NODE_OPTIONS = "--use-system-ca"

Write-Host "==> Vercel production deploy starten..."

# Stdout opvangen in tempfile; stderr loopt direct naar console (warnings)
$tempOut = [System.IO.Path]::GetTempFileName()
& npx vercel --prod --yes --scope="$Scope" | Tee-Object -FilePath $tempOut
$exitCode = $LASTEXITCODE

$deployOutput = Get-Content $tempOut -Raw
Remove-Item $tempOut -ErrorAction SilentlyContinue

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "FOUT: vercel deploy faalde met exit code $exitCode" -ForegroundColor Red
    exit $exitCode
}

# Parse de deploy URL uit de output
$match = [regex]::Match($deployOutput, "https://foundrios-[a-z0-9]+-bardupthabuilders-projects\.vercel\.app")

if (-not $match.Success) {
    Write-Host ""
    Write-Host "FOUT: kon geen deploy URL parsen uit de Vercel output." -ForegroundColor Red
    Write-Host "Alias is NIET bijgewerkt. Check handmatig met:"
    Write-Host "  npx vercel alias set <deploy-url> $CanonicalDomain --scope=$Scope"
    exit 1
}

$deployUrl = $match.Value -replace "https://", ""

Write-Host ""
Write-Host "==> Alias overzetten: $CanonicalDomain -> $deployUrl"
& npx vercel alias set $deployUrl $CanonicalDomain --scope="$Scope"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "FOUT: alias set faalde. Run handmatig:" -ForegroundColor Red
    Write-Host "  npx vercel alias set $deployUrl $CanonicalDomain --scope=$Scope"
    exit 1
}

Write-Host ""
Write-Host "==> Klaar. Live op https://$CanonicalDomain" -ForegroundColor Green
