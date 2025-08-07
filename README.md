# SafePost AI Chrome Extension

A powerful Chrome extension that analyzes social media posts in real-time to detect Personal Identifiable Information (PII), toxic content, and policy violations before submission.

## 🚀 Features

### Real-time Analysis

- **PII Detection**: Identifies phone numbers, emails, addresses, SSNs, credit cards
- **Toxicity Detection**: Flags hate speech, harassment, and offensive content
- **Policy Violation Detection**: Warns about potential platform policy violations
- **Named Entity Recognition**: Detects sensitive personal information

### User Experience

- **Glassmorphism UI**: Beautiful, modern interface with blur effects
- **Real-time Highlighting**: Instant visual feedback on flagged content
- **Smart Warnings**: Modal dialogs with detailed explanations
- **User Override**: Allow posting with logged decisions
- **Multi-platform Support**: Works on Twitter, Facebook, Instagram, LinkedIn, Reddit, TikTok

### Advanced Features

- **Configurable Sensitivity**: Adjust detection thresholds
- **Custom Models**: Use your own HuggingFace models
- **Comprehensive Logging**: Track all flagged content and decisions
- **Analytics Dashboard**: View usage statistics and trends
- **Export/Import**: Backup and restore your settings and logs

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Glassmorphism), JavaScript (ES6+)
- **Chrome Extension**: Manifest V3, Content Scripts, Service Worker
- **NLP Backend**: HuggingFace Inference API
- **Models Used**:
  - `dbmdz/bert-large-cased-finetuned-conll03-english` (NER)
  - `unitary/toxic-bert` (Toxicity Detection)
  - `facebook/bart-large-mnli` (Zero-shot Classification)
  - `cardiffnlp/twitter-roberta-base-sentiment-latest` (Sentiment Analysis)

## 📦 Installation

### From Source

1. Clone this repository:

   ```bash
   git clone https://github.com/your-username/safepost-ai.git
   cd safepost-ai
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the `safepost-ai` folder

5. Get your HuggingFace API key:
   - Visit [HuggingFace Settings](https://huggingface.co/settings/tokens)
   - Create a new token with "Inference API" permissions
   - Copy the token

6. Click the SafePost AI extension icon and enter your API key

## ⚙️ Configuration

### Basic Setup

1. Open the extension popup
2. Enter your HuggingFace API key
3. Adjust sensitivity levels
4. Enable/disable detection types

### Advanced Settings

1. Click "Advanced Settings" in the popup
2. Configure platform-specific options
3. Set custom detection thresholds
4. Add whitelist/blacklist words
5. Configure custom models (optional)

## 🔧 Usage

1. **Automatic Detection**: Simply start typing on supported platforms
2. **Real-time Analysis**: Text is analyzed as you type (with debouncing)
3. **Visual Feedback**: Flagged content is highlighted with colored indicators
4. **Warning Modals**: Detailed warnings appear for risky content
5. **User Choice**: Choose to edit or post anyway (decisions are logged)

## 🎨 UI Features

### Glassmorphism Design

- Semi-transparent backgrounds with blur effects
- Smooth animations and transitions
- Responsive design for all screen sizes
- Dark mode support

### Highlight System

- **Red**: High-risk content (PII, toxicity)
- **Orange**: Medium-risk content (policy violations)
- **Blue**: Low-risk content (named entities)

## 📊 Analytics

Track your usage with built-in analytics:

- Total posts analyzed
- Risky content detected
- User override decisions
- Daily activity charts
- Risk distribution graphs

## 🔒 Privacy & Security

- **Local Processing**: No data sent to our servers
- **API Encryption**: All HuggingFace API calls use HTTPS
- **Optional Logging**: Choose what data to store locally
- **Data Export**: Full control over your data
- **Anonymous Mode**: Option to anonymize stored data

## 🌐 Supported Platforms

- **Twitter/X**: Posts, replies, retweets
- **Facebook**: Posts, comments, messages
- **Instagram**: Captions, stories, comments
- **LinkedIn**: Posts, articles, messages
- **Reddit**: Posts, comments
- **TikTok**: Captions, comments

## 🔧 Development

### Project Structure

```
safepost-ai/
├── manifest.json          # Extension manifest
├── content.js            # Content script for text monitoring
├── popup.html/js         # Extension popup interface
├── options.html/js       # Advanced settings page
├── background.js         # Service worker for background tasks
├── styles.css           # Glassmorphism styles for content
├── popup-styles.css     # Popup-specific styles
├── options-styles.css   # Options page styles
├── api/
│   └── huggingface-service.js  # HuggingFace API service
└── assets/              # Icons and images
```

### Key Components

1. **HuggingFaceService**: Handles all NLP API calls
2. **SafePostAnalyzer**: Main content script for text monitoring
3. **SafePostPopup**: Popup interface controller
4. **SafePostOptions**: Advanced settings controller
5. **SafePostBackground**: Service worker for background tasks

### API Integration

The extension uses HuggingFace's Inference API for all NLP tasks:

```javascript
// Example API call
const service = new HuggingFaceService(apiKey);
const result = await service.analyzeText("Your text here");
```

## 🎯 Roadmap

- [ ] **Multi-language Support**: Detect content in multiple languages
- [ ] **Custom Training**: Train models on user-specific data
- [ ] **Team Features**: Share settings across team members
- [ ] **API Rate Limiting**: Smart batching for high-volume users
- [ ] **Browser Sync**: Sync settings across devices
- [ ] **Mobile App**: Companion mobile application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature X"`
5. Push to your fork: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/safepost-ai/issues)
- **Documentation**: [Wiki](https://github.com/your-username/safepost-ai/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/safepost-ai/discussions)

## 🙏 Acknowledgments

- HuggingFace for providing excellent NLP models and APIs
- Chrome Extensions team for the robust platform
- Open source NLP community for advancing the field

---

**⚠️ Disclaimer**: This extension is a tool to help users make informed decisions about their social media posts. It does not guarantee complete accuracy and should not be relied upon as the sole method for content moderation. Users are responsible for their own content and compliance with platform policies.
