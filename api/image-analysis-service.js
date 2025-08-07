// Image Analysis Service for SafePost AI
// Uses Tesseract.js for OCR and integrates with HuggingFace analysis

class ImageAnalysisService {
  constructor(apiService) {
    this.apiService = apiService;
    this.isLoading = false;
    this.loadTesseract();
  }

  async loadTesseract() {
    // Load Tesseract.js from CDN
    if (!window.Tesseract) {
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/tesseract.js@v4.1.1/dist/tesseract.min.js";
      script.onload = () => {
        console.log("✅ Tesseract.js loaded for OCR");
      };
      script.onerror = () => {
        console.error("❌ Failed to load Tesseract.js");
      };
      document.head.appendChild(script);
    }
  }

  // Analyze image for text content
  async analyzeImage(imageElement) {
    if (!window.Tesseract) {
      console.error("Tesseract.js not loaded");
      return { text: "", analysis: null, error: "OCR not available" };
    }

    if (this.isLoading) {
      console.log("OCR already in progress...");
      return { text: "", analysis: null, error: "OCR in progress" };
    }

    try {
      this.isLoading = true;
      console.log("🔍 Starting OCR analysis...");

      // Show loading indicator
      this.showOCRLoadingIndicator(imageElement);

      // Perform OCR
      const {
        data: { text },
      } = await Tesseract.recognize(imageElement, "eng", {
        logger: (m) => console.log("OCR Progress:", m),
      });

      console.log("📝 OCR extracted text:", text);

      // Analyze extracted text if any
      let analysis = null;
      if (text && text.trim().length > 10) {
        analysis = await this.apiService.analyzeText(text);
        console.log("📊 Text analysis result:", analysis);
      }

      this.hideOCRLoadingIndicator(imageElement);

      return {
        text: text,
        analysis: analysis,
        isRisky: analysis?.isRisky || false,
      };
    } catch (error) {
      console.error("❌ OCR analysis failed:", error);
      this.hideOCRLoadingIndicator(imageElement);

      return {
        text: "",
        analysis: null,
        error: error.message,
      };
    } finally {
      this.isLoading = false;
    }
  }

