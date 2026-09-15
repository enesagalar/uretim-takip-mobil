Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "assets\logo-src.png"
$src = [System.Drawing.Image]::FromFile($srcPath)
$srcRatio = $src.Height / $src.Width  # ~0.3476

function New-Canvas([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    return @($bmp, $g)
}

function Make-Icon([int]$size, [double]$logoWidthRatio, [string]$outFile, [string]$bg) {
    $pair = New-Canvas $size
    $bmp = $pair[0]; $g = $pair[1]
    if ($bg -ne "transparent") {
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($bg))
        $g.FillRectangle($brush, 0, 0, $size, $size)
        $brush.Dispose()
    }
    $lw = [int]($size * $logoWidthRatio)
    $lh = [int]($lw * $srcRatio)
    $lx = [int](($size - $lw) / 2)
    $ly = [int](($size - $lh) / 2)
    $g.DrawImage($src, $lx, $ly, $lw, $lh)
    $g.Dispose()
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "OK $outFile"
}

$icons = Join-Path $PSScriptRoot "icons"
Make-Icon 192 0.80 (Join-Path $icons "icon-192.png") "#FFFFFF"
Make-Icon 512 0.80 (Join-Path $icons "icon-512.png") "#FFFFFF"
Make-Icon 512 0.62 (Join-Path $icons "maskable-512.png") "#084F7D"
Make-Icon 180 0.78 (Join-Path $icons "apple-touch-icon.png") "#FFFFFF"
Make-Icon 64  0.86 (Join-Path $icons "favicon-64.png") "transparent"
Make-Icon 32  0.86 (Join-Path $icons "favicon-32.png") "transparent"

# Wide logo for in-app display (transparent, 640px wide)
$wlw = 640
$wlh = [int]($wlw * $srcRatio)
$wbmp = New-Object System.Drawing.Bitmap($wlw, $wlh)
$wg = [System.Drawing.Graphics]::FromImage($wbmp)
$wg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$wg.DrawImage($src, 0, 0, $wlw, $wlh)
$wg.Dispose()
$wbmp.Save((Join-Path $PSScriptRoot "assets\logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$wbmp.Dispose()
Write-Host "OK assets\logo.png"

$src.Dispose()
