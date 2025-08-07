// SafePost AI Background Service Worker
class SafePostBackground {
  constructor() {
    this.init();
  }

  init() {
    // Listen for extension installation/startup
    chrome.runtime.onStartup.addListener(() => this.onStartup());
    chrome.runtime.onInstalled.addListener((details) =>
      this.onInstalled(details)
    );

    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Listen for tab updates to inject content script if needed
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.onTabUpdated(tabId, changeInfo, tab);
    });

    // Monitor storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.onStorageChanged(changes, namespace);
    });
  }

  onStartup() {
    console.log("SafePost AI: Extension started");
    this.checkApiKeyStatus();
  }

  onInstalled(details) {
    if (details.reason === "install") {
      console.log("SafePost AI: Extension installed");
      this.showWelcomeNotification();
      this.openSetupPage();
    } else if (details.reason === "update") {
      console.log("SafePost AI: Extension updated");
      this.checkMigrations(details.previousVersion);
    }
  }

  async checkApiKeyStatus() {
    try {
      const result = await chrome.storage.local.get(["apiKey"]);
      if (!result.apiKey) {
        // Show notification to set up API key
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#e74c3c" });
      } else {
        chrome.action.setBadgeText({ text: "" });
      }
    } catch (error) {
      console.error("Error checking API key status:", error);
    }
  }

  showWelcomeNotification() {
    chrome.notifications.create("welcome", {
      type: "basic",
      iconUrl: "assets/icon48.png",
      title: "SafePost AI Installed!",
      message:
        "Click the extension icon to set up your HuggingFace API key and start protecting your posts.",
    });
  }

  openSetupPage() {
    // Open popup for setup
    chrome.action.openPopup();
  }

  async checkMigrations(previousVersion) {
    // Handle any data migrations between versions
    console.log(`SafePost AI: Updated from version ${previousVersion}`);

    // Example migration logic
    if (this.isVersionLower(previousVersion, "1.0.0")) {
      // Migrate data from older version
      await this.migrateToV1();
    }
  }

  isVersionLower(version1, version2) {
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return true;
      if (v1Part > v2Part) return false;
    }

    return false;
  }

  async migrateToV1() {
    // Example migration
    console.log("SafePost AI: Migrating to version 1.0.0");
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case "logPost":
          await this.logPost(message.data);
          sendResponse({ success: true });
          break;

        case "getSettings":
          const settings = await this.getSettings();
          sendResponse({ settings });
          break;

        case "testApiKey":
          const isValid = await this.testApiKey(message.apiKey);
          sendResponse({ isValid });
          break;

        case "getAnalytics":
          const analytics = await this.getAnalytics();
          sendResponse({ analytics });
          break;

        case "exportData":
          const exportData = await this.exportAllData();
          sendResponse({ data: exportData });
          break;

        default:
          console.warn("SafePost AI: Unknown message action:", message.action);
          sendResponse({ error: "Unknown action" });
      }
    } catch (error) {
      console.error("SafePost AI: Error handling message:", error);
      sendResponse({ error: error.message });
    }
  }

  async logPost(logData) {
    try {
      const result = await chrome.storage.local.get(["postLogs"]);
      const logs = result.postLogs || [];

      // Add timestamp if not present
      logData.timestamp = logData.timestamp || Date.now();

      logs.push(logData);

      // Keep only last 1000 logs to prevent storage overflow
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      await chrome.storage.local.set({ postLogs: logs });

      // Update analytics
      await this.updateAnalyticsCache();

      console.log("SafePost AI: Post logged successfully");
    } catch (error) {
      console.error("SafePost AI: Error logging post:", error);
      throw error;
    }
  }

  async getSettings() {
    try {
      const result = await chrome.storage.local.get([
        "apiKey",
        "isEnabled",
        "sensitivity",
        "detectPII",
        "detectToxicity",
        "detectPolicy",
        "detectEntities",
      ]);

      return {
        apiKey: result.apiKey || "",
        isEnabled: result.isEnabled !== false,
        sensitivity: result.sensitivity || "medium",
        detectPII: result.detectPII !== false,
        detectToxicity: result.detectToxicity !== false,
        detectPolicy: result.detectPolicy !== false,
        detectEntities: result.detectEntities !== false,
      };
    } catch (error) {
      console.error("SafePost AI: Error getting settings:", error);
      throw error;
    }
  }

  async testApiKey(apiKey) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/dbmdz/bert-large-cased-finetuned-conll03-english",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: "test" }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("SafePost AI: Error testing API key:", error);
      return false;
    }
  }

  async getAnalytics() {
    try {
      const result = await chrome.storage.local.get([
        "postLogs",
        "analyticsCache",
      ]);
      const logs = result.postLogs || [];

      // Calculate analytics
      const totalScans = logs.length;
      const riskyPosts = logs.filter(
        (log) => log.analysis?.result?.isRisky
      ).length;
      const overrides = logs.filter(
        (log) => log.userDecision === "override"
      ).length;

      // Risk distribution
      const riskDistribution = { low: 0, medium: 0, high: 0 };
      logs.forEach((log) => {
        if (log.analysis?.result?.isRisky) {
          const riskLevel = this.calculateRiskLevel(log.analysis.result);
          riskDistribution[riskLevel]++;
        }
      });

      // Detection type stats
      const detectionStats = {
        pii: logs.filter((log) => log.analysis?.result?.pii?.length > 0).length,
        toxicity: logs.filter((log) => log.analysis?.result?.toxicity?.isToxic)
          .length,
        policy: logs.filter(
          (log) => log.analysis?.result?.policyViolations?.length > 0
        ).length,
        entities: logs.filter(
          (log) => log.analysis?.result?.entities?.length > 0
        ).length,
      };

      // Daily activity (last 30 days)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentLogs = logs.filter((log) => log.timestamp > thirtyDaysAgo);

      const dailyActivity = {};
      recentLogs.forEach((log) => {
        const date = new Date(log.timestamp).toDateString();
        dailyActivity[date] = (dailyActivity[date] || 0) + 1;
      });

      return {
        totalScans,
        riskyPosts,
        overrides,
        riskDistribution,
        detectionStats,
        dailyActivity,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("SafePost AI: Error getting analytics:", error);
      throw error;
    }
  }

  calculateRiskLevel(result) {
    let score = 0;

    if (result.pii && result.pii.length > 0) score += 3;
    if (result.entities && result.entities.length > 0) score += 2;
    if (result.toxicity && result.toxicity.isToxic) score += 4;
    if (result.policyViolations && result.policyViolations.length > 0)
      score += 3;

    if (score >= 6) return "high";
    if (score >= 3) return "medium";
    return "low";
  }

  async updateAnalyticsCache() {
    try {
      const analytics = await this.getAnalytics();
      await chrome.storage.local.set({
        analyticsCache: analytics,
        analyticsCacheTime: Date.now(),
      });
    } catch (error) {
      console.error("SafePost AI: Error updating analytics cache:", error);
    }
  }

  async exportAllData() {
    try {
      const result = await chrome.storage.local.get();

      return {
        exportDate: new Date().toISOString(),
        version: chrome.runtime.getManifest().version,
        settings: {
          isEnabled: result.isEnabled,
          sensitivity: result.sensitivity,
          detectPII: result.detectPII,
          detectToxicity: result.detectToxicity,
          detectPolicy: result.detectPolicy,
          detectEntities: result.detectEntities,
        },
        logs: result.postLogs || [],
        analytics: result.analyticsCache || {},
      };
    } catch (error) {
      console.error("SafePost AI: Error exporting data:", error);
      throw error;
    }
  }

  onTabUpdated(tabId, changeInfo, tab) {
    // Check if we should inject content script on social media sites
    if (changeInfo.status === "complete" && tab.url) {
      const socialMediaDomains = [
        "twitter.com",
        "x.com",
        "facebook.com",
        "instagram.com",
        "linkedin.com",
        "reddit.com",
        "tiktok.com",
      ];

      const isSupported = socialMediaDomains.some((domain) =>
        tab.url.includes(domain)
      );

      if (isSupported) {
        // Update badge to show extension is active on this site
        chrome.action.setBadgeText({ text: "✓", tabId: tabId });
        chrome.action.setBadgeBackgroundColor({
          color: "#27ae60",
          tabId: tabId,
        });
      } else {
        chrome.action.setBadgeText({ text: "", tabId: tabId });
      }
    }
  }

  onStorageChanged(changes, namespace) {
    if (namespace === "local") {
      // Notify content scripts of settings changes
      if (
        changes.isEnabled ||
        changes.sensitivity ||
        changes.detectPII ||
        changes.detectToxicity ||
        changes.detectPolicy ||
        changes.detectEntities
      ) {
        this.notifyContentScripts("settingsChanged", changes);
      }

      // Update badge if API key status changed
      if (changes.apiKey) {
        this.checkApiKeyStatus();
      }
    }
  }

  async notifyContentScripts(action, data) {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action, data });
        } catch (error) {
          // Content script not loaded on this tab, ignore
        }
      }
    } catch (error) {
      console.error("SafePost AI: Error notifying content scripts:", error);
    }
  }

  // Context menu setup (optional feature)
  setupContextMenus() {
    chrome.contextMenus.create({
      id: "analyzeSelectedText",
      title: "Analyze with SafePost AI",
      contexts: ["selection"],
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === "analyzeSelectedText") {
        this.analyzeSelectedText(info.selectionText, tab);
      }
    });
  }

  async analyzeSelectedText(text, tab) {
    try {
      // Send selected text to content script for analysis
      await chrome.tabs.sendMessage(tab.id, {
        action: "analyzeText",
        text: text,
      });
    } catch (error) {
      console.error("SafePost AI: Error analyzing selected text:", error);
    }
  }
}

// Initialize background service
new SafePostBackground();
