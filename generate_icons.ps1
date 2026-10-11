$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$svgPath = "file:///C:/Users/likin/backus-ventas-pwa/public/icons/icon.svg"
$out192 = "C:\Users\likin\backus-ventas-pwa\public\icons\icon-192.png"
$out512 = "C:\Users\likin\backus-ventas-pwa\public\icons\icon-512.png"

Start-Process -FilePath $edge -ArgumentList "--headless=new", "--window-size=192,192", "--screenshot=$out192", $svgPath -Wait
Start-Process -FilePath $edge -ArgumentList "--headless=new", "--window-size=512,512", "--screenshot=$out512", $svgPath -Wait

Get-ChildItem -Path "C:\Users\likin\backus-ventas-pwa\public\icons"
