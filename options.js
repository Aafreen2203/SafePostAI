// SafePost AI Options Page Script
class SafePostOptions {
  constructor() {
    this.settings = {};
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get();
      this.settings = {
        // Detection thresholds
        piiThreshold: result.piiThreshold || 70,
        toxicityThreshold: result.toxicityThreshold || 50,
        policyThreshold: result.policyThreshold || 60,

        // PII detection types
        detectEmails: result.detectEmails !== false,
        detectPhones: result.detectPhones !== false,
        detectAddresses: result.detectAddresses !== false,
        detectSSN: result.detectSSN !== false,
        detectCreditCards: result.detectCreditCards !== false,
        detectIPAddresses: result.detectIPAddresses !== false,

        // Toxicity types
        detectHateSpeech: result.detectHateSpeech !== false,
        detectHarassment: result.detectHarassment !== false,
        detectProfanity: result.detectProfanity !== false,
        detectThreat: result.detectThreat !== false,

        // Policy types
        detectMisinformation: result.detectMisinformation !== false,
        detectSpam: result.detectSpam !== false,
        detectAdultContent: result.detectAdultContent !== false,
        detectCopyright: result.detectCopyright !== false,

        // Platform settings
        enableTwitter: result.enableTwitter !== false,
        enableFacebook: result.enableFacebook !== false,
        enableInstagram: result.enableInstagram !== false,
        enableLinkedIn: result.enableLinkedIn !== false,
        enableReddit: result.enableReddit !== false,
        enableTikTok: result.enableTikTok !== false,

        // Platform specific
        twitterReplies: result.twitterReplies !== false,
        twitterRetweets: result.twitterRetweets !== false,
        facebookComments: result.facebookComments !== false,
        facebookMessages: result.facebookMessages !== false,
        instagramCaptions: result.instagramCaptions !== false,
        instagramStories: result.instagramStories !== false,
        linkedinPosts: result.linkedinPosts !== false,
        linkedinMessages: result.linkedinMessages !== false,
        redditPosts: result.redditPosts !== false,
        redditComments: result.redditComments !== false,
        tiktokCaptions: result.tiktokCaptions !== false,
        tiktokComments: result.tiktokComments !== false,

        // Behavior settings
        warningStyle: result.warningStyle || "modal",
        autoBlock: result.autoBlock || false,
        autoSave: result.autoSave || false,
        autoSuggest: result.autoSuggest !== false,
        enableSounds: result.enableSounds || false,
        analysisDelay: result.analysisDelay || 1000,
        cacheSize: result.cacheSize || 100,

        // Privacy settings
        storeAnalyzedText: result.storeAnalyzedText || false,
        anonymizeData: result.anonymizeData !== false,
        allowTelemetry: result.allowTelemetry || false,

        // Advanced settings
        customNERModel: result.customNERModel || "",
        customToxicityModel: result.customToxicityModel || "",
        customPolicyModel: result.customPolicyModel || "",
        whitelistWords: result.whitelistWords || "",
        blacklistWords: result.blacklistWords || "",
      };
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  setupEventListeners() {
    // Sliders with value display
    this.setupSlider("piiThreshold");
    this.setupSlider("toxicityThreshold");
    this.setupSlider("policyThreshold");
    this.setupSlider("analysisDelay");
    this.setupSlider("cacheSize");

    // Checkboxes
    const checkboxes = [
      "detectEmails",
      "detectPhones",
      "detectAddresses",
      "detectSSN",
      "detectCreditCards",
      "detectIPAddresses",
      "detectHateSpeech",
      "detectHarassment",
      "detectProfanity",
      "detectThreat",
      "detectMisinformation",
      "detectSpam",
      "detectAdultContent",
      "detectCopyright",
      "enableTwitter",
      "enableFacebook",
      "enableInstagram",
      "enableLinkedIn",
      "enableReddit",
      "enableTikTok",
      "twitterReplies",
      "twitterRetweets",
      "facebookComments",
      "facebookMessages",
      "instagramCaptions",
      "instagramStories",
      "linkedinPosts",
      "linkedinMessages",
      "redditPosts",
      "redditComments",
      "tiktokCaptions",
      "tiktokComments",
      "autoBlock",
      "autoSave",
      "autoSuggest",
      "enableSounds",
      "storeAnalyzedText",
      "anonymizeData",
      "allowTelemetry",
    ];

    checkboxes.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("change", (e) => {
          this.settings[id] = e.target.checked;
        });
      }
    });

    // Radio buttons
    const radioButtons = document.querySelectorAll(
      'input[name="warningStyle"]'
    );
    radioButtons.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.settings.warningStyle = e.target.value;
        }
      });
    });

    // Text inputs
    const textInputs = [
      "customNERModel",
      "customToxicityModel",
      "customPolicyModel",
      "whitelistWords",
      "blacklistWords",
    ];

    textInputs.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("input", (e) => {
          this.settings[id] = e.target.value;
        });
      }
    });

    // Action buttons
    document
      .getElementById("saveSettings")
      .addEventListener("click", () => this.saveSettings());
    document
      .getElementById("testSettings")
      .addEventListener("click", () => this.testSettings());
    document
      .getElementById("exportAllData")
      .addEventListener("click", () => this.exportAllData());
    document
      .getElementById("clearAllData")
      .addEventListener("click", () => this.clearAllData());
    document
      .getElementById("resetSettings")
      .addEventListener("click", () => this.resetSettings());
    document
      .getElementById("viewLogs")
      .addEventListener("click", () => this.viewLogs());
    document
      .getElementById("reportIssue")
      .addEventListener("click", () => this.reportIssue());
  }

  setupSlider(id) {
    const slider = document.getElementById(id);
    const valueDisplay = slider.nextElementSibling;

    if (slider && valueDisplay) {
      slider.addEventListener("input", (e) => {
        const value = e.target.value;
        this.settings[id] = parseInt(value);

        if (id === "analysisDelay") {
          valueDisplay.textContent = `${value}ms`;
        } else if (id === "cacheSize") {
          valueDisplay.textContent = value;
        } else {
          valueDisplay.textContent = `${value}%`;
        }
      });
    }
  }

  updateUI() {
    // Update sliders
    document.getElementById("piiThreshold").value = this.settings.piiThreshold;
    document.querySelector("#piiThreshold + .slider-value").textContent =
      `${this.settings.piiThreshold}%`;

    document.getElementById("toxicityThreshold").value =
      this.settings.toxicityThreshold;
    document.querySelector("#toxicityThreshold + .slider-value").textContent =
      `${this.settings.toxicityThreshold}%`;

    document.getElementById("policyThreshold").value =
      this.settings.policyThreshold;
    document.querySelector("#policyThreshold + .slider-value").textContent =
      `${this.settings.policyThreshold}%`;

    document.getElementById("analysisDelay").value =
      this.settings.analysisDelay;
    document.querySelector("#analysisDelay + .slider-value").textContent =
      `${this.settings.analysisDelay}ms`;

    document.getElementById("cacheSize").value = this.settings.cacheSize;
    document.querySelector("#cacheSize + .slider-value").textContent =
      this.settings.cacheSize;

    // Update checkboxes
    for (const [key, value] of Object.entries(this.settings)) {
      const element = document.getElementById(key);
      if (element && element.type === "checkbox") {
        element.checked = value;
      }
    }

    // Update radio buttons
    const warningStyleRadio = document.querySelector(
      `input[name="warningStyle"][value="${this.settings.warningStyle}"]`
    );
    if (warningStyleRadio) {
      warningStyleRadio.checked = true;
    }

    // Update text inputs
    const textInputIds = [
      "customNERModel",
      "customToxicityModel",
      "customPolicyModel",
      "whitelistWords",
      "blacklistWords",
    ];
    textInputIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = this.settings[id] || "";
      }
    });
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set(this.settings);
      this.showNotification("Settings saved successfully!", "success");

      // Notify content scripts
      this.notifyContentScripts();
    } catch (error) {
      console.error("Error saving settings:", error);
      this.showNotification("Failed to save settings", "error");
    }
  }

  async testSettings() {
    try {
      const testText =
        "Hi, my email is john.doe@example.com and my phone is 555-123-4567. This is a test post!";

      // Get API key
      const result = await chrome.storage.local.get(["apiKey"]);
      if (!result.apiKey) {
        this.showNotification("Please configure your API key first", "error");
        return;
      }

      const apiService = new HuggingFaceService(result.apiKey);
      const analysis = await apiService.analyzeText(testText);

      let message = "Test completed:\n";
      message += `- PII detected: ${analysis.pii.length} items\n`;
      message += `- Entities: ${analysis.entities.length} items\n`;
      message += `- Toxicity: ${analysis.toxicity.isToxic ? "Yes" : "No"}\n`;
      message += `- Policy violations: ${analysis.policyViolations.length} items`;

      alert(message);
    } catch (error) {
      console.error("Error testing settings:", error);
      this.showNotification("Test failed: " + error.message, "error");
    }
  }

  async exportAllData() {
    try {
      const result = await chrome.storage.local.get();
      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0.0",
        settings: this.settings,
        logs: result.postLogs || [],
        analytics: result.analyticsCache || {},
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `safepost-ai-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      this.showNotification("Data exported successfully!", "success");
    } catch (error) {
      console.error("Error exporting data:", error);
      this.showNotification("Failed to export data", "error");
    }
  }

  async clearAllData() {
    if (
      !confirm(
        "Are you sure you want to clear ALL data? This will remove:\n- All logs\n- All analytics\n- All cached analysis results\n\nThis action cannot be undone!"
      )
    ) {
      return;
    }

    try {
      // Keep only essential settings
      const essentialKeys = ["apiKey", "isEnabled"];
      const result = await chrome.storage.local.get(essentialKeys);

      await chrome.storage.local.clear();
      await chrome.storage.local.set(result);

      this.showNotification("All data cleared successfully!", "success");

      // Reload page to reset UI
      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error clearing data:", error);
      this.showNotification("Failed to clear data", "error");
    }
  }

  async resetSettings() {
    if (
      !confirm(
        "Are you sure you want to reset all settings to defaults? Current settings will be lost."
      )
    ) {
      return;
    }

    try {
      // Get API key to preserve it
      const result = await chrome.storage.local.get(["apiKey", "postLogs"]);

      // Reset to defaults
      this.settings = this.getDefaultSettings();

      // Save defaults but preserve API key and logs
      await chrome.storage.local.set({
        ...this.settings,
        apiKey: result.apiKey,
        postLogs: result.postLogs,
      });

      this.updateUI();
      this.showNotification("Settings reset to defaults!", "success");
    } catch (error) {
      console.error("Error resetting settings:", error);
      this.showNotification("Failed to reset settings", "error");
    }
  }

  getDefaultSettings() {
    return {
      piiThreshold: 70,
      toxicityThreshold: 50,
      policyThreshold: 60,
      detectEmails: true,
      detectPhones: true,
      detectAddresses: true,
      detectSSN: true,
      detectCreditCards: true,
      detectIPAddresses: true,
      detectHateSpeech: true,
      detectHarassment: true,
      detectProfanity: true,
      detectThreat: true,
      detectMisinformation: true,
      detectSpam: true,
      detectAdultContent: true,
      detectCopyright: true,
      enableTwitter: true,
      enableFacebook: true,
      enableInstagram: true,
      enableLinkedIn: true,
      enableReddit: true,
      enableTikTok: true,
      twitterReplies: true,
      twitterRetweets: true,
      facebookComments: true,
      facebookMessages: true,
      instagramCaptions: true,
      instagramStories: true,
      linkedinPosts: true,
      linkedinMessages: true,
      redditPosts: true,
      redditComments: true,
      tiktokCaptions: true,
      tiktokComments: true,
      warningStyle: "modal",
      autoBlock: false,
      autoSave: false,
      autoSuggest: true,
      enableSounds: false,
      analysisDelay: 1000,
      cacheSize: 100,
      storeAnalyzedText: false,
      anonymizeData: true,
      allowTelemetry: false,
      customNERModel: "",
      customToxicityModel: "",
      customPolicyModel: "",
      whitelistWords: "",
      blacklistWords: "",
    };
  }

  async notifyContentScripts() {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: "settingsUpdated",
            settings: this.settings,
          });
        } catch (error) {
          // Content script not loaded on this tab, ignore
        }
      }
    } catch (error) {
      console.error("Error notifying content scripts:", error);
    }
  }

  viewLogs() {
    // Open popup to view logs
    chrome.action.openPopup();
  }

  reportIssue() {
    // Open GitHub issues page
    window.open(
      "https://github.com/safepost-ai/chrome-extension/issues",
      "_blank"
    );
  }

  showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector(".options-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = `options-notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize options when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new SafePostOptions();
});
