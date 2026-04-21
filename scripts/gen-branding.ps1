# Gera assets brandeadas — ícones da app + thumbnails dos templates.
# Uso: pwsh -File scripts/gen-branding.ps1
# Requer: Windows PowerShell ou PowerShell Core (System.Drawing via System.Drawing.Common)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $root 'assets/icons'
$thumbsDir = Join-Path $root 'assets/thumbs'

function New-GradientBitmap {
    param(
        [int]$Width,
        [int]$Height,
        [System.Drawing.Color]$ColorA,
        [System.Drawing.Color]$ColorB,
        [float]$AngleDegrees = 135.0
    )
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $ColorA, $ColorB, $AngleDegrees)
    $g.FillRectangle($brush, $rect)
    $brush.Dispose()
    return @{ bmp = $bmp; g = $g }
}

function Save-Png {
    param($bmp, [string]$Path)
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  -> $Path"
}

# ==============================
# APP ICON (180 / 192 / 512)
# ==============================
# Fundo escuro (coerente com tema) + monograma "VR" em gradiente sunset.
function New-AppIcon {
    param([int]$Size, [string]$Out)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Fundo: quase preto com um vignette radial subtil quente.
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 11, 12))
    $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    $bgBrush.Dispose()

    # Anel/círculo (moldura do monograma) — gradiente sunset.
    $pad = [int]($Size * 0.12)
    $circleRect = New-Object System.Drawing.Rectangle($pad, $pad, ($Size - 2*$pad), ($Size - 2*$pad))
    $circleBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $circleRect,
        [System.Drawing.Color]::FromArgb(255, 255, 140, 60),
        [System.Drawing.Color]::FromArgb(255, 220, 60, 150),
        135.0
    )
    $g.FillEllipse($circleBrush, $circleRect)
    $circleBrush.Dispose()

    # Monograma "VR" a branco, centrado.
    $fontSize = [int]($Size * 0.38)
    $font = New-Object System.Drawing.Font("Arial Black", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $g.DrawString("VR", $font, $textBrush, $textRect, $sf)

    $textBrush.Dispose()
    $font.Dispose()
    $g.Dispose()
    Save-Png $bmp $Out
    $bmp.Dispose()
}

Write-Host "App icons:"
New-AppIcon -Size 180 -Out (Join-Path $iconsDir 'icon-180.png')
New-AppIcon -Size 192 -Out (Join-Path $iconsDir 'icon-192.png')
New-AppIcon -Size 512 -Out (Join-Path $iconsDir 'icon-512.png')

# ==============================
# TEMPLATE THUMBNAILS (270 x 480 = 9:16)
# ==============================
$w = 270
$h = 480

# --- Golden Hour: sunset gradient + sun disk ---
Write-Host "Thumbnails:"
$goldenA = [System.Drawing.Color]::FromArgb(255, 255, 170, 80)   # warm top
$goldenB = [System.Drawing.Color]::FromArgb(255, 180, 50, 90)    # dusky bottom
$gh = New-GradientBitmap -Width $w -Height $h -ColorA $goldenA -ColorB $goldenB -AngleDegrees 90
$g = $gh.g
# Sun disk
$sunBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 255, 240, 200))
$sunSize = 110
$g.FillEllipse($sunBrush, [int](($w - $sunSize)/2), [int]($h * 0.45), $sunSize, $sunSize)
$sunBrush.Dispose()
# Horizon line
$horizonBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(80, 50, 10, 30))
$g.FillRectangle($horizonBrush, 0, [int]($h * 0.72), $w, 3)
$horizonBrush.Dispose()
# Label
$font = New-Object System.Drawing.Font("Arial", 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$tb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$sf = New-Object System.Drawing.StringFormat; $sf.Alignment = 1; $sf.LineAlignment = 1
$g.DrawString("GOLDEN HOUR", $font, $tb, (New-Object System.Drawing.RectangleF(0, ($h - 60), $w, 40)), $sf)
$tb.Dispose(); $font.Dispose(); $g.Dispose()
Save-Png $gh.bmp (Join-Path $thumbsDir 'golden_hour.png')
$gh.bmp.Dispose()

# --- Night Out: purple/magenta neon + angular shapes ---
$nightA = [System.Drawing.Color]::FromArgb(255, 90, 20, 140)
$nightB = [System.Drawing.Color]::FromArgb(255, 230, 30, 130)
$no = New-GradientBitmap -Width $w -Height $h -ColorA $nightA -ColorB $nightB -AngleDegrees 135
$g = $no.g
# Neon triangles
$neonBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180, 0, 230, 255))
$pts1 = @(
    (New-Object System.Drawing.Point(30, 350)),
    (New-Object System.Drawing.Point(130, 180)),
    (New-Object System.Drawing.Point(230, 350))
)
$g.FillPolygon($neonBrush, $pts1)
$neonBrush.Dispose()
$pinkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(160, 255, 80, 200))
$pts2 = @(
    (New-Object System.Drawing.Point(80, 420)),
    (New-Object System.Drawing.Point(170, 260)),
    (New-Object System.Drawing.Point(260, 420))
)
$g.FillPolygon($pinkBrush, $pts2)
$pinkBrush.Dispose()
$font = New-Object System.Drawing.Font("Arial", 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$tb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g.DrawString("NIGHT OUT", $font, $tb, (New-Object System.Drawing.RectangleF(0, ($h - 60), $w, 40)), $sf)
$tb.Dispose(); $font.Dispose(); $g.Dispose()
Save-Png $no.bmp (Join-Path $thumbsDir 'night_out.png')
$no.bmp.Dispose()

# --- Travel: blue/teal/green gradient + mountain silhouettes ---
$travelA = [System.Drawing.Color]::FromArgb(255, 90, 180, 220)
$travelB = [System.Drawing.Color]::FromArgb(255, 60, 130, 90)
$tr = New-GradientBitmap -Width $w -Height $h -ColorA $travelA -ColorB $travelB -AngleDegrees 100
$g = $tr.g
# Sun / moon
$sunBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 255, 245, 220))
$g.FillEllipse($sunBrush, ($w - 140), 80, 60, 60)
$sunBrush.Dispose()
# Mountain back (lighter)
$m1 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180, 40, 80, 110))
$pts1 = @(
    (New-Object System.Drawing.Point(-10, 340)),
    (New-Object System.Drawing.Point(90, 200)),
    (New-Object System.Drawing.Point(180, 280)),
    (New-Object System.Drawing.Point(280, 340))
)
$g.FillPolygon($m1, $pts1)
$m1.Dispose()
# Mountain front (darker)
$m2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230, 20, 50, 60))
$pts2 = @(
    (New-Object System.Drawing.Point(-10, 480)),
    (New-Object System.Drawing.Point(40, 380)),
    (New-Object System.Drawing.Point(130, 300)),
    (New-Object System.Drawing.Point(210, 370)),
    (New-Object System.Drawing.Point(280, 340)),
    (New-Object System.Drawing.Point(280, 480))
)
$g.FillPolygon($m2, $pts2)
$m2.Dispose()
$font = New-Object System.Drawing.Font("Arial", 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$tb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g.DrawString("TRAVEL", $font, $tb, (New-Object System.Drawing.RectangleF(0, ($h - 60), $w, 40)), $sf)
$tb.Dispose(); $font.Dispose(); $g.Dispose()
Save-Png $tr.bmp (Join-Path $thumbsDir 'travel.png')
$tr.bmp.Dispose()

Write-Host ""
Write-Host "Branding gerada com sucesso."
