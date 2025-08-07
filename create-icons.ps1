# PowerShell script to create simple PNG icons for SafePost AI
# This creates basic colored square icons with text

Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param(
        [int]$Size,
        [string]$FilePath,
        [string]$Text = "🛡️"
    )
    
    # Create bitmap
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Set high quality rendering
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    
    # Create gradient background (blue theme)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Rectangle]::new(0, 0, $Size, $Size),
        [System.Drawing.Color]::FromArgb(52, 152, 219),   # #3498db
        [System.Drawing.Color]::FromArgb(118, 75, 162),   # #764ba2
        45
    )
    
    # Fill background with rounded rectangle
    $graphics.FillRectangle($brush, 0, 0, $Size, $Size)
    
    # Add border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 100), 2)
    $graphics.DrawRectangle($pen, 1, 1, $Size-2, $Size-2)
    
    # Add text/icon
    $fontSize = [math]::Max(8, $Size * 0.4)
    $font = New-Object System.Drawing.Font("Segoe UI Emoji", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    # Center the text
    $textSize = $graphics.MeasureString($Text, $font)
    $x = ($Size - $textSize.Width) / 2
    $y = ($Size - $textSize.Height) / 2
    
    $graphics.DrawString($Text, $font, $textBrush, $x, $y)
    
    # Save as PNG
    $bitmap.Save($FilePath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $pen.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    
    Write-Host "Created: $FilePath ($Size x $Size)"
}

# Create the assets directory if it doesn't exist
$assetsDir = "assets"
if (!(Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir
}

Write-Host "🎨 Creating SafePost AI Icons..."

try {
    # Create all required icon sizes
    Create-Icon -Size 16 -FilePath "assets\icon16.png" -Text "🛡"
    Create-Icon -Size 32 -FilePath "assets\icon32.png" -Text "🛡️"
    Create-Icon -Size 48 -FilePath "assets\icon48.png" -Text "🛡️"
    Create-Icon -Size 128 -FilePath "assets\icon128.png" -Text "🛡️"
    
    Write-Host "✅ All icons created successfully!"
    Write-Host ""
    Write-Host "📁 Created files:"
    Get-ChildItem "assets\*.png" | ForEach-Object { 
        $size = [System.Drawing.Image]::FromFile($_.FullName)
        Write-Host "  - $($_.Name) ($($size.Width) x $($size.Height))"
        $size.Dispose()
    }
    
} catch {
    Write-Host "❌ Error creating icons: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "🔧 Alternative: Download any PNG images and rename them to:"
    Write-Host "  - assets\icon16.png (16x16)"
    Write-Host "  - assets\icon32.png (32x32)"
    Write-Host "  - assets\icon48.png (48x48)"
    Write-Host "  - assets\icon128.png (128x128)"
}

Write-Host ""
Write-Host "🚀 Next steps:"
Write-Host "1. Load the extension in Chrome (chrome://extensions/)"
Write-Host "2. Enable Developer mode"
Write-Host "3. Click 'Load unpacked' and select this folder"
Write-Host "4. Get your HuggingFace API key and configure the extension"
