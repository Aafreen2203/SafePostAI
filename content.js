// SafePost AI - Fixed Content Script for Sensitive Data Detection
console.log("🛡️ SafePost AI v1.2: Starting Enhanced Detection...");

function displayWarnings(analysis) {
  if (
    !analysis ||
    !analysis.detected ||
    !analysis.items ||
    analysis.items.length === 0
  ) {
    console.log("✅ No sensitive content detected");
    return;
  }

  // Remove any existing warnings
  removeExistingWarnings();

  // Create warning container
  const warningContainer = document.createElement("div");
  warningContainer.className = "safepost-warning-container";
  warningContainer.innerHTML = `
        <div class="safepost-warning-header">
            <span class="safepost-warning-icon">⚠️</span>
            <span class="safepost-warning-title">Sensitive Content Detected</span>
            <button class="safepost-dismiss-btn" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="safepost-warning-content">
            <p class="safepost-warning-subtitle">The following sensitive information was detected:</p>
            <div class="safepost-warning-items">
                ${analysis.items
                  .map(
                    (item) => `
                    <div class="safepost-warning-item">
                        <div class="safepost-item-category">${item.category}</div>
                        <div class="safepost-item-text">"${item.text}"</div>
                        <div class="safepost-item-reason">${item.reason}</div>
                        <div class="safepost-item-suggestion"><strong>Suggestion:</strong> ${item.suggestion}</div>
                    </div>
                `
                  )
                  .join("")}
            </div>
            <div class="safepost-warning-actions">
                <button class="safepost-btn safepost-btn-primary" onclick="this.closest('.safepost-warning-container').remove()">
                    I'll review and edit
                </button>
                <button class="safepost-btn safepost-btn-secondary" onclick="this.closest('.safepost-warning-container').remove()">
                    Post anyway
                </button>
            </div>
        </div>
    `;

  // Insert warning before the post area
  const postArea = findPostTextarea();
  if (postArea) {
    postArea.parentNode.insertBefore(warningContainer, postArea);
    postArea.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Add ping response for debugging
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.ping) {
    console.log("🛡️ SafePost AI: Responding to ping");
    sendResponse("SafePost AI content script loaded and active");
  }
});

class SensitiveContentDetector {
  constructor() {
    this.isEnabled = true;
    this.debugMode = true;
    this.activeWarnings = new Set();
    this.init();
  }

  async init() {
    console.log("🛡️ SafePost AI: Initializing Enhanced Detector...");

    // Initialize AI Privacy Analyzer
    await this.initializeAIAnalyzer();

    // Start immediately with regex patterns (no API dependency)
    this.startMonitoring();

    // Load Tesseract for image analysis
    this.loadTesseract();

    console.log("✅ SafePost AI: Ready for text and image analysis!");
  }

  async initializeAIAnalyzer() {
    try {
      // Get API keys from storage
      const result = await chrome.storage.local.get([
        "openaiApiKey",
        "huggingfaceApiKey",
        "preferredAI",
      ]);

      // Initialize AI Privacy Analyzer
      if (!window.AIPrivacyAnalyzer) {
        await this.loadAIAnalyzer();
      }

      this.aiAnalyzer = new window.AIPrivacyAnalyzer({
        openaiApiKey: result.openaiApiKey,
        huggingfaceApiKey: result.huggingfaceApiKey,
        preferredProvider: result.preferredAI || "openai",
      });

      if (result.openaiApiKey || result.huggingfaceApiKey) {
        console.log("🤖 SafePost AI: AI-powered analysis enabled");
      } else {
        console.log(
          "📝 SafePost AI: Using regex-based analysis (add API keys for AI enhancement)"
        );
      }
    } catch (error) {
      console.error("❌ SafePost AI: Error initializing AI analyzer:", error);
      this.aiAnalyzer = null;
    }
  }

  async loadAIAnalyzer() {
    return new Promise((resolve, reject) => {
      if (window.AIPrivacyAnalyzer) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("api/ai-privacy-analyzer.js");
      script.onload = () => {
        console.log("✅ SafePost AI: AI Privacy Analyzer loaded");
        resolve();
      };
      script.onerror = () => {
        console.error("❌ SafePost AI: Failed to load AI Privacy Analyzer");
        reject(new Error("Failed to load AI Privacy Analyzer"));
      };
      document.head.appendChild(script);
    });
  }

