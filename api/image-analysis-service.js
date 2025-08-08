// Enhanced Image Analysis Service for SafePost AI
class ImageAnalysisService {
  constructor(config = {}) {
    this.openaiApiKey = config.openaiApiKey;
    this.googleVisionApiKey = config.googleVisionApiKey;
    this.huggingfaceApiKey = config.huggingfaceApiKey;
    this.loadSettings();
    this.initializeTesseract();
  }

  // Load API keys from chrome storage
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        "openaiApiKey",
        "googleVisionApiKey",
        "huggingfaceApiKey",
      ]);

      this.openaiApiKey = result.openaiApiKey;
      this.googleVisionApiKey = result.googleVisionApiKey;
      this.huggingfaceApiKey = result.huggingfaceApiKey;
    } catch (error) {
      console.warn("Failed to load API keys from storage:", error);
    }
  }

  // Initialize Tesseract.js for OCR
  async initializeTesseract() {
    if (typeof Tesseract === "undefined") {
      console.log("📝 Loading Tesseract.js for OCR...");
      try {
        // Load Tesseract.js from CDN
        await this.loadScript(
          "https://unpkg.com/tesseract.js@v4.1.1/dist/tesseract.min.js"
        );
        console.log("✅ Tesseract.js loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load Tesseract.js:", error);
      }
    }
  }

  // Helper to load external scripts
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Main image analysis function
  async analyzeImage(imageFile) {
    console.log("🖼️ Starting comprehensive image analysis...");

    try {
      const results = {
        hasText: false,
        extractedText: "",
        textAnalysis: null,
        hasFaces: false,
        faceCount: 0,
        hasDocuments: false,
        documentTypes: [],
        hasIdCards: false,
        riskLevel: "none",
        warnings: [],
        confidence: 0,
      };

      // Convert file to base64 for processing
      const imageData = await this.fileToBase64(imageFile);

      // 1. OCR Text Extraction
      console.log("🔍 Extracting text from image...");
      const ocrResult = await this.performOCR(imageFile);
      results.hasText = ocrResult.text.length > 10;
      results.extractedText = ocrResult.text;
      results.confidence = Math.max(results.confidence, ocrResult.confidence);

      // 2. Analyze extracted text for PII
      if (results.hasText) {
        console.log("📝 Analyzing extracted text for sensitive content...");
        const privacyAnalyzer = new AIPrivacyAnalyzer();
        results.textAnalysis = await privacyAnalyzer.analyzePrivacySensitivity(
          results.extractedText
        );

        if (results.textAnalysis.riskLevel !== "none") {
          results.warnings.push({
            type: "Text Content",
            message: `Sensitive text detected in image: ${results.textAnalysis.explanation}`,
            risk: results.textAnalysis.riskLevel,
          });
        }
      }

      // 3. Object Detection (Documents, ID Cards)
      console.log("🏷️ Detecting objects and documents...");
      const objectResult = await this.detectObjects(imageData);
      results.hasDocuments = objectResult.hasDocuments;
      results.documentTypes = objectResult.documentTypes;
      results.hasIdCards = objectResult.hasIdCards;

      if (results.hasDocuments) {
        results.warnings.push({
          type: "Document Detection",
          message: `Detected documents: ${results.documentTypes.join(", ")}`,
          risk: "high",
        });
      }

      // 4. Face Detection
      console.log("👤 Detecting faces...");
      const faceResult = await this.detectFaces(imageData);
      results.hasFaces = faceResult.hasFaces;
      results.faceCount = faceResult.count;

      if (results.hasFaces) {
        results.warnings.push({
          type: "Face Detection",
          message: `Detected ${results.faceCount} face(s) in image`,
          risk: "medium",
        });
      }

      // 5. Calculate overall risk level
      results.riskLevel = this.calculateOverallRisk(results);

      console.log("✅ Image analysis complete:", results);
      return results;
    } catch (error) {
      console.error("❌ Image analysis failed:", error);
      return {
        hasText: false,
        extractedText: "",
        textAnalysis: null,
        hasFaces: false,
        faceCount: 0,
        hasDocuments: false,
        documentTypes: [],
        hasIdCards: false,
        riskLevel: "unknown",
        warnings: [
          {
            type: "Analysis Error",
            message: "Could not analyze image properly",
            risk: "medium",
          },
        ],
        confidence: 0,
        error: error.message,
      };
    }
  }

  // OCR using Tesseract.js (local processing)
  async performOCR(imageFile) {
    try {
      if (typeof Tesseract === "undefined") {
        await this.initializeTesseract();
      }

      console.log("📝 Running OCR with Tesseract.js...");
      const worker = await Tesseract.createWorker();

      await worker.loadLanguage("eng");
      await worker.initialize("eng");

      const {
        data: { text, confidence },
      } = await worker.recognize(imageFile);
      await worker.terminate();

      console.log("✅ OCR completed. Confidence:", confidence);
      console.log("📄 Extracted text:", text.substring(0, 200) + "...");

      return {
        text: text.trim(),
        confidence: confidence / 100,
      };
    } catch (error) {
      console.error("❌ OCR failed:", error);

      // Fallback to Google Vision API if available
      if (this.googleVisionApiKey) {
        return await this.performGoogleVisionOCR(imageFile);
      }

      return { text: "", confidence: 0 };
    }
  }

  // Google Vision API OCR (if API key available)
  async performGoogleVisionOCR(imageFile) {
    try {
      const base64 = await this.fileToBase64(imageFile);
      const imageData = base64.split(",")[1]; // Remove data:image/jpeg;base64, prefix

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                image: { content: imageData },
                features: [{ type: "TEXT_DETECTION", maxResults: 10 }],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const textAnnotations = data.responses[0]?.textAnnotations || [];

      if (textAnnotations.length > 0) {
        return {
          text: textAnnotations[0].description,
          confidence: 0.9,
        };
      }

      return { text: "", confidence: 0 };
    } catch (error) {
      console.error("❌ Google Vision OCR failed:", error);
      return { text: "", confidence: 0 };
    }
  }

  // Object detection using HuggingFace YOLO model
  async detectObjects(imageData) {
    try {
      if (!this.huggingfaceApiKey) {
        return this.detectObjectsLocally(imageData);
      }

      console.log("🏷️ Running object detection...");

      const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/detr-resnet-50",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.huggingfaceApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: imageData,
          }),
        }
      );

      const results = await response.json();

      const documentKeywords = [
        "book",
        "paper",
        "document",
        "card",
        "license",
        "passport",
        "id",
      ];
      const idCardKeywords = [
        "card",
        "license",
        "id",
        "passport",
        "certificate",
      ];

      const detectedObjects = results.map((r) => r.label.toLowerCase());
      const hasDocuments = detectedObjects.some((obj) =>
        documentKeywords.some((keyword) => obj.includes(keyword))
      );

      const hasIdCards = detectedObjects.some((obj) =>
        idCardKeywords.some((keyword) => obj.includes(keyword))
      );

      const documentTypes = detectedObjects.filter((obj) =>
        documentKeywords.some((keyword) => obj.includes(keyword))
      );

      return {
        hasDocuments,
        hasIdCards,
        documentTypes,
        allObjects: detectedObjects,
      };
    } catch (error) {
      console.error("❌ Object detection failed:", error);
      return this.detectObjectsLocally(imageData);
    }
  }

  // Local object detection fallback (basic pattern matching)
  detectObjectsLocally(imageData) {
    // This is a very basic fallback - in reality, you'd need a proper ML model
    // For now, we'll return conservative estimates
    return {
      hasDocuments: false,
      hasIdCards: false,
      documentTypes: [],
      allObjects: [],
    };
  }

  // Face detection using OpenAI Vision API
  async detectFaces(imageData) {
    try {
      if (!this.openaiApiKey) {
        return await this.detectFacesHuggingFace(imageData);
      }

      console.log("👤 Detecting faces with OpenAI...");

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Count the number of human faces visible in this image. Respond with just a number.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageData },
                  },
                ],
              },
            ],
            max_tokens: 10,
          }),
        }
      );

      const data = await response.json();
      const faceCountText = data.choices[0]?.message?.content || "0";
      const faceCount = parseInt(faceCountText.match(/\d+/)?.[0] || "0");

      return {
        hasFaces: faceCount > 0,
        count: faceCount,
      };
    } catch (error) {
      console.error("❌ Face detection failed:", error);
      return await this.detectFacesHuggingFace(imageData);
    }
  }

  // Face detection using HuggingFace
  async detectFacesHuggingFace(imageData) {
    try {
      if (!this.huggingfaceApiKey) {
        return { hasFaces: false, count: 0 };
      }

      const response = await fetch(
        "https://api-inference.huggingface.co/models/opencv/opencv-face-detection",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.huggingfaceApiKey}`,
          },
          body: imageData,
        }
      );

      const results = await response.json();
      const faceCount = Array.isArray(results) ? results.length : 0;

      return {
        hasFaces: faceCount > 0,
        count: faceCount,
      };
    } catch (error) {
      console.error("❌ HuggingFace face detection failed:", error);
      return { hasFaces: false, count: 0 };
    }
  }

  // Calculate overall risk level
  calculateOverallRisk(results) {
    const risks = [];

    if (results.textAnalysis && results.textAnalysis.riskLevel !== "none") {
      risks.push(results.textAnalysis.riskLevel);
    }

    if (results.hasIdCards) risks.push("critical");
    if (results.hasDocuments) risks.push("high");
    if (results.hasFaces) risks.push("medium");

    const riskLevels = ["none", "low", "medium", "high", "critical"];
    const maxRiskIndex = Math.max(
      ...risks.map((r) => riskLevels.indexOf(r)),
      0
    );

    return riskLevels[maxRiskIndex];
  }

  // Helper: Convert file to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
}

// Initialize image analysis service
let imageAnalysisService;

function initializeImageAnalysis() {
  if (typeof ImageAnalysisService !== "undefined") {
    imageAnalysisService = new ImageAnalysisService();
    console.log("🖼️ Image analysis service initialized");
  }
}

// Monitor file inputs for image uploads
function monitorFileUploads() {
  console.log("📁 Setting up file upload monitoring...");

  // Monitor all file inputs
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach((input) => {
    if (!input.hasAttribute("data-safepost-monitored")) {
      input.setAttribute("data-safepost-monitored", "true");
      input.addEventListener("change", handleFileUpload);
    }
  });

  // Monitor drag & drop areas
  const dropZones = document.querySelectorAll(
    '[data-testid*="attachments"], .file-drop, .drag-drop, .upload-area'
  );
  dropZones.forEach((zone) => {
    if (!zone.hasAttribute("data-safepost-monitored")) {
      zone.setAttribute("data-safepost-monitored", "true");
      zone.addEventListener("drop", handleFileDrop);
      zone.addEventListener("dragover", (e) => e.preventDefault());
    }
  });

  // Use MutationObserver to catch dynamically added file inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check for new file inputs
          const newFileInputs = node.querySelectorAll
            ? node.querySelectorAll('input[type="file"]')
            : [];

          newFileInputs.forEach((input) => {
            if (!input.hasAttribute("data-safepost-monitored")) {
              input.setAttribute("data-safepost-monitored", "true");
              input.addEventListener("change", handleFileUpload);
            }
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

// Handle file upload from input
async function handleFileUpload(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    for (let file of files) {
      if (file.type.startsWith("image/")) {
        await analyzeUploadedImage(file, event.target);
      }
    }
  }
}

// Handle file drop
async function handleFileDrop(event) {
  event.preventDefault();
  const files = event.dataTransfer.files;

  if (files && files.length > 0) {
    for (let file of files) {
      if (file.type.startsWith("image/")) {
        await analyzeUploadedImage(file, event.target);
      }
    }
  }
}

// Analyze uploaded image
async function analyzeUploadedImage(file, targetElement) {
  console.log("🖼️ Analyzing uploaded image:", file.name);

  if (!imageAnalysisService) {
    initializeImageAnalysis();
    // Give it a moment to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  try {
    // Show loading indicator
    showImageAnalysisLoading(targetElement);

    // Perform image analysis
    const analysis = await imageAnalysisService.analyzeImage(file);

    // Hide loading indicator
    hideImageAnalysisLoading();

    // Display warnings if needed
    if (analysis.riskLevel !== "none" && analysis.warnings.length > 0) {
      displayImageWarnings(analysis, file.name);
    } else {
      console.log("✅ Image appears safe to upload");
    }
  } catch (error) {
    console.error("❌ Image analysis failed:", error);
    hideImageAnalysisLoading();

    // Show generic warning for analysis failure
    displayImageWarnings(
      {
        riskLevel: "medium",
        warnings: [
          {
            type: "Analysis Error",
            message:
              "Could not analyze image properly. Please review manually.",
            risk: "medium",
          },
        ],
      },
      file.name
    );
  }
}

// Show loading indicator for image analysis
function showImageAnalysisLoading(targetElement) {
  const loading = document.createElement("div");
  loading.className = "safepost-image-loading";
  loading.innerHTML = `
    <div class="safepost-loading-content">
      <div class="safepost-spinner"></div>
      <span>🖼️ Analyzing image for sensitive content...</span>
    </div>
  `;

  // Insert near the target element
  if (targetElement && targetElement.parentNode) {
    targetElement.parentNode.insertBefore(loading, targetElement.nextSibling);
  } else {
    document.body.appendChild(loading);
  }
}

// Hide loading indicator
function hideImageAnalysisLoading() {
  const loading = document.querySelector(".safepost-image-loading");
  if (loading) {
    loading.remove();
  }
}

// Display image analysis warnings
function displayImageWarnings(analysis, fileName) {
  // Remove any existing warnings
  removeExistingWarnings();

  const warningContainer = document.createElement("div");
  warningContainer.className =
    "safepost-warning-container safepost-image-warning";

  const riskColor =
    {
      low: "#ffc107",
      medium: "#fd7e14",
      high: "#dc3545",
      critical: "#6f42c1",
    }[analysis.riskLevel] || "#6c757d";

  warningContainer.innerHTML = `
    <div class="safepost-warning-header">
      <span class="safepost-warning-icon">🖼️</span>
      <span class="safepost-warning-title">Image Content Warning</span>
      <span class="safepost-risk-badge" style="background-color: ${riskColor}">
        ${analysis.riskLevel.toUpperCase()} RISK
      </span>
      <button class="safepost-dismiss-btn" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="safepost-warning-content">
      <p class="safepost-warning-subtitle">
        <strong>File:</strong> ${fileName}
      </p>
      <div class="safepost-warning-items">
        ${analysis.warnings
          .map(
            (warning) => `
          <div class="safepost-warning-item safepost-image-warning-item">
            <div class="safepost-item-category">${warning.type}</div>
            <div class="safepost-item-reason">${warning.message}</div>
            <div class="safepost-item-risk">Risk Level: ${warning.risk}</div>
          </div>
        `
          )
          .join("")}
      </div>

      ${
        analysis.extractedText
          ? `
        <div class="safepost-extracted-text">
          <strong>Text found in image:</strong>
          <div class="safepost-text-preview">${analysis.extractedText.substring(
            0,
            200
          )}${analysis.extractedText.length > 200 ? "..." : ""}</div>
        </div>
      `
          : ""
      }

      <div class="safepost-warning-actions">
        <button class="safepost-btn safepost-btn-danger" onclick="this.closest('.safepost-warning-container').remove(); removeLastUploadedFile();">
          🗑️ Remove Image
        </button>
        <button class="safepost-btn safepost-btn-warning" onclick="this.closest('.safepost-warning-container').remove();">
          ⚠️ Upload Anyway
        </button>
      </div>
    </div>
  `;

  // Insert at the top of the page for visibility
  document.body.insertBefore(warningContainer, document.body.firstChild);

  // Scroll to warning
  warningContainer.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Remove the last uploaded file (helper function)
function removeLastUploadedFile() {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach((input) => {
    if (input.files && input.files.length > 0) {
      input.value = ""; // Clear the file input
    }
  });
  console.log("🗑️ Removed uploaded file");
}

// Initialize image monitoring when content script loads
function initialize() {
  // Initialize image analysis
  initializeImageAnalysis();

  // Start monitoring file uploads
  monitorFileUploads();

  console.log("🚀 SafePost AI initialized with image analysis");
}

// Make sure to call initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
