# SafePost AI Setup Script - Fixed Version
Write-Host "🛡️ SafePost AI: Setting up Fixed Version..." -ForegroundColor Green

# Backup current version
if (Test-Path "manifest.json") {
    Copy-Item "manifest.json" "manifest-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    Write-Host "✅ Backed up current manifest.json" -ForegroundColor Yellow
}

if (Test-Path "content.js") {
    Copy-Item "content.js" "content-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').js"
    Write-Host "✅ Backed up current content.js" -ForegroundColor Yellow
}

# Install fixed version
Copy-Item "manifest-fixed.json" "manifest.json" -Force
Copy-Item "content-fixed.js" "content.js" -Force
Write-Host "✅ Installed fixed manifest and content script" -ForegroundColor Green

# Create debug script
@"
// SafePost AI Debug Console Commands
// Copy and paste these into browser console for testing

// 1. Test if extension is loaded
chrome.runtime.sendMessage({ping: true}, response => {
    console.log('Extension Response:', response);
});

// 2. Check if content script is attached
console.log('SafePost Detector:', typeof window.safepostDetector);

// 3. Test text analysis manually
if (window.safepostDetector) {
    const testText = "Contact me at john@example.com or +91-9876543210";
    console.log('Testing text:', testText);
    // Find a text input and set value for testing
    const input = document.querySelector('textarea, input[type="text"]');
    if (input) {
        input.value = testText;
        input.dispatchEvent(new Event('input'));
        console.log('Test text added to input element');
    }
}

// 4. Check console for SafePost AI messages
console.log('Look for messages starting with 🛡️ SafePost AI');
"@ | Out-File -FilePath "debug-commands.js" -Encoding UTF8

Write-Host "✅ Created debug-commands.js with console test commands" -ForegroundColor Green

# Open test page
if (Test-Path "test-comprehensive.html") {
    Write-Host "🌐 Opening comprehensive test page..." -ForegroundColor Cyan
    Start-Process "test-comprehensive.html"
} else {
    Write-Host "⚠️ Test page not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Go to Chrome Extensions (chrome://extensions/)" -ForegroundColor White
Write-Host "2. Click RELOAD on SafePost AI extension" -ForegroundColor White  
Write-Host "3. Open the test page that just opened" -ForegroundColor White
Write-Host "4. You should see green 'SafePost AI Active' notification" -ForegroundColor White
Write-Host "5. Try typing sensitive info in the text boxes" -ForegroundColor White
Write-Host "6. Upload an image with text to test OCR" -ForegroundColor White
Write-Host ""
Write-Host "🔍 DEBUGGING:" -ForegroundColor Magenta
Write-Host "- Check browser console for 🛡️ SafePost AI messages" -ForegroundColor White
Write-Host "- Use debug-commands.js for manual testing" -ForegroundColor White
Write-Host "- Test button on the test page for quick checks" -ForegroundColor White
Write-Host ""
Write-Host "✅ Setup complete! Extension should now work properly." -ForegroundColor Green
