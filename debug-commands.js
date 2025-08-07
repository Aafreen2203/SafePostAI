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
console.log('Look for messages starting with ðŸ›¡ï¸ SafePost AI');