  // Enhanced sensitive data patterns
  getSensitivePatterns() {
    return {
      // Email patterns
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        label: "Email Address",
        risk: "high",
      },

      // Phone number patterns (Indian and International)
      phone: {
        regex:
          /(\+91[-\s]?)?[6-9]\d{9}|\(\d{3}\)\s?\d{3}[-\s]?\d{4}|(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        label: "Phone Number",
        risk: "high",
      },

      // Aadhaar Number (12 digits)
      aadhaar: {
        regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        label: "Aadhaar Number",
        risk: "critical",
      },

      // PAN Card
      pan: {
        regex: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
        label: "PAN Card",
        risk: "critical",
      },

      // Indian Pincode
      pincode: {
        regex: /\b\d{6}\b/g,
        label: "Postal Code",
        risk: "medium",
      },

      // Address patterns (enhanced)
      address: {
        regex:
          /\b\d+[\/\-]?\d*[\s,]*[\w\s]+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|chsl|society|apartment|building|tower|complex|residency|heights|park|gardens|enclave|layout|phase|sector|block|plot|flat|house|near|dist|maharashtra|mumbai|delhi|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|gujarat|rajasthan|karnataka|tamil nadu|west bengal|uttar pradesh|kerala|assam)[\w\s,]*\d{6}?/gi,
        label: "Address",
        risk: "high",
      },

      // Credit Card patterns
      creditCard: {
        regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        label: "Credit Card",
        risk: "critical",
      },

      // SSN (US)
      ssn: {
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        label: "SSN",
        risk: "critical",
      },

      // IP Address
      ipAddress: {
        regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        label: "IP Address",
        risk: "medium",
      },

      // Full Name patterns (simple)
      fullName: {
        regex: /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g,
        label: "Full Name",
        risk: "medium",
      },
    };
  }

  startMonitoring() {
    console.log("🔍 SafePost AI: Starting comprehensive monitoring...");

    // Monitor text inputs immediately
    this.monitorTextInputs();

    // Monitor images
    this.monitorImages();

    // Monitor file inputs for image uploads
    this.monitorFileInputs();

    // Set up mutation observer for dynamic content
    this.observePageChanges();

    // Add global message for verification
    this.showStartupNotification();
  }

  showStartupNotification() {
    const notification = document.createElement("div");
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        color: white;
        padding: 12px 18px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(46, 204, 113, 0.3);
        z-index: 999999;
        animation: slideIn 0.3s ease-out;
        cursor: pointer;
      " onclick="this.remove()">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">🛡️</span>
          <div>
            <div>SafePost AI Active</div>
            <div style="font-size: 11px; opacity: 0.9;">Monitoring for sensitive content</div>
          </div>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = "slideIn 0.3s ease-out reverse";
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

  monitorTextInputs() {
    const textSelectors = [
      "textarea",
      'input[type="text"]',
      'input[type="email"]',
      '[contenteditable="true"]',
      '[role="textbox"]',
      '[data-testid*="text"]',
      '[placeholder*="What"]', // Instagram/Facebook post inputs
      '[aria-label*="tweet"]', // Twitter
      '[data-text="true"]', // Various platforms
    ];

    let elementsFound = 0;

    textSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (!element.dataset.safepostAttached) {
          this.attachToTextElement(element);
          elementsFound++;
        }
      });
    });

    console.log(`📝 SafePost AI: Monitoring ${elementsFound} text inputs`);
  }

  attachToTextElement(element) {
    element.dataset.safepostAttached = "true";

    console.log(
      "📝 SafePost AI: Attached to:",
      element.tagName,
      element.placeholder || element.getAttribute("aria-label") || "unlabeled"
    );

    // Multiple event listeners for comprehensive coverage
    const events = ["input", "paste", "keyup", "focus", "blur"];

    events.forEach((eventType) => {
      element.addEventListener(eventType, (e) => {
        if (eventType === "paste") {
          // Delay to allow paste content to be processed
          setTimeout(() => this.analyzeTextInput(element), 150);
        } else {
          this.analyzeTextInput(element);
        }
      });
    });

    // Initial analysis if element already has content
    if (this.getElementText(element).trim().length > 0) {
      this.analyzeTextInput(element);
    }
  }

  getElementText(element) {
    return element.value || element.textContent || element.innerText || "";
  }

  async analyzeTextInput(element) {
    const text = this.getElementText(element);

    if (text.length < 5) {
      this.clearTextWarning(element);
      return;
    }

    if (this.debugMode) {
      console.log(
        "🔍 Analyzing text:",
        text.substring(0, 100) + (text.length > 100 ? "..." : "")
      );
    }

    let detections = [];

    // Use AI-powered analysis if available
    if (this.aiAnalyzer) {
      try {
        const aiDetections = await this.aiAnalyzer.analyzePrivacy(text);
        if (aiDetections && aiDetections.length > 0) {
          detections = aiDetections.map((detection) => ({
            type: detection.type || "pii",
            label: detection.label || "Privacy Risk",
            text: detection.text,
            risk: detection.risk || "medium",
            start: detection.start || 0,
            end: detection.end || detection.text.length,
            source: "ai",
          }));
        }
      } catch (error) {
        console.warn("AI analysis failed, falling back to regex:", error);
      }
    }

    // If no AI detections or AI unavailable, use regex patterns
    if (detections.length === 0) {
      const patterns = this.getSensitivePatterns();

      // Check each pattern
      Object.entries(patterns).forEach(([type, config]) => {
        const matches = [...text.matchAll(config.regex)];
        matches.forEach((match) => {
          detections.push({
            type: type,
            label: config.label,
            text: match[0],
            risk: config.risk,
            start: match.index,
            end: match.index + match[0].length,
            source: "regex",
          });
        });
      });
    }

    if (detections.length > 0) {
      console.log("🚨 SENSITIVE DATA DETECTED:", detections);
      this.showTextWarning(element, detections);
    } else {
      this.clearTextWarning(element);
    }
  }

  showTextWarning(element, detections) {
    this.clearTextWarning(element);

    const highestRisk = this.getHighestRisk(detections);
    const riskColors = {
      critical: "#e74c3c",
      high: "#f39c12",
      medium: "#f1c40f",
    };

    const warning = document.createElement("div");
    warning.className = "safepost-text-warning";
    warning.style.cssText = `
      position: fixed;
      background: ${riskColors[highestRisk] || "#f39c12"};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 6px 25px rgba(0,0,0,0.15);
      z-index: 999998;
      min-width: 280px;
      max-width: 350px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      animation: warningPulse 0.5s ease-out;
    `;

    const criticalCount = detections.filter(
      (d) => d.risk === "critical"
    ).length;
    const highCount = detections.filter((d) => d.risk === "high").length;

    warning.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <span style="font-size: 18px; margin-top: 2px;">${highestRisk === "critical" ? "🔴" : "⚠️"}</span>
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 6px;">
            ${highestRisk === "critical" ? "CRITICAL" : "SENSITIVE"} Information Detected
          </div>
          <div style="font-size: 11px; opacity: 0.95; margin-bottom: 10px;">
            Found: ${detections.map((d) => d.label).join(", ")}
            ${criticalCount > 0 ? `\n🔴 ${criticalCount} critical item${criticalCount > 1 ? "s" : ""}` : ""}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button onclick="this.closest('.safepost-text-warning').remove()" style="
              background: rgba(255,255,255,0.25);
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              font-size: 11px;
              cursor: pointer;
              font-weight: 600;
            ">Hide</button>
            <button onclick="window.safepostShowTextDetails && window.safepostShowTextDetails()" style="
              background: rgba(255,255,255,0.25);
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              font-size: 11px;
              cursor: pointer;
            ">Details</button>
          </div>
        </div>
      </div>
      <style>
        @keyframes warningPulse {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `;

    // Position near element
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = Math.max(10, Math.min(rect.left, viewportWidth - 360));
    let top = rect.top - 100;

    if (top < 10) top = rect.bottom + 10;
    if (top + 150 > viewportHeight) top = viewportHeight - 160;

    warning.style.left = left + "px";
    warning.style.top = top + "px";

    document.body.appendChild(warning);

    const warningId = Date.now().toString();
    element.dataset.safepostWarningId = warningId;
    warning.dataset.warningId = warningId;

    // Store details for popup
    window.safepostShowTextDetails = () => {
      const details = detections
        .map((d) => `${d.label} (${d.risk}): "${d.text}"`)
        .join("\n");
      alert(
        `Sensitive Information Detected:\n\n${details}\n\nPlease review before posting.`
      );
    };

    this.activeWarnings.add(warningId);
  }

  getHighestRisk(detections) {
    if (detections.some((d) => d.risk === "critical")) return "critical";
    if (detections.some((d) => d.risk === "high")) return "high";
    return "medium";
  }

  clearTextWarning(element) {
    const warningId = element.dataset.safepostWarningId;
    if (warningId) {
      const warning = document.querySelector(
        `[data-warning-id="${warningId}"]`
      );
      if (warning) warning.remove();
      delete element.dataset.safepostWarningId;
      this.activeWarnings.delete(warningId);
    }
  }

  monitorImages() {
    const images = document.querySelectorAll("img");
    let imageCount = 0;

    images.forEach((img) => {
      if (this.shouldAnalyzeImage(img) && !img.dataset.safepostImageProcessed) {
        this.analyzeImage(img);
        imageCount++;
      }
    });

    console.log(`🖼️ SafePost AI: Found ${imageCount} images to analyze`);
  }

  shouldAnalyzeImage(img) {
    // Check if image is likely user content
    const src = img.src || "";

    // Enhanced detection for user-uploaded content
    const isUserContent =
      // Data URLs and blob URLs (direct uploads)
      src.includes("blob:") ||
      src.includes("data:") ||
      // Platform-specific selectors
      img.closest('[data-testid*="upload"]') ||
      img.closest('[data-testid*="creation"]') ||
      img.closest('[data-testid*="composer"]') ||
      img.closest('[data-testid*="photo"]') ||
      img.closest('[data-testid*="image"]') ||
      img.closest('[data-testid*="media"]') ||
      img.closest(".media-preview") ||
      img.closest('[aria-label*="photo"]') ||
      img.closest('[aria-label*="image"]') ||
      img.closest('[aria-label*="upload"]') ||
      // File input related
      img.closest('input[type="file"]') ||
      img.closest(".file-upload") ||
      img.closest(".image-upload") ||
      // Social media specific
      img.closest('[data-pagelet*="composer"]') ||
      img.closest('[role="dialog"]') ||
      img.closest(".composer") ||
      // Instagram specific
      img.closest('[data-testid="new-post-photo"]') ||
      img.closest('[data-testid="creation-photo"]') ||
      // Twitter specific
      img.closest('[data-testid="tweet-composer"]') ||
      img.closest('[data-testid="media-upload"]') ||
      // Generic upload areas
      img.closest('[class*="upload"]') ||
      img.closest('[class*="preview"]') ||
      img.closest('[class*="composer"]') ||
      img.closest('[id*="upload"]') ||
      img.closest('[id*="preview"]') ||
      // Check if image was recently added (likely uploaded)
      img.dataset.recentlyAdded === "true";

    // Must be reasonably sized and likely to contain text
    const minSize = 100; // Reduced from 150 for better coverage
    const hasGoodSize =
      (img.naturalWidth > minSize && img.naturalHeight > minSize) ||
      (img.width > minSize && img.height > minSize);

    // Additional check: if it's a small image but in an upload context, still analyze
    const inUploadContext =
      img.closest('[data-testid*="upload"]') ||
      img.closest(".file-upload") ||
      img.closest(".image-upload") ||
      src.includes("blob:") ||
      src.includes("data:");

    const shouldAnalyze =
      (isUserContent && hasGoodSize) ||
      (inUploadContext && img.naturalWidth > 50);

    if (this.debugMode && shouldAnalyze) {
      console.log("🖼️ Image will be analyzed:", {
        src: src.substring(0, 50),
        isUserContent,
        hasGoodSize,
        inUploadContext,
        dimensions: `${img.naturalWidth || img.width}x${img.naturalHeight || img.height}`,
      });
    }

    return shouldAnalyze;
  }

  monitorFileInputs() {
    console.log("📁 SafePost AI: Monitoring file inputs for image uploads...");

    // Find all file inputs that accept images
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let inputCount = 0;

    fileInputs.forEach((input) => {
      if (!input.dataset.safepostFileAttached) {
        input.dataset.safepostFileAttached = "true";
        inputCount++;

        input.addEventListener("change", (event) => {
          const files = event.target.files;
          if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
              if (file.type.startsWith("image/")) {
                console.log("📁 SafePost AI: Image file selected:", file.name);
                this.analyzeUploadedFile(file, input);
              }
            });
          }
        });
      }
    });

    // Also monitor drag and drop areas
    const dropAreas = document.querySelectorAll(
      '[data-testid*="upload"], .upload-area, .drop-zone, [class*="drop"]'
    );
    dropAreas.forEach((area) => {
      if (!area.dataset.safepostDropAttached) {
        area.dataset.safepostDropAttached = "true";

        area.addEventListener("dragover", (e) => {
          e.preventDefault();
        });

        area.addEventListener("drop", (e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
              if (file.type.startsWith("image/")) {
                console.log("📁 SafePost AI: Image dropped:", file.name);
                this.analyzeUploadedFile(file, area);
              }
            });
          }
        });
      }
    });

    console.log(
      `📁 SafePost AI: Monitoring ${inputCount} file inputs and ${dropAreas.length} drop areas`
    );
  }

  async analyzeUploadedFile(file, sourceElement) {
    console.log("📁 SafePost AI: Analyzing uploaded file:", file.name);

    try {
      // Create temporary image element for analysis
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.dataset.safepostFileUpload = "true";
      img.dataset.fileName = file.name;

      // Wait for image to load
      img.onload = () => {
        console.log("📁 SafePost AI: File loaded, starting OCR analysis...");
        this.analyzeImage(img);

        // Clean up object URL after analysis
        setTimeout(() => {
          URL.revokeObjectURL(img.src);
        }, 30000);
      };

      img.onerror = () => {
        console.error("📁 SafePost AI: Failed to load uploaded image");
        URL.revokeObjectURL(img.src);
      };
    } catch (error) {
      console.error("📁 SafePost AI: Error analyzing uploaded file:", error);
    }
  }

  async analyzeImage(img) {
    img.dataset.safepostImageProcessed = "true";
    console.log(
      "🖼️ SafePost AI: Starting image analysis...",
      img.src.substring(0, 50)
    );

    this.showImageAnalyzing(img);

    try {
      if (!window.Tesseract) {
        console.log("⏳ SafePost AI: Loading OCR engine...");
        await this.loadTesseract();
      }

      if (!window.Tesseract) {
        console.log("❌ SafePost AI: OCR not available");
        this.hideImageAnalyzing(img);
        return;
      }

      console.log("🔍 SafePost AI: Running OCR on image...");
      const {
        data: { text },
      } = await Tesseract.recognize(img, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      this.hideImageAnalyzing(img);

      if (text && text.trim().length > 10) {
        console.log(
          "📝 SafePost AI: Text found in image:",
          text.substring(0, 200)
        );

        const detections = await this.analyzeSensitiveTextWithAI(text);

        if (detections.length > 0) {
          console.log("🚨 SafePost AI: Sensitive data in image!", detections);
          this.showImageWarning(img, text, detections);
        } else {
          console.log("✅ SafePost AI: No sensitive data found in image");
        }
      } else {
        console.log("ℹ️ SafePost AI: No readable text in image");
      }
    } catch (error) {
      console.error("❌ SafePost AI: Image analysis failed:", error);
      this.hideImageAnalyzing(img);
    }
  }

  async analyzeSensitiveTextWithAI(text) {
    let detections = [];

    // Use AI-powered analysis if available
    if (this.aiAnalyzer) {
      try {
        const aiDetections = await this.aiAnalyzer.analyzePrivacy(text);
        if (aiDetections && aiDetections.length > 0) {
          detections = aiDetections.map((detection) => ({
            type: detection.type || "pii",
            label: detection.label || "Privacy Risk",
            text: detection.text,
            risk: detection.risk || "medium",
            source: "ai",
          }));
        }
      } catch (error) {
        console.warn(
          "AI analysis failed for image text, falling back to regex:",
          error
        );
      }
    }

    // If no AI detections or AI unavailable, use regex patterns
    if (detections.length === 0) {
      detections = this.analyzeSensitiveText(text);
    }

    return detections;
  }

  analyzeSensitiveText(text) {
    const patterns = this.getSensitivePatterns();
    const detections = [];

    Object.entries(patterns).forEach(([type, config]) => {
      const matches = [...text.matchAll(config.regex)];
      matches.forEach((match) => {
        detections.push({
          type: type,
          label: config.label,
          text: match[0],
          risk: config.risk,
          source: "regex",
        });
      });
    });

    return detections;
  }

  showImageAnalyzing(img) {
    const indicator = document.createElement("div");
    indicator.className = "safepost-analyzing";
    indicator.innerHTML = `
      <div style="
        position: fixed;
        background: rgba(52, 152, 219, 0.95);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        font-size: 13px;
        text-align: center;
        backdrop-filter: blur(10px);
        box-shadow: 0 6px 25px rgba(52, 152, 219, 0.3);
        z-index: 999999;
        min-width: 180px;
      ">
        <div style="
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px auto;
        "></div>
        <div style="font-weight: 600;">Analyzing Image</div>
        <div style="font-size: 11px; opacity: 0.9; margin-top: 4px;">Scanning for sensitive content...</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    const rect = img.getBoundingClientRect();
    indicator.style.left = Math.max(10, rect.left + rect.width / 2 - 90) + "px";
    indicator.style.top = Math.max(10, rect.top + rect.height / 2 - 40) + "px";

    document.body.appendChild(indicator);

    const indicatorId = Date.now().toString();
    img.dataset.safepostIndicatorId = indicatorId;
    indicator.dataset.indicatorId = indicatorId;
  }

  hideImageAnalyzing(img) {
    const indicatorId = img.dataset.safepostIndicatorId;
    if (indicatorId) {
      const indicator = document.querySelector(
        `[data-indicator-id="${indicatorId}"]`
      );
      if (indicator) indicator.remove();
      delete img.dataset.safepostIndicatorId;
    }
  }

  showImageWarning(img, extractedText, detections) {
    const overlay = document.createElement("div");
    overlay.className = "safepost-image-warning";

    const highestRisk = this.getHighestRisk(detections);
    const riskEmoji = highestRisk === "critical" ? "🔴" : "⚠️";
    const riskColor = highestRisk === "critical" ? "#e74c3c" : "#f39c12";

    overlay.innerHTML = `
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, ${riskColor}ee, ${riskColor}dd);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        backdrop-filter: blur(8px);
        border-radius: 8px;
        border: 2px solid ${riskColor};
      ">
        <div style="
          background: rgba(0,0,0,0.3);
          padding: 20px;
          border-radius: 12px;
          backdrop-filter: blur(15px);
          max-width: 90%;
          border: 1px solid rgba(255,255,255,0.2);
        ">
          <div style="font-size: 32px; margin-bottom: 12px;">${riskEmoji}</div>
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
            ${highestRisk === "critical" ? "CRITICAL CONTENT" : "SENSITIVE CONTENT"}
          </div>
          <div style="font-size: 13px; margin-bottom: 4px; opacity: 0.95;">
            This image contains sensitive information:
          </div>
          <div style="font-size: 12px; margin-bottom: 15px; opacity: 0.9; font-weight: 600;">
            ${detections.map((d) => d.label).join(", ")}
          </div>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button onclick="this.closest('.safepost-image-warning').style.display='none'" style="
              background: rgba(255,255,255,0.25);
              border: none;
              color: white;
              padding: 10px 16px;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
              font-weight: 600;
              transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.25)'">
              Hide Warning
            </button>
            <button onclick="window.safepostShowImageDetails && window.safepostShowImageDetails()" style="
              background: rgba(255,255,255,0.25);
              border: none;
              color: white;
              padding: 10px 16px;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
              transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.25)'">
              Show Details
            </button>
          </div>
        </div>
      </div>
    `;

    // Position overlay over image
    const rect = img.getBoundingClientRect();
    overlay.style.position = "fixed";
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.style.zIndex = "999997";
    overlay.style.pointerEvents = "all";

    document.body.appendChild(overlay);

    // Store details function
    window.safepostShowImageDetails = () => {
      const details = `Extracted Text:\n${extractedText.substring(0, 500)}${extractedText.length > 500 ? "..." : ""}\n\nSensitive Information:\n${detections.map((d) => `• ${d.label} (${d.risk}): "${d.text}"`).join("\n")}`;
      alert(details);
    };

    console.log("🚨 SafePost AI: Image warning displayed");
  }

  async loadTesseract() {
    return new Promise((resolve, reject) => {
      if (window.Tesseract) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js";
      script.onload = () => {
        console.log("✅ SafePost AI: Tesseract.js loaded successfully");
        resolve();
      };
      script.onerror = () => {
        console.error("❌ SafePost AI: Failed to load Tesseract.js");
        reject(new Error("Failed to load Tesseract.js"));
      };
      document.head.appendChild(script);
    });
  }

  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      let foundNewContent = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // New text inputs
            const textInputs = this.findTextInputsInNode(node);
            textInputs.forEach((input) => {
              if (!input.dataset.safepostAttached) {
                this.attachToTextElement(input);
                foundNewContent = true;
              }
            });

            // New file inputs
            const fileInputs = this.findFileInputsInNode(node);
            fileInputs.forEach((input) => {
              if (!input.dataset.safepostFileAttached) {
                this.attachToFileInput(input);
                foundNewContent = true;
              }
            });

            // New images
            const images =
              node.matches && node.matches("img")
                ? [node]
                : node.querySelectorAll
                  ? Array.from(node.querySelectorAll("img"))
                  : [];

            images.forEach((img) => {
              if (
                this.shouldAnalyzeImage(img) &&
                !img.dataset.safepostImageProcessed
              ) {
                setTimeout(() => this.analyzeImage(img), 1000);
                foundNewContent = true;
              }
            });
          }
        });
      });

      if (foundNewContent && this.debugMode) {
        console.log("🔄 SafePost AI: Found new content to monitor");
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    console.log("👁️ SafePost AI: Page observer active");
  }

  findTextInputsInNode(node) {
    const selectors = [
      "textarea",
      'input[type="text"]',
      'input[type="email"]',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ];

    const inputs = [];

    // Check if node itself matches
    selectors.forEach((selector) => {
      if (node.matches && node.matches(selector)) {
        inputs.push(node);
      }
    });

    // Check children
    if (node.querySelectorAll) {
      selectors.forEach((selector) => {
        inputs.push(...Array.from(node.querySelectorAll(selector)));
      });
    }

    return inputs;
  }

  findFileInputsInNode(node) {
    const inputs = [];

    // Check if node itself is a file input
    if (node.matches && node.matches('input[type="file"]')) {
      inputs.push(node);
    }

    // Check children
    if (node.querySelectorAll) {
      inputs.push(...Array.from(node.querySelectorAll('input[type="file"]')));
    }

    return inputs;
  }

  attachToFileInput(input) {
    input.dataset.safepostFileAttached = "true";
    console.log("📁 SafePost AI: Attached to file input");

    input.addEventListener("change", (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        Array.from(files).forEach((file) => {
          if (file.type.startsWith("image/")) {
            console.log("📁 SafePost AI: Image file selected:", file.name);
            this.analyzeUploadedFile(file, input);
          }
        });
      }
    });
  }
}

// Initialize when document is ready
function initSafePost() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.safepostDetector = new SensitiveContentDetector();
    });
  } else {
    window.safepostDetector = new SensitiveContentDetector();
  }
}

// Start immediately
initSafePost();

console.log("🛡️ SafePost AI: Enhanced content script loaded!");
