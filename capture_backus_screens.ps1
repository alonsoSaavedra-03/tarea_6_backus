$ErrorActionPreference = "Stop"

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "C:\Users\likin\Downloads\Capturas_Backus_PWA"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$screens = @(
    @{ Name = "Captura_1_Portal_Taller2.png"; Url = "http://localhost:8080/portal.html"; Size = "1200,800" },
    @{ Name = "Captura_2_PWA_Online_Performance.png"; Url = "http://localhost:8080/"; Size = "430,920" },
    @{ Name = "Captura_3_PWA_Modo_Offline.png"; Url = "http://localhost:8080/?state=offline"; Size = "430,920" },
    @{ Name = "Captura_4_Carrito_Preventa_Bodega.png"; Url = "http://localhost:8080/?state=cart"; Size = "430,920" },
    @{ Name = "Captura_5_Service_Worker_Cache_Storage.png"; Url = "http://localhost:8080/devtools.html"; Size = "1200,800" }
)

foreach ($s in $screens) {
    Write-Host "Capturando $($s.Name)..."
    Start-Process -FilePath $edge -ArgumentList "--headless=new", "--window-size=$($s.Size)", "--screenshot=$outDir\$($s.Name)", $s.Url -Wait
}

Write-Host "`nCapturas de Backus Ventas generadas:"
Get-ChildItem -Path $outDir | Select-Object Name, Length
