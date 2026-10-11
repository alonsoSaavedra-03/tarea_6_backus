$ErrorActionPreference = "Stop"

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "C:\Users\likin\Downloads\Capturas_Backus_PWA"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$tasks = @(
    @{ Url = "http://localhost:8080/portal.html"; File = "Captura_1_Portal_Taller2.png"; W = 1100; H = 760 },
    @{ Url = "http://localhost:8080/"; File = "Captura_2_PWA_Online_Performance.png"; W = 560; H = 840 },
    @{ Url = "http://localhost:8080/?offline=true"; File = "Captura_3_PWA_Modo_Offline.png"; W = 560; H = 840 },
    @{ Url = "http://localhost:8080/?cart=true"; File = "Captura_4_Carrito_Preventa_Bodega.png"; W = 560; H = 860 },
    @{ Url = "http://localhost:8080/devtools.html"; File = "Captura_5_Service_Worker_Cache_Storage.png"; W = 1100; H = 760 },
    @{ Url = "http://localhost:8080/infografia.html"; File = "Captura_6_Infografia_Runtime_Caching.png"; W = 1040; H = 760 }
)

foreach ($item in $tasks) {
    $outPath = Join-Path $outDir $item.File
    Write-Host "Capturando $($item.File)..."
    $winSize = "--window-size=$($item.W),$($item.H)"
    $shotArg = "--screenshot=$outPath"
    
    Start-Process -FilePath $edge -ArgumentList "--headless=new", $winSize, $shotArg, $item.Url -Wait
    Start-Sleep -Milliseconds 600
}

Write-Host "Todas las capturas se completaron:"
Get-ChildItem -Path $outDir | Select-Object Name, Length, LastWriteTime
