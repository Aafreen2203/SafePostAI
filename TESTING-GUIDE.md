# 📋 SafePost AI Testing Guide

## 🔧 STEP 1: Reload Extension

1. Go to chrome://extensions/
2. Find "SafePost AI"
3. Click the RELOAD button (🔄)
4. Make sure it's ENABLED (toggle should be blue/on)

## 🔑 STEP 2: Set API Key

1. Click the SafePost AI icon in Chrome toolbar
2. Enter your HuggingFace API key
3. Click "Save API Key"
4. You should see "✅ API Key saved successfully"

## 🧪 STEP 3: Test on Test Page

1. Double-click "test-page.html" to open it in Chrome
2. You should see "SafePost AI Testing Page"
3. Look for "✅ SafePost AI Loaded" in the status section
4. If it shows "❌ SafePost AI Not Found", the extension isn't loading

## 📝 STEP 4: Test with Sample Text

1. Click on one of the sample texts (they'll copy to all input boxes)
2. Try this text: "My address is 102 Ram Mandir Road Mumbai 400091"
3. You should see warnings or highlights appear
4. Check browser console (F12) for debug messages

## 🔍 STEP 5: Manual Test

1. Click the "🧪 Run Manual Test" button
2. This will test the API directly
3. Should show "✅ Manual Test PASSED!" if working

## 📱 STEP 6: Test on Instagram (if test page works)

1. Go to Instagram.com
2. Create a new post
3. Type in caption: "My address is 102 Ram Mandir Road Mumbai 400091"
4. Look for warnings

## ⚠️ TROUBLESHOOTING

If nothing works:

1. Check Extension Console:
   - Go to chrome://extensions/
   - Click "Details" on SafePost AI
   - Click "Inspect views: background page"
   - Look for errors in console

2. Check Content Script:
   - Open test-page.html
   - Press F12 → Console
   - Look for "SafePost AI" messages
   - Should see "SafePost AI: Attached to text input element"

3. Common Issues:
   - ❌ Extension not enabled
   - ❌ API key not set or invalid
   - ❌ Browser blocking content scripts
   - ❌ File:// permissions not granted

## 🎯 EXPECTED BEHAVIOR

When working correctly:

1. Status shows "✅ SafePost AI Loaded"
2. Typing addresses shows warnings/highlights
3. Manual test passes
4. Console shows debug messages
5. Extension icon shows as active

## 📞 Quick Test Commands for Console

Copy/paste these in browser console (F12):

// Check if extension loaded
console.log('Extension loaded:', !!window.SafePostAnalyzer?.instance);

// Check API key
chrome.storage.local.get(['apiKey']).then(r => console.log('Has API key:', !!r.apiKey));

// Force attach to inputs
if (window.SafePostAnalyzer?.instance) {
document.querySelectorAll('textarea, [contenteditable="true"]').forEach(el => {
window.SafePostAnalyzer.instance.attachToElement(el);
});
}

## 🎯 WHAT SHOULD HAPPEN

When you type: "My address is 102 Ram Mandir Road Mumbai 400091"

Expected result:

- Text gets highlighted in red/orange
- Warning modal appears
- Console shows: "SafePost AI: Found existing text, analyzing..."
- Console shows: "Analysis result: {isRisky: true, pii: [...]}"
