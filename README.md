# SafePost AI

SafePost AI is a browser extension designed to analyze images and text on social media platforms, providing privacy-preserving AI-powered insights and content moderation. All processing is performed locally in your browser, ensuring that your data and images never leave your device.

## Features

- **Local Image Analysis**: Detects and analyzes images in social media posts using advanced AI models.
- **OCR (Optical Character Recognition)**: Extracts text from images using Tesseract.js, all within your browser.
- **Privacy-First Design**: No images or data are ever uploaded to any server. All analysis is performed locally.
- **Content Moderation**: Identifies potentially sensitive or private information in posts before you share them.
- **User-Friendly Interface**: Simple popups and notifications to guide users and inform them about privacy.

## How It Works

1. **Image Detection**: The extension scans your social media feed for images.
2. **Local OCR**: When an image is detected, Tesseract.js is loaded (if not already present) directly in your browser. The image is processed locally to extract any text content.
3. **AI Analysis**: The extracted text and image data are analyzed using AI models (also running locally) to detect sensitive information or privacy risks.
4. **Privacy Notice**: A modal popup informs users that all processing is local and no data is sent to any server.
5. **User Action**: Users are notified of any detected risks and can choose to proceed or edit their content.

## Privacy Preservation

- **No Data Upload**: All image and text analysis is performed in the browser. No images, text, or metadata are sent to any external server at any point.
- **Tesseract.js Integration**: The extension dynamically loads Tesseract.js from a trusted CDN only if needed, and uses it exclusively in the browser context.
- **No Tracking**: The extension does not track user activity, store data externally, or use analytics scripts.
- **Transparency**: Users are always informed via a clear privacy notice modal before any analysis is performed.
- **Open Source**: The code is open for inspection, so users and developers can verify privacy claims.

## File Structure

- `background.js` – Handles background tasks and extension events.
- `content.js` – Injects scripts into web pages and manages DOM interactions.
- `manifest.json` – Extension manifest and permissions.
- `api/ai-privacy-analyzer.js` – AI models for privacy analysis.
- `api/huggingface-service.js` – (If used) Local integration with HuggingFace models.
- `api/image-analysis-service.js` – Handles image analysis and OCR using Tesseract.js.
- `options.html`, `options.js`, `options-styles.css` – Extension options UI.
- `popup.html`, `popup.js`, `popup-styles.css` – Popup UI for user notifications.
- `styles.css` – Shared styles.
- `icons/` – Extension icons.

## How to Use

1. **Install the Extension**: Load the extension in your browser (see INSTALL.md for instructions).
2. **Browse Social Media**: As you use platforms like LinkedIn, the extension will automatically analyze images and text in your feed.
3. **Review Privacy Notices**: When analysis is performed, a privacy notice will appear, confirming that all processing is local.
4. **Take Action**: If sensitive content is detected, follow the extension's guidance to protect your privacy.

## Security Considerations

- The extension only requests permissions necessary for its operation.
- All third-party libraries (like Tesseract.js) are loaded from trusted sources.
- No persistent storage of analyzed data; all processing is ephemeral and local.

## Contributing

Contributions are welcome! Please see the code and submit issues or pull requests for improvements.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue on the repository.
