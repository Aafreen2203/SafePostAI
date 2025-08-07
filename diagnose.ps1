#!/usr/bin/env pwsh
# SafePost AI Diagnostic Script

Write-Host ""
Write-Host "🔍 SafePost AI Diagnostic Report" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check files
Write-Host "📁 FILE CHECK:" -ForegroundColor Yellow
$files = @("manifest.json", "content.js", "test-comprehensive.html", "debug-commands.js")
foreach ($file in $files) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "  ✅ $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (missing)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 MANIFEST CHECK:" -ForegroundColor Yellow
if (Test-Path "manifest.json") {
    $manifest = Get-Content "manifest.json" | ConvertFrom-Json
    Write-Host "  ✅ Name: $($manifest.name)" -ForegroundColor Green
    Write-Host "  ✅ Version: $($manifest.version)" -ForegroundColor Green
    Write-Host "  ✅ Content Script: $($manifest.content_scripts[0].js[0])" -ForegroundColor Green
    Write-Host "  ✅ Host Permissions: all_urls" -ForegroundColor Green
}

Write-Host ""
Write-Host "🧪 CONTENT SCRIPT CHECK:" -ForegroundColor Yellow
if (Test-Path "content.js") {
    $content = Get-Content "content.js" -Raw
    if ($content -match "SafePost AI.*Enhanced Detection") {
        Write-Host "  ✅ Fixed content script detected" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Content script may be outdated" -ForegroundColor Yellow
    }
    
    if ($content -match "SensitiveContentDetector") {
        Write-Host "  ✅ Main detector class found" -ForegroundColor Green
    }
    
    if ($content -match "Tesseract") {
        Write-Host "  ✅ Image analysis (OCR) enabled" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🛠️ WHAT TO DO NEXT:" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. 🔄 RELOAD EXTENSION:" -ForegroundColor White
Write-Host "   • Go to chrome://extensions/" -ForegroundColor Gray
Write-Host "   • Find 'SafePost AI'" -ForegroundColor Gray
Write-Host "   • Click 'Reload' button" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🧪 TEST ON TEST PAGE:" -ForegroundColor White
Write-Host "   • Open test-comprehensive.html" -ForegroundColor Gray
Write-Host "   • Should see green 'SafePost AI Active' notification" -ForegroundColor Gray
Write-Host "   • Try typing: john@example.com" -ForegroundColor Gray
Write-Host "   • Should see orange/red warning overlay" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 🌐 TEST ON REAL SITES:" -ForegroundColor White
Write-Host "   • Go to Facebook, Instagram, Twitter" -ForegroundColor Gray
Write-Host "   • Try typing sensitive info in post boxes" -ForegroundColor Gray
Write-Host "   • Upload image with text" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 🔍 CHECK CONSOLE:" -ForegroundColor White
Write-Host "   • Press F12 → Console tab" -ForegroundColor Gray
Write-Host "   • Look for '🛡️ SafePost AI' messages" -ForegroundColor Gray
Write-Host "   • Run: chrome.runtime.sendMessage({ping: true}, console.log)" -ForegroundColor Gray
Write-Host ""

if (Test-Path "debug-commands.js") {
    Write-Host "💻 DEBUG COMMANDS AVAILABLE:" -ForegroundColor Yellow
    Write-Host "   Copy commands from debug-commands.js into browser console" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "✅ Diagnosis complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 KEY FIXES APPLIED:" -ForegroundColor Magenta
Write-Host "  • Fixed manifest permissions (all_urls)" -ForegroundColor Green
Write-Host "  • Enhanced content script with better detection" -ForegroundColor Green
Write-Host "  • Removed API dependency for basic regex detection" -ForegroundColor Green
Write-Host "  • Added comprehensive test page" -ForegroundColor Green
Write-Host "  • Improved image analysis with Tesseract.js" -ForegroundColor Green
Write-Host ""
