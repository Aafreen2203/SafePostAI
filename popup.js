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
        "openaiApiKey",
        "huggingfaceApiKey",
        "ocrSpaceApiKey",
        "isEnabled",
        "sensitivity",
        "detectPII",
        "detectToxicity",
        "detectPolicy",
        "detectEntities",
      ]);

      this.settings = {
        openaiApiKey: result.openaiApiKey || "",
        huggingfaceApiKey: result.huggingfaceApiKey || "",
        ocrSpaceApiKey: result.ocrSpaceApiKey || "",
        isEnabled: result.isEnabled !== false,
        sensitivity: result.sensitivity || "medium",
        detectPII: result.detectPII !== false,
        detectToxicity: result.detectToxicity !== false,
        detectPolicy: result.detectPolicy !== false,
        detectEntities: result.detectEntities !== false,
      };
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  setupEventListeners() {
    // API Key management for all three keys
    document
      .getElementById("saveApiKeys")
      .addEventListener("click", () => this.saveApiKeys());
    document
      .getElementById("toggleOpenAIApiKey")
      .addEventListener("click", () =>
        this.toggleApiKeyVisibility("openaiApiKeyInput")
      );
    document
      .getElementById("toggleHuggingFaceApiKey")
      .addEventListener("click", () =>
        this.toggleApiKeyVisibility("huggingfaceApiKeyInput")
      );
    document
      .getElementById("toggleOcrSpaceApiKey")
      .addEventListener("click", () =>
        this.toggleApiKeyVisibility("ocrSpaceApiKeyInput")
      );
    [
      "openaiApiKeyInput",
      "huggingfaceApiKeyInput",
      "ocrSpaceApiKeyInput",
    ].forEach((id) => {
      document.getElementById(id).addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.saveApiKeys();
      });
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
    // Update API key inputs
    const openaiInput = document.getElementById("openaiApiKeyInput");
    const hfInput = document.getElementById("huggingfaceApiKeyInput");
    const ocrInput = document.getElementById("ocrSpaceApiKeyInput");
    if (openaiInput) openaiInput.value = this.settings.openaiApiKey;
    if (hfInput) hfInput.value = this.settings.huggingfaceApiKey;
    if (ocrInput) ocrInput.value = this.settings.ocrSpaceApiKey;

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

    // Show/hide sections based on API key presence (require at least one key)
    const hasAnyApiKey = !!(
      this.settings.openaiApiKey ||
      this.settings.huggingfaceApiKey ||
      this.settings.ocrSpaceApiKey
    );
    document.getElementById("settingsSection").style.display = hasAnyApiKey
      ? "block"
      : "none";
    document.getElementById("analyticsSection").style.display = hasAnyApiKey
      ? "block"
      : "none";
    document.getElementById("logsSection").style.display = hasAnyApiKey
      ? "block"
      : "none";
  }

  updateStatusIndicator() {
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");
    if (
      !this.settings.openaiApiKey &&
      !this.settings.huggingfaceApiKey &&
      !this.settings.ocrSpaceApiKey
    ) {
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

  async saveApiKeys() {
    const openaiInput = document.getElementById("openaiApiKeyInput");
    const hfInput = document.getElementById("huggingfaceApiKeyInput");
    const ocrInput = document.getElementById("ocrSpaceApiKeyInput");
    const openaiApiKey = openaiInput.value.trim();
    const huggingfaceApiKey = hfInput.value.trim();
    const ocrSpaceApiKey = ocrInput.value.trim();
    if (!openaiApiKey && !huggingfaceApiKey && !ocrSpaceApiKey) {
      this.showError("Please enter at least one API key.");
      return;
    }
    await chrome.storage.local.set({
      openaiApiKey,
      huggingfaceApiKey,
      ocrSpaceApiKey,
    });
    this.settings.openaiApiKey = openaiApiKey;
    this.settings.huggingfaceApiKey = huggingfaceApiKey;
    this.settings.ocrSpaceApiKey = ocrSpaceApiKey;
    this.showSuccess("API keys saved!");
    this.updateUI();
  }

  toggleApiKeyVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.type = input.type === "password" ? "text" : "password";
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
