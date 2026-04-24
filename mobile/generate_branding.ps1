Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$size = 1024
$targetDir = Join-Path $PSScriptRoot 'assets\images'

function New-Color($hex) {
    return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function New-Bitmap($width, $height, $background) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear($background)
    return @{ Bitmap = $bmp; Graphics = $graphics }
}

function Draw-Mark($graphics, $scale) {
    $blue = New-Color '#0369A1'
    $cyan = New-Color '#0EA5E9'
    $white = [System.Drawing.Color]::White

    $cx = $size / 2.0
    $cy = $size / 2.0

    $ringRadius = 356 * $scale
    $ringThickness = 88 * $scale
    $clockRadius = 240 * $scale
    $badgeRadius = 112 * $scale

    $ringPen = New-Object System.Drawing.Pen($blue, $ringThickness)
    $ringPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $ringPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawArc(
        $ringPen,
        [float]($cx - $ringRadius),
        [float]($cy - $ringRadius),
        [float](2 * $ringRadius),
        [float](2 * $ringRadius),
        34,
        288
    )

    $clockBrush = New-Object System.Drawing.SolidBrush($blue)
    $graphics.FillEllipse(
        $clockBrush,
        [float]($cx - $clockRadius),
        [float]($cy - $clockRadius),
        [float](2 * $clockRadius),
        [float](2 * $clockRadius)
    )

    $handPen = New-Object System.Drawing.Pen($white, [float](34 * $scale))
    $handPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $handPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($handPen, [float]$cx, [float]$cy, [float]$cx, [float]($cy - 116 * $scale))
    $graphics.DrawLine($handPen, [float]$cx, [float]$cy, [float]($cx + 96 * $scale), [float]($cy + 96 * $scale))

    $centerBrush = New-Object System.Drawing.SolidBrush($white)
    $centerRadius = 22 * $scale
    $graphics.FillEllipse(
        $centerBrush,
        [float]($cx - $centerRadius),
        [float]($cy - $centerRadius),
        [float](2 * $centerRadius),
        [float](2 * $centerRadius)
    )

    $badgeCx = $cx + 222 * $scale
    $badgeCy = $cy - 184 * $scale
    $badgeBrush = New-Object System.Drawing.SolidBrush($cyan)
    $graphics.FillEllipse(
        $badgeBrush,
        [float]($badgeCx - $badgeRadius),
        [float]($badgeCy - $badgeRadius),
        [float](2 * $badgeRadius),
        [float](2 * $badgeRadius)
    )

    $checkPen = New-Object System.Drawing.Pen($white, [float](34 * $scale))
    $checkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $checkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine(
        $checkPen,
        [float]($badgeCx - 62 * $scale),
        [float]($badgeCy + 6 * $scale),
        [float]($badgeCx - 8 * $scale),
        [float]($badgeCy + 62 * $scale)
    )
    $graphics.DrawLine(
        $checkPen,
        [float]($badgeCx - 4 * $scale),
        [float]($badgeCy + 58 * $scale),
        [float]($badgeCx + 92 * $scale),
        [float]($badgeCy - 52 * $scale)
    )

    $ringPen.Dispose()
    $clockBrush.Dispose()
    $handPen.Dispose()
    $centerBrush.Dispose()
    $badgeBrush.Dispose()
    $checkPen.Dispose()
}

function Save-Asset($name, $backgroundColor, $scale, $resizeTo) {
    $canvas = New-Bitmap $size $size $backgroundColor
    Draw-Mark $canvas.Graphics $scale

    if ($resizeTo) {
        $resized = New-Object System.Drawing.Bitmap($canvas.Bitmap, $resizeTo.Width, $resizeTo.Height)
        $canvas.Bitmap.Dispose()
        $canvas.Graphics.Dispose()
        $resized.Save((Join-Path $targetDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
        $resized.Dispose()
    } else {
        $canvas.Bitmap.Save((Join-Path $targetDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Graphics.Dispose()
        $canvas.Bitmap.Dispose()
    }
}

$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
$navy = New-Color '#020617'

Save-Asset 'icon.png' $navy 1.0 $null
Save-Asset 'adaptive-icon.png' $transparent 0.78 $null
Save-Asset 'splash-icon.png' $transparent 0.62 $null
Save-Asset 'favicon.png' $navy 1.0 @{ Width = 48; Height = 48 }

Write-Output 'Branding assets generated successfully.'
