// SafePost AI - Content Script (Cloud OCR Only)
console.log("🛡️ SafePost AI v1.2: Starting Enhanced Detection...");

// OCR.space API Key
const OCR_SPACE_API_KEY = "K83865885088957";

// Helper: Remove existing warnings
function removeExistingWarnings() {
  document
    .querySelectorAll(
      ".safepost-warning-container, .safepost-text-warning, .safepost-image-warning"
    )
    .forEach((el) => el.remove());
}

// Helper: Convert image element to Blob
async function imageElementToBlob(imgElement) {
  const canvas = document.createElement("canvas");
  canvas.width = imgElement.naturalWidth || imgElement.width;
  canvas.height = imgElement.naturalHeight || imgElement.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgElement, 0, 0);
  return await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.95)
  );
}

// Cloud OCR function using OCR.space
async function extractTextWithCloudOCR(imageBlob) {
  const formData = new FormData();
  formData.append("file", imageBlob, "image.jpg");
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("apikey", OCR_SPACE_API_KEY);

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
  });
  const result = await response.json();
  return result.ParsedResults?.[0]?.ParsedText || "";
}

// Show analysis indicator on image
function showImageAnalysisIndicator(imgElement) {
  const existing = imgElement.parentNode?.querySelector(
    ".safepost-image-indicator"
  );
  if (existing) existing.remove();
  const indicator = document.createElement("div");
  indicator.className = "safepost-image-indicator safepost-analyzing";
  indicator.innerHTML = `<div class="safepost-indicator-icon">🔍</div><div class="safepost-indicator-text">Analyzing...</div>`;
  indicator.style.position = "absolute";
  indicator.style.top = "10px";
  indicator.style.right = "10px";
  indicator.style.zIndex = "9999";
  if (getComputedStyle(imgElement.parentNode).position === "static") {
    imgElement.parentNode.style.position = "relative";
  }
  imgElement.parentNode.appendChild(indicator);
  return indicator;
}

// Update indicator based on analysis results
function updateImageAnalysisIndicator(indicator, analysis) {
  if (!indicator) return;
  indicator.className = "safepost-image-indicator";
  const riskConfig = {
    none: { icon: "✅", text: "Safe", class: "safepost-safe" },
    low: { icon: "⚠️", text: "Low Risk", class: "safepost-low-risk" },
    medium: { icon: "⚠️", text: "Medium Risk", class: "safepost-medium-risk" },
    high: { icon: "🚨", text: "High Risk", class: "safepost-high-risk" },
    critical: { icon: "❌", text: "Critical", class: "safepost-critical-risk" },
  };
  const config = riskConfig[analysis.riskLevel] || riskConfig["none"];
  indicator.className += ` ${config.class}`;
  indicator.innerHTML = `<div class="safepost-indicator-icon">${config.icon}</div><div class="safepost-indicator-text">${config.text}</div>`;
}

// Show generic warning if OCR fails
function showGenericImageWarning(imgElement) {
  const warning = document.createElement("div");
  warning.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: #f39c12; color: white;
    padding: 10px; border-radius: 6px; z-index: 999999;`;
  warning.textContent = "⚠️ Could not analyze image properly";
  document.body.appendChild(warning);
  setTimeout(() => warning.remove(), 5000);
}

// Main class
class SensitiveContentDetector {
  constructor() {
    this.isEnabled = true;
    this.init();
  }

  async init() {
    this.monitorVisibleImages();
    console.log("✅ SafePost AI: Ready for image analysis!");
  }

  // Monitor visible images on the page
  monitorVisibleImages() {
    const selectors = [
      "img[alt*='Photo']",
      "img[src*='blob:']",
      "img[src*='data:image']",
      "img", // catch all
    ];
    selectors.forEach((selector) => {
      document
        .querySelectorAll(selector)
        .forEach((img) => this.analyzeVisibleImage(img));
    });
    // Observe for new images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "IMG") this.analyzeVisibleImage(node);
            if (node.querySelectorAll)
              node
                .querySelectorAll("img")
                .forEach((img) => this.analyzeVisibleImage(img));
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Analyze a visible image using cloud OCR
  async analyzeVisibleImage(imgElement) {
    if (imgElement.hasAttribute("data-safepost-analyzed")) return;
    imgElement.setAttribute("data-safepost-analyzed", "true");
    try {
      const indicator = showImageAnalysisIndicator(imgElement);
      const blob = await imageElementToBlob(imgElement);
      if (!blob) return showGenericImageWarning(imgElement);
      const text = await extractTextWithCloudOCR(blob);
      const analysis = await this.analyzeSensitiveText(text);
      updateImageAnalysisIndicator(indicator, analysis);
      if (analysis.riskLevel !== "none" && analysis.warnings.length > 0) {
        // You can call your displayImageWarnings/overlay here if needed
        showGenericImageWarning(imgElement);
      }
    } catch (error) {
      console.error("❌ Visible image analysis failed:", error);
      showGenericImageWarning(imgElement);
    }
  }

  // Simple sensitive data detection (regex)
  async analyzeSensitiveText(text) {
    const patterns = {
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        risk: "high",
      },
      phone: {
        regex:
          /(\+91[-\s]?)?[6-9]\d{9}|\(\d{3}\)\s?\d{3}[-\s]?\d{4}|(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        risk: "high",
      },
      address: {
        regex:
          /\b\d+[\w\s]+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|place|plaza|boulevard|blvd)[\w\s,]*\d{5,6}?\b/gi,
        risk: "high",
      },
      creditCard: {
        regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        risk: "critical",
      },
      ssn: { regex: /\b\d{3}-?\d{2}-?\d{4}\b/g, risk: "critical" },
      fullName: {
        regex: /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g,
        risk: "medium",
      },
    };
    let warnings = [];
    let riskLevel = "none";
    Object.entries(patterns).forEach(([type, config]) => {
      const matches = [...text.matchAll(config.regex)];
      matches.forEach((match) => {
        warnings.push({
          type,
          message: `Detected ${type}: ${match[0]}`,
          risk: config.risk,
        });
        if (config.risk === "critical") riskLevel = "critical";
        else if (config.risk === "high" && riskLevel !== "critical")
          riskLevel = "high";
        else if (config.risk === "medium" && riskLevel === "none")
          riskLevel = "medium";
      });
    });
    return { riskLevel, warnings, extractedText: text };
  }
}

// Start the detector
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => new SensitiveContentDetector()
  );
} else {
  new SensitiveContentDetector();
}
console.log("🛡️ SafePost AI: Enhanced content script loaded!");
