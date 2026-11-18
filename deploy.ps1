# Despliega frontend y/o backend. Se puede correr desde cualquier carpeta.
#
#   .\deploy.ps1              # ambos
#   .\deploy.ps1 --frontend   # sólo el build de Vite
#   .\deploy.ps1 --backend    # sólo Backend/deploy.sh en el servidor (git pull origin main + rebuild de Docker)
#
#   --force                   # despliega el backend aunque haya commits sin pushear
#
# Las migraciones y el collectstatic los corre docker-entrypoint.sh al levantar el contenedor.

$ErrorActionPreference = 'Stop'

$remoteUser = 'root'
$remoteHost = 'brasil.estudiotrivelloni.com.ar'
$remoteFront = '/var/www/gestionBrFront/Frontend/'
$remoteBackend = '/var/www/gestionBrAPI/Backend'

function Exit-Uso([string]$Msg) {
    Write-Host "$Msg Uso: .\deploy.ps1 [--frontend] [--backend] [--force]" -ForegroundColor Red
    exit 1
}

$partes = @()
$forzar = $false
foreach ($a in $args) {
    $o = "$a".TrimStart('-').ToLower()
    switch ($o) {
        { $_ -in 'frontend', 'backend' } { $partes += $o }
        'force' { $forzar = $true }
        default { Exit-Uso "Opción desconocida: $o." }
    }
}
$hacerFront = $partes.Count -eq 0 -or 'frontend' -in $partes
$hacerBack  = $partes.Count -eq 0 -or 'backend' -in $partes

function Test-Error([string]$Paso) {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falló: $Paso (exit $LASTEXITCODE). Abortando." -ForegroundColor Red
        exit 1
    }
}

if ($hacerBack -and -not $forzar) {
    # deploy.sh hace git pull: lo que no está pusheado no llega al servidor.
    # Se compara contra el upstream de la rama actual (acá el remoto se llama target y la rama es main).
    Push-Location $PSScriptRoot
    try {
        git fetch --quiet
        Test-Error 'git fetch'
        $sinPushear = git rev-list --count '@{u}..HEAD'
        Test-Error 'git rev-list'
        if ([int]$sinPushear -gt 0) {
            Write-Host "Hay $sinPushear commit(s) sin pushear. Hacé git push antes de desplegar (o usá --force)." -ForegroundColor Red
            git log --oneline '@{u}..HEAD'
            exit 1
        }
        if (git status --porcelain -- Backend) {
            Write-Host 'Hay cambios sin commitear en Backend/ (no se van a desplegar).' -ForegroundColor Yellow
        }
    }
    finally {
        Pop-Location
    }
}

if ($hacerFront) {
    Push-Location (Join-Path $PSScriptRoot 'Frontend')
    try {
        Write-Host 'Buildeando frontend...' -ForegroundColor Cyan
        npm run build
        Test-Error 'npm run build'

        # Queda en Frontend/dist, que el contenedor nginx monta como /usr/share/nginx/html
        Write-Host "Subiendo dist a ${remoteHost}:$remoteFront..." -ForegroundColor Cyan
        scp -r dist "${remoteUser}@${remoteHost}:$remoteFront"
        Test-Error 'scp'
    }
    finally {
        Pop-Location
    }
}

if ($hacerBack) {
    # deploy.sh está versionado con modo 644, así que el git pull le puede sacar el +x: se lo damos siempre.
    Write-Host 'Desplegando backend (deploy.sh)...' -ForegroundColor Cyan
    ssh "${remoteUser}@${remoteHost}" "cd $remoteBackend && chmod +x deploy.sh && ./deploy.sh"
    Test-Error 'deploy.sh'
}

Write-Host 'Despliegue completado.' -ForegroundColor Green
