// SafePost AI Popup Script
class SafePostPopup {
  constructor() {
    this.apiService = null;
    this.settings = {};
    this.logs = [];
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
    this.loadLogs();
    this.updateAnalytics();
  }

  async loadSettings() {
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

      this.settings = {
        apiKey: result.apiKey || "",
        isEnabled: result.isEnabled !== false,
        sensitivity: result.sensitivity || "medium",
        detectPII: result.detectPII !== false,
        detectToxicity: result.detectToxicity !== false,
        detectPolicy: result.detectPolicy !== false,
        detectEntities: result.detectEntities !== false,
      };

      if (this.settings.apiKey) {
        this.apiService = new HuggingFaceService(this.settings.apiKey);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  setupEventListeners() {
    // API Key management
    document
      .getElementById("saveApiKey")
      .addEventListener("click", () => this.saveApiKey());
    document
      .getElementById("toggleApiKey")
      .addEventListener("click", () => this.toggleApiKeyVisibility());
    document.getElementById("apiKeyInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.saveApiKey();
    });

    // Settings
    document
      .getElementById("enabledToggle")
      .addEventListener("change", (e) =>
        this.updateSetting("isEnabled", e.target.checked)
      );
    document
      .getElementById("sensitivitySelect")
      .addEventListener("change", (e) =>
        this.updateSetting("sensitivity", e.target.value)
      );

    // Detection type checkboxes
    document
      .getElementById("detectPII")
      .addEventListener("change", (e) =>
        this.updateSetting("detectPII", e.target.checked)
      );
    document
      .getElementById("detectToxicity")
      .addEventListener("change", (e) =>
        this.updateSetting("detectToxicity", e.target.checked)
      );
    document
      .getElementById("detectPolicy")
      .addEventListener("change", (e) =>
        this.updateSetting("detectPolicy", e.target.checked)
      );
    document
      .getElementById("detectEntities")
      .addEventListener("change", (e) =>
        this.updateSetting("detectEntities", e.target.checked)
      );

    // Actions
    document
      .getElementById("clearLogs")
      .addEventListener("click", () => this.clearLogs());
    document
      .getElementById("exportLogs")
      .addEventListener("click", () => this.exportLogs());
    document
      .getElementById("openOptions")
      .addEventListener("click", () => this.openOptionsPage());
  }

  updateUI() {
    // Update API key input
    const apiKeyInput = document.getElementById("apiKeyInput");
    if (this.settings.apiKey) {
      apiKeyInput.value = this.settings.apiKey;
    }

    // Update status indicator
    this.updateStatusIndicator();

    // Update settings
    document.getElementById("enabledToggle").checked = this.settings.isEnabled;
    document.getElementById("sensitivitySelect").value =
      this.settings.sensitivity;
    document.getElementById("detectPII").checked = this.settings.detectPII;
    document.getElementById("detectToxicity").checked =
      this.settings.detectToxicity;
    document.getElementById("detectPolicy").checked =
      this.settings.detectPolicy;
    document.getElementById("detectEntities").checked =
      this.settings.detectEntities;

    // Show/hide sections based on API key presence
    const hasApiKey = !!this.settings.apiKey;
    document.getElementById("settingsSection").style.display = hasApiKey
      ? "block"
      : "none";
    document.getElementById("analyticsSection").style.display = hasApiKey
      ? "block"
      : "none";
    document.getElementById("logsSection").style.display = hasApiKey
      ? "block"
      : "none";
  }

  updateStatusIndicator() {
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");

    if (!this.settings.apiKey) {
      statusDot.className = "status-dot status-error";
      statusText.textContent = "API Key Required";
    } else if (!this.settings.isEnabled) {
      statusDot.className = "status-dot status-warning";
      statusText.textContent = "Disabled";
    } else {
      statusDot.className = "status-dot status-success";
      statusText.textContent = "Active";
    }
  }

  async saveApiKey() {
    const apiKeyInput = document.getElementById("apiKeyInput");
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      this.showError("Please enter a valid API key");
      return;
    }

    try {
      // Test the API key
      const testService = new HuggingFaceService(apiKey);
      await testService.makeRequest(
        "dbmdz/bert-large-cased-finetuned-conll03-english",
        {
          inputs: "test",
        }
      );

      // Save if successful
      await chrome.storage.local.set({ apiKey: apiKey });
      this.settings.apiKey = apiKey;
      this.apiService = testService;

      this.showSuccess("API key saved successfully!");
      this.updateUI();
    } catch (error) {
      console.error("API key validation error:", error);
      this.showError("Invalid API key. Please check and try again.");
    }
  }

  toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById("apiKeyInput");
    const toggleBtn = document.getElementById("toggleApiKey");

    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text";
      toggleBtn.textContent = "🙈";
    } else {
      apiKeyInput.type = "password";
      toggleBtn.textContent = "👁️";
    }
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await chrome.storage.local.set({ [key]: value });
    this.updateStatusIndicator();

    // Notify content scripts of settings change
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "settingsUpdated",
          settings: this.settings,
        });
      }
    } catch (error) {
      // Content script might not be loaded, ignore error
    }
  }

  async loadLogs() {
    try {
      const result = await chrome.storage.local.get(["postLogs"]);
      this.logs = result.postLogs || [];
      this.displayLogs();
    } catch (error) {
      console.error("Error loading logs:", error);
    }
  }

  displayLogs() {
    const logsList = document.getElementById("logsList");

    if (this.logs.length === 0) {
      logsList.innerHTML = '<div class="no-logs">No activity yet</div>';
      return;
    }

    // Show last 10 logs
    const recentLogs = this.logs.slice(-10).reverse();

    logsList.innerHTML = recentLogs
      .map((log) => {
        const date = new Date(log.timestamp);
        const analysis = log.analysis;
        const riskLevel = this.calculateRiskLevel(analysis.result);

        return `
        <div class="log-item risk-${riskLevel}">
          <div class="log-header">
            <span class="log-time">${date.toLocaleTimeString()}</span>
            <span class="log-risk risk-${riskLevel}">${riskLevel.toUpperCase()}</span>
          </div>
          <div class="log-details">
            <div class="log-issues">
              ${this.formatLogIssues(analysis.result)}
            </div>
            <div class="log-action">
              User: ${log.userDecision === "override" ? "Posted anyway" : "Edited post"}
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  formatLogIssues(result) {
    const issues = [];

    if (result.pii && result.pii.length > 0) {
      issues.push(`${result.pii.length} PII item(s)`);
    }

    if (result.toxicity && result.toxicity.isToxic) {
      issues.push("Toxic content");
    }

    if (result.policyViolations && result.policyViolations.length > 0) {
      issues.push(`${result.policyViolations.length} policy violation(s)`);
    }

    if (result.entities && result.entities.length > 0) {
      issues.push(`${result.entities.length} named entity(ies)`);
    }

    return issues.length > 0 ? issues.join(", ") : "No issues detected";
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

  async updateAnalytics() {
    try {
      const result = await chrome.storage.local.get(["postLogs"]);
      const logs = result.postLogs || [];

      const totalScans = logs.length;
      const riskyPosts = logs.filter(
        (log) => log.analysis.result.isRisky
      ).length;
      const overrides = logs.filter(
        (log) => log.userDecision === "override"
      ).length;

      document.getElementById("totalScans").textContent = totalScans;
      document.getElementById("riskyPosts").textContent = riskyPosts;
      document.getElementById("overrides").textContent = overrides;
    } catch (error) {
      console.error("Error updating analytics:", error);
    }
  }

  async clearLogs() {
    if (
      confirm(
        "Are you sure you want to clear all logs? This action cannot be undone."
      )
    ) {
      try {
        await chrome.storage.local.set({ postLogs: [] });
        this.logs = [];
        this.displayLogs();
        this.updateAnalytics();
        this.showSuccess("Logs cleared successfully");
      } catch (error) {
        console.error("Error clearing logs:", error);
        this.showError("Failed to clear logs");
      }
    }
  }

  async exportLogs() {
    try {
      const result = await chrome.storage.local.get(["postLogs"]);
      const logs = result.postLogs || [];

      if (logs.length === 0) {
        this.showError("No logs to export");
        return;
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        totalLogs: logs.length,
        logs: logs.map((log) => ({
          timestamp: log.timestamp,
          date: new Date(log.timestamp).toISOString(),
          url: log.url,
          userDecision: log.userDecision,
          analysis: {
            isRisky: log.analysis.result.isRisky,
            piiCount: log.analysis.result.pii?.length || 0,
            entitiesCount: log.analysis.result.entities?.length || 0,
            isToxic: log.analysis.result.toxicity?.isToxic || false,
            policyViolationsCount:
              log.analysis.result.policyViolations?.length || 0,
          },
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `safepost-logs-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      this.showSuccess("Logs exported successfully");
    } catch (error) {
      console.error("Error exporting logs:", error);
      this.showError("Failed to export logs");
    }
  }

  openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector(".popup-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = `popup-notification notification-${type}`;
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

// Initialize popup when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new SafePostPopup();
});
