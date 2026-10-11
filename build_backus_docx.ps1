$ErrorActionPreference = "Stop"

$templateBackup = "C:\Users\likin\Downloads\basereal senati_ORIGINAL_BACKUP.docx"
$jsonPath       = "C:\Users\likin\backus-ventas-pwa\backus_report_data.json"
$outReport      = "C:\Users\likin\Downloads\INFORME_TALLER2_BACKUS_VENTAS_PWA.docx"
$outReportImgs  = "C:\Users\likin\Downloads\INFORME_TALLER2_BACKUS_VENTAS_PWA_CON_CAPTURAS.docx"
$outBaseReal    = "C:\Users\likin\Downloads\basereal senati.docx"
$imgDir         = "C:\Users\likin\Downloads\Capturas_Backus_PWA"

Write-Host "Verifying template backup..."
if (-not (Test-Path $templateBackup)) {
    throw "Backup template not found at $templateBackup"
}

Write-Host "Reading UTF-8 JSON data..."
$rawJson = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8)
$reportJson = $rawJson | ConvertFrom-Json

Write-Host "Starting Microsoft Word Application COM..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    # Generate the base report with clean placeholders
    Write-Host "Copying template to $outReport..."
    Copy-Item -Path $templateBackup -Destination $outReport -Force

    $doc = $word.Documents.Open($outReport)

    Write-Host "Updating Tarea mas significativa..."
    for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
        $p = $doc.Paragraphs.Item($i)
        if ($p.Range.Text -like "*Tarea*significativa*") {
            $prefix = "Tarea más significativa: "
            $fullTitle = $prefix + $reportJson.tarea_mas_significativa + "`n"
            $p.Range.Text = $fullTitle
            $p.Range.Font.Name = "Arial"
            $p.Range.Font.Size = 11
            $p.Range.Font.Bold = $false
            $prefRng = $doc.Range($p.Range.Start, $p.Range.Start + $prefix.Length)
            $prefRng.Font.Bold = $true
            $p.SpaceBefore = 6
            $p.SpaceAfter = 6
            break
        }
    }

    Write-Host "Locating Descripcion del proceso..."
    $pDescIdx = 0
    for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
        $p = $doc.Paragraphs.Item($i)
        if ($p.Range.Text.Trim() -like "Descripci*proceso*") {
            $pDescIdx = $i
            break
        }
    }

    if ($pDescIdx -eq 0) {
        throw "Could not find 'Descripcion del proceso' paragraph"
    }

    $pDesc = $doc.Paragraphs.Item($pDescIdx)
    $pDesc.Range.Font.Name = "Arial"
    $pDesc.Range.Font.Size = 11
    $pDesc.Range.Font.Bold = $true
    $pDesc.SpaceBefore = 8
    $pDesc.SpaceAfter = 6

    # Start insertion range at the end of pDesc
    $rng = $doc.Range($pDesc.Range.End, $pDesc.Range.End)

    $totalItems = $reportJson.items.Count
    $idx = 0
    foreach ($item in $reportJson.items) {
        $idx++
        if ($idx % 15 -eq 0) {
            Write-Host "Processed item $idx of $totalItems..."
        }

        switch ($item.type) {
            "h1" {
                $start = $rng.End
                $rng.InsertAfter("$($item.text)`n")
                $rH1 = $doc.Range($start, $rng.End)
                $rH1.Font.Name = "Arial"
                $rH1.Font.Size = 12
                $rH1.Font.Bold = $true
                $rH1.Font.Color = 0x803A1E # Navy Blue #1E3A80
                $rH1.ParagraphFormat.SpaceBefore = 12
                $rH1.ParagraphFormat.SpaceAfter = 4
                $rH1.ParagraphFormat.Alignment = 0 # Left
                $rng.Collapse(0)
            }
            "h2" {
                $start = $rng.End
                $rng.InsertAfter("$($item.text)`n")
                $rH2 = $doc.Range($start, $rng.End)
                $rH2.Font.Name = "Arial"
                $rH2.Font.Size = 11
                $rH2.Font.Bold = $true
                $rH2.Font.Color = 0x222222
                $rH2.ParagraphFormat.SpaceBefore = 8
                $rH2.ParagraphFormat.SpaceAfter = 3
                $rH2.ParagraphFormat.Alignment = 0
                $rng.Collapse(0)
            }
            "p" {
                $start = $rng.End
                if ($item.boldPrefix) {
                    $rng.InsertAfter("$($item.boldPrefix) $($item.text)`n")
                    $rP = $doc.Range($start, $rng.End)
                    $rP.Font.Name = "Arial"
                    $rP.Font.Size = 10
                    $rP.Font.Bold = $false
                    $rP.Font.Color = 0x000000
                    $rP.ParagraphFormat.SpaceBefore = 2
                    $rP.ParagraphFormat.SpaceAfter = 3
                    $rP.ParagraphFormat.Alignment = 3 # Justified
                    $rPref = $doc.Range($start, $start + $item.boldPrefix.Length)
                    $rPref.Font.Bold = $true
                } else {
                    $rng.InsertAfter("$($item.text)`n")
                    $rP = $doc.Range($start, $rng.End)
                    $rP.Font.Name = "Arial"
                    $rP.Font.Size = 10
                    $rP.Font.Bold = $false
                    $rP.Font.Color = 0x000000
                    $rP.ParagraphFormat.SpaceBefore = 2
                    $rP.ParagraphFormat.SpaceAfter = 3
                    $rP.ParagraphFormat.Alignment = 3
                }
                $rng.Collapse(0)
            }
            "bullet" {
                $start = $rng.End
                if ($item.boldPrefix) {
                    $rng.InsertAfter("- $($item.boldPrefix) $($item.text)`n")
                    $rB = $doc.Range($start, $rng.End)
                    $rB.Font.Name = "Arial"
                    $rB.Font.Size = 10
                    $rB.Font.Bold = $false
                    $rB.Font.Color = 0x000000
                    $rB.ParagraphFormat.SpaceBefore = 2
                    $rB.ParagraphFormat.SpaceAfter = 2
                    $rB.ParagraphFormat.Alignment = 3
                    $rPref = $doc.Range($start + 2, $start + 2 + $item.boldPrefix.Length)
                    $rPref.Font.Bold = $true
                } else {
                    $rng.InsertAfter("- $($item.text)`n")
                    $rB = $doc.Range($start, $rng.End)
                    $rB.Font.Name = "Arial"
                    $rB.Font.Size = 10
                    $rB.Font.Bold = $false
                    $rB.Font.Color = 0x000000
                    $rB.ParagraphFormat.SpaceBefore = 2
                    $rB.ParagraphFormat.SpaceAfter = 2
                    $rB.ParagraphFormat.Alignment = 3
                }
                $rng.Collapse(0)
            }
            "table" {
                $rowsCount = $item.rows.Count + 1
                $colsCount = $item.headers.Count
                $table = $doc.Tables.Add($rng, $rowsCount, $colsCount)
                $table.Borders.Enable = 1
                $table.Borders.OutsideLineStyle = 1
                $table.Borders.OutsideColor = 0x888888
                $table.Borders.InsideLineStyle = 1
                $table.Borders.InsideColor = 0xCCCCCC
                
                for ($c = 1; $c -le $colsCount; $c++) {
                    $table.Cell(1, $c).Range.Text = $item.headers[$c - 1]
                    $cell = $table.Cell(1, $c)
                    $cell.Shading.BackgroundPatternColor = 0xE6F0FA
                    $cell.Range.Font.Name = "Arial"
                    $cell.Range.Font.Size = 9
                    $cell.Range.Font.Bold = $true
                    $cell.Range.Font.Color = 0x803A1E
                }
                
                for ($rIdx = 0; $rIdx -lt $item.rows.Count; $rIdx++) {
                    $rowNum = $rIdx + 2
                    for ($c = 1; $c -le $colsCount; $c++) {
                        $table.Cell($rowNum, $c).Range.Text = $item.rows[$rIdx][$c - 1]
                        $cell = $table.Cell($rowNum, $c)
                        $cell.Range.Font.Name = "Arial"
                        $cell.Range.Font.Size = 8.5
                        $cell.Range.Font.Bold = ($c -eq 1)
                    }
                }
                $rng.SetRange($table.Range.End, $table.Range.End)
                $rng.InsertAfter("`n")
                $rng.Collapse(0)
            }
            "box" {
                # Title
                $start = $rng.End
                $rng.InsertAfter("$($item.title)`n")
                $rBoxTitle = $doc.Range($start, $rng.End)
                $rBoxTitle.Font.Name = "Arial"
                $rBoxTitle.Font.Size = 10
                $rBoxTitle.Font.Bold = $true
                $rBoxTitle.Font.Color = 0x803A1E
                $rBoxTitle.ParagraphFormat.SpaceBefore = 10
                $rBoxTitle.ParagraphFormat.SpaceAfter = 4
                $rng.Collapse(0)

                # Clean Box Table (1 row x 1 col)
                $boxTbl = $doc.Tables.Add($rng, 1, 1)
                $boxTbl.Borders.Enable = 1
                $boxTbl.Borders.OutsideLineStyle = 1
                $boxTbl.Borders.OutsideLineWidth = 8 # 1pt
                $boxTbl.Borders.OutsideColor = 0x999999
                
                $cell = $boxTbl.Cell(1, 1)
                $cell.Shading.BackgroundPatternColor = 16448250 # Light gray (RGB 250, 250, 250)
                $cell.PreferredWidthType = 3
                $cell.PreferredWidth = 480
                $boxTbl.Rows.Item(1).Height = 140
                $boxTbl.Rows.Item(1).HeightRule = 1 # wdRowHeightAtLeast

                # Placeholder
                $boxText = "`n$($item.placeholderText)`n`n[ Haga clic en este recuadro y presione Ctrl + V para pegar la captura ]`n"
                $cell.Range.Text = $boxText
                $cell.Range.Font.Name = "Arial"
                $cell.Range.Font.Size = 9.5
                $cell.Range.Font.Italic = $true
                $cell.Range.Font.Color = 0x444444
                $cell.Range.ParagraphFormat.Alignment = 1 # Center

                $rng.SetRange($boxTbl.Range.End, $boxTbl.Range.End)
                $rng.InsertAfter("`n")
                $rng.Collapse(0)

                # Tech Description below box
                $start = $rng.End
                $rng.InsertAfter("Descripción Técnica: $($item.desc)`n`n")
                $rCap = $doc.Range($start, $rng.End)
                $rCap.Font.Name = "Arial"
                $rCap.Font.Size = 9
                $rCap.Font.Italic = $true
                $rCap.Font.Color = 0x333333
                $rCap.ParagraphFormat.SpaceBefore = 3
                $rCap.ParagraphFormat.SpaceAfter = 10
                $rCap.ParagraphFormat.Alignment = 3 # Justified
                $rng.Collapse(0)
            }
        }
    }

    $doc.Save()
    Write-Host "Report with clean placeholders saved to $outReport"
    
    # Also update basereal senati.docx with this content so user finds it directly there too!
    $doc.SaveAs([ref]$outBaseReal)
    Write-Host "Report also saved to $outBaseReal"

    $doc.Close([ref]$false)

    # Now create the version with pre-inserted screenshots
    Write-Host "Creating report version with screenshots pre-inserted..."
    Copy-Item -Path $outReport -Destination $outReportImgs -Force
    $docImgs = $word.Documents.Open($outReportImgs)

    # Map box tables to screenshot files
    # We have tables in the document: original template tables + new tables.
    # Let's locate tables with 1 row and 1 column and embed screenshots!
    $boxTables = @()
    for ($tIdx = 1; $tIdx -le $docImgs.Tables.Count; $tIdx++) {
        $tbl = $docImgs.Tables.Item($tIdx)
        if ($tbl.Rows.Count -eq 1 -and $tbl.Columns.Count -eq 1) {
            $boxTables += $tbl
        }
    }

    Write-Host "Found $($boxTables.Count) screenshot boxes in the document."

    $imgFiles = @(
        "Captura_1_Portal_Taller2.png",
        "Captura_2_PWA_Online_Performance.png",
        "Captura_3_PWA_Modo_Offline.png",
        "Captura_4_Carrito_Preventa_Bodega.png",
        "Captura_5_Service_Worker_Cache_Storage.png",
        "Captura_6_Infografia_Runtime_Caching.png"
    )

    $imgConfig = @{
        "Captura_1_Portal_Taller2.png"               = 460;
        "Captura_2_PWA_Online_Performance.png"      = 240;
        "Captura_3_PWA_Modo_Offline.png"            = 240;
        "Captura_4_Carrito_Preventa_Bodega.png"     = 240;
        "Captura_5_Service_Worker_Cache_Storage.png" = 460;
        "Captura_6_Infografia_Runtime_Caching.png"   = 460;
    }

    for ($k = 0; $k -lt [Math]::Min($boxTables.Count, $imgFiles.Count); $k++) {
        $tbl = $boxTables[$k]
        $imgName = $imgFiles[$k]
        $imgPath = Join-Path $imgDir $imgName
        if (Test-Path $imgPath) {
            Write-Host "Inserting screenshot into Box $($k+1): $imgName..."
            $cell = $tbl.Cell(1, 1)
            $cell.Range.Text = ""
            $pic = $cell.Range.InlineShapes.AddPicture($imgPath, $false, $true)
            $picWidth = if ($imgConfig.ContainsKey($imgName)) { $imgConfig[$imgName] } else { 420 }
            $pic.Width = $picWidth
            $cell.Range.ParagraphFormat.Alignment = 1 # Center
        } else {
            Write-Warning "Image not found: $imgPath"
        }
    }

    $docImgs.Save()
    $docImgs.Close([ref]$false)
    Write-Host "Document with embedded screenshots saved successfully to $outReportImgs!"

} catch {
    Write-Error "ERROR: $_"
} finally {
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    Write-Host "Word application released."
}
