# SafePost AI Installation Guide

## Prerequisites

1. **Chrome Browser** (or Chromium-based browser)
2. **HuggingFace Account** (free) - [Sign up here](https://huggingface.co/join)

## Step 1: Get Your HuggingFace API Key

1. Go to [HuggingFace Settings > Access Tokens](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Name it "SafePost AI"
4. Select "Read" permission (Inference API access)
5. Click "Generate"
6. **Copy and save this token** - you'll need it for setup

## Step 2: Install the Extension

### Method A: Load from Source (Development)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `safepost-ai` folder
6. The extension should now appear in your toolbar

### Method B: Create Icon Files (Required for proper loading)

The extension needs icon files to load properly. Create these placeholder files:

1. Find any small PNG images or create simple colored squares
2. Rename them to:
   - `icon16.png` (16x16 pixels)
   - `icon32.png` (32x32 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)
3. Place them in the `assets/` folder

## Step 3: Configure the Extension

1. Click the SafePost AI icon in your Chrome toolbar
2. Enter your HuggingFace API key from Step 1
3. Click "Save API Key"
4. Wait for the "API key saved successfully!" message
5. The status should change to "Active" (green dot)

## Step 4: Customize Settings (Optional)

1. In the popup, adjust the sensitivity level (Low/Medium/High)
2. Enable/disable detection types:
   - Personal Information (PII)
   - Toxic Content
   - Policy Violations
   - Named Entities

3. For advanced settings:
   - Click "Advanced Settings" in the popup
   - Configure platform-specific options
   - Set custom detection thresholds
   - Add whitelist/blacklist words

## Step 5: Test the Extension

1. Go to any supported social media platform:
   - Twitter/X (twitter.com or x.com)
   - Facebook (facebook.com)
   - Instagram (instagram.com)
   - LinkedIn (linkedin.com)
   - Reddit (reddit.com)
   - TikTok (tiktok.com)

2. Start typing in a post/comment box

3. Try typing test content with PII:

   ```
   Hi, my email is john.doe@example.com and my phone is 555-123-4567
   ```

4. You should see:
   - Real-time highlighting of flagged content
   - A warning modal if risky content is detected
   - Options to edit or post anyway

## Troubleshooting

### Extension Not Loading

- Make sure all icon files exist in the `assets/` folder
- Check Chrome Developer Console (F12) for errors
- Verify the `manifest.json` file is valid

### API Key Issues

- Double-check your HuggingFace API key
- Ensure you have "Read" permissions
- Try generating a new token if the first one doesn't work

### No Detection on Website

- Check if the website is supported (see Step 5)
- Refresh the page after installing the extension
- Make sure the extension is enabled and API key is set

### Performance Issues

- Adjust the analysis delay in Advanced Settings
- Reduce the cache size if needed
- Consider lowering detection sensitivity

## Usage Tips

1. **First Time Setup**: Start with "Medium" sensitivity and adjust based on your needs

2. **Privacy**: The extension processes text locally and only sends it to HuggingFace APIs - no data is stored on external servers

3. **Customization**: Use the whitelist feature to avoid flagging words/phrases that are okay for your use case

4. **Analytics**: Check the popup regularly to see your usage statistics and adjust settings accordingly

## Need Help?

- Check the console (F12) for error messages
- Review the logs in the extension popup
- Make sure your internet connection is stable
- Verify HuggingFace APIs are accessible from your location

## What's Next?

Once installed and configured:

- The extension will automatically analyze your posts in real-time
- You'll get instant feedback on potentially risky content
- All flagged posts and your decisions will be logged for review
- You can export your data or adjust settings anytime

Enjoy safer social media posting with SafePost AI! 🛡️