  // Monitor for uploaded images
  startImageMonitoring() {
    console.log("🖼️ Starting image monitoring...");

    // Instagram image selectors
    const imageSelectors = [
      'img[src*="blob:"]', // Uploaded images
      'img[src*="instagram"]', // Instagram images
      "canvas", // Canvas elements
      "video", // Video thumbnails
      ".media-preview img", // Preview images
      '[data-testid*="image"]', // Test ID images
      ".image-preview img", // Generic preview
    ];

    // Monitor existing images
    this.scanExistingImages();

    // Monitor for new images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node itself is an image
            if (this.isImageElement(node)) {
              this.handleNewImage(node);
            }

            // Check for images within the node
            imageSelectors.forEach((selector) => {
              const images = node.querySelectorAll
                ? node.querySelectorAll(selector)
                : [];
              images.forEach((img) => this.handleNewImage(img));
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  scanExistingImages() {
    const allImages = document.querySelectorAll("img, canvas");
    allImages.forEach((img) => {
      if (this.shouldAnalyzeImage(img)) {
        this.handleNewImage(img);
      }
    });
  }

  isImageElement(element) {
    return (
      element.tagName === "IMG" ||
      element.tagName === "CANVAS" ||
      element.tagName === "VIDEO"
    );
  }

  shouldAnalyzeImage(imageElement) {
    // Don't analyze if already processed
    if (imageElement.dataset.safepostImageAnalyzed) return false;

    // Don't analyze very small images (likely icons)
    if (imageElement.width < 100 || imageElement.height < 100) return false;

    // Don't analyze if not visible
    if (imageElement.offsetParent === null) return false;

    // Check if it's an uploaded/user content image
    const src = imageElement.src || "";
    const isUserContent =
      src.includes("blob:") ||
      src.includes("data:") ||
      imageElement.closest('[data-testid*="upload"]') ||
      imageElement.closest(".media-preview") ||
      imageElement.closest('[data-testid*="creation"]');

    return isUserContent;
  }

  async handleNewImage(imageElement) {
    if (!this.shouldAnalyzeImage(imageElement)) return;

    // Mark as processed
    imageElement.dataset.safepostImageAnalyzed = "true";

    console.log("🖼️ New image detected for analysis:", imageElement);

    // Wait for image to load completely
    if (!imageElement.complete) {
      imageElement.onload = () => this.analyzeImageContent(imageElement);
    } else {
      this.analyzeImageContent(imageElement);
    }
  }

  async analyzeImageContent(imageElement) {
    try {
      const result = await this.analyzeImage(imageElement);

      if (result.isRisky) {
        console.log("🚨 Risky content detected in image!");
        this.showImageWarning(imageElement, result);
      } else if (result.text && result.text.trim().length > 0) {
        console.log("ℹ️ Text found in image but not flagged as risky");
        this.showImageInfo(imageElement, result);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
    }
  }

  showImageWarning(imageElement, analysisResult) {
    // Remove existing warnings
    this.removeImageIndicators(imageElement);

    // Create warning overlay
    const overlay = document.createElement("div");
    overlay.className = "safepost-image-warning-overlay";
    overlay.innerHTML = `
      <div class="safepost-image-warning">
        <div class="safepost-warning-icon">⚠️</div>
        <div class="safepost-warning-text">
          <strong>Sensitive Content Detected</strong>
          <small>Image contains personal information</small>
        </div>
        <button class="safepost-warning-details" onclick="this.parentElement.parentElement.classList.toggle('expanded')">
          Details
        </button>
      </div>
      <div class="safepost-warning-details-content">
        <div class="safepost-extracted-text">
          <strong>Extracted Text:</strong>
          <p>${analysisResult.text.substring(0, 200)}${analysisResult.text.length > 200 ? "..." : ""}</p>
        </div>
        ${
          analysisResult.analysis?.pii?.length > 0
            ? `
          <div class="safepost-pii-found">
            <strong>PII Detected:</strong>
            <ul>
              ${analysisResult.analysis.pii.map((item) => `<li>${item.type}: ${item.text}</li>`).join("")}
            </ul>
          </div>
        `
            : ""
        }
        <div class="safepost-warning-actions">
          <button onclick="SafePostImageAnalysis.removeImage(this)" class="safepost-btn-remove">Remove Image</button>
          <button onclick="SafePostImageAnalysis.proceedAnyway(this)" class="safepost-btn-proceed">Continue Anyway</button>
        </div>
      </div>
    `;

    // Position overlay
    overlay.style.position = "absolute";
    overlay.style.zIndex = "10000";

    const rect = imageElement.getBoundingClientRect();
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";

    document.body.appendChild(overlay);

    // Store reference
    imageElement.dataset.safepostWarningId = Date.now().toString();
    overlay.dataset.warningId = imageElement.dataset.safepostWarningId;

    // Auto-hide after 10 seconds if not interacted with
    setTimeout(() => {
      if (
        overlay &&
        overlay.parentElement &&
        !overlay.classList.contains("user-interacted")
      ) {
        overlay.style.opacity = "0.5";
      }
    }, 10000);
  }

  showImageInfo(imageElement, analysisResult) {
    // Show a subtle info indicator
    const indicator = document.createElement("div");
    indicator.className = "safepost-image-info";
    indicator.innerHTML = `
      <div class="safepost-info-icon">ℹ️</div>
      <div class="safepost-info-tooltip">
        Text detected in image
        <div class="safepost-info-details">
          ${analysisResult.text.substring(0, 100)}...
        </div>
      </div>
    `;

    const rect = imageElement.getBoundingClientRect();
    indicator.style.position = "absolute";
    indicator.style.left = rect.right - 30 + "px";
    indicator.style.top = rect.top + "px";
    indicator.style.zIndex = "9999";

    document.body.appendChild(indicator);
    imageElement.dataset.safepostInfoId = Date.now().toString();
    indicator.dataset.infoId = imageElement.dataset.safepostInfoId;
  }

  showOCRLoadingIndicator(imageElement) {
    const indicator = document.createElement("div");
    indicator.className = "safepost-ocr-loading";
    indicator.innerHTML = `
      <div class="safepost-loading-spinner"></div>
      <div>Analyzing image...</div>
    `;

    const rect = imageElement.getBoundingClientRect();
    indicator.style.position = "absolute";
    indicator.style.left = rect.left + rect.width / 2 - 50 + "px";
    indicator.style.top = rect.top + rect.height / 2 - 25 + "px";
    indicator.style.zIndex = "10001";

    document.body.appendChild(indicator);
    imageElement.dataset.safepostLoadingId = Date.now().toString();
    indicator.dataset.loadingId = imageElement.dataset.safepostLoadingId;
  }

  hideOCRLoadingIndicator(imageElement) {
    const loadingId = imageElement.dataset.safepostLoadingId;
    if (loadingId) {
      const indicator = document.querySelector(
        `[data-loading-id="${loadingId}"]`
      );
      if (indicator) indicator.remove();
      delete imageElement.dataset.safepostLoadingId;
    }
  }

  removeImageIndicators(imageElement) {
    // Remove warning
    const warningId = imageElement.dataset.safepostWarningId;
    if (warningId) {
      const warning = document.querySelector(
        `[data-warning-id="${warningId}"]`
      );
      if (warning) warning.remove();
      delete imageElement.dataset.safepostWarningId;
    }

    // Remove info
    const infoId = imageElement.dataset.safepostInfoId;
    if (infoId) {
      const info = document.querySelector(`[data-info-id="${infoId}"]`);
      if (info) info.remove();
      delete imageElement.dataset.safepostInfoId;
    }
  }

  // Static methods for button callbacks
  static removeImage(button) {
    const overlay = button.closest(".safepost-image-warning-overlay");
    if (overlay) {
      overlay.style.background = "rgba(255, 0, 0, 0.8)";
      overlay.innerHTML =
        '<div style="color: white; text-align: center; padding: 20px;">⚠️ Please manually remove this image before posting</div>';
    }
  }

  static proceedAnyway(button) {
    const overlay = button.closest(".safepost-image-warning-overlay");
    if (overlay) {
      overlay.style.opacity = "0.3";
      overlay.innerHTML =
        '<div style="color: white; text-align: center; padding: 20px;">⚠️ Proceeding with risky content</div>';

      // Log the decision
      console.log("User chose to proceed with risky image content");

      // Could save to storage for analytics
      chrome.storage.local.get(["imageLogs"]).then((result) => {
        const logs = result.imageLogs || [];
        logs.push({
          timestamp: Date.now(),
          decision: "proceed_anyway",
          url: window.location.href,
        });
        chrome.storage.local.set({ imageLogs: logs });
      });
    }
  }
}

// Make available globally
window.SafePostImageAnalysis = ImageAnalysisService;
