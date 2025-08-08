// SafePost AI - Enhanced Content Script v2.0
console.log("🛡️ SafePost AI v2.0: Starting Enhanced Upload Detection...");

// API Keys (hardcoded)
const OCR_SPACE_API_KEY = "K83865885088957";
const HUGGING_FACE_API_KEY = "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";
const OPENAI_API_KEY =
  "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";

// Enhanced warning modal styles
const WARNING_STYLES = `
  .safepost-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(30, 30, 30, 0.45);
    backdrop-filter: blur(8px) saturate(1.2);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  
  .safepost-modal {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: safepostSlideIn 0.3s ease-out;
  }
  
  @keyframes safepostSlideIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  .safepost-modal-header {
    padding: 24px 24px 16px;
    border-bottom: 2px solid #f1f1f1;
  }
  
  .safepost-modal-title {
  .safepost-modal-content {
    padding: 20px 24px;
  }
  
  .safepost-risk-critical { color: #e74c3c; }
  .safepost-risk-high { color: #f39c12; }
  .safepost-risk-medium { color: #f1c40f; }
  .safepost-risk-low { color: #95a5a6; }
       address: {
         regex: /\b\d{1,5}[\s,]+[A-Za-z0-9 .'-]+(Avenue|Ave|Street|St|Road|Rd|Drive|Dr|Lane|Ln|Way|Place|Plaza|Boulevard|Blvd|Court|Ct|Circle|Cir|Parkway|Pkwy|Terrace|Ter|Trail|Trl|Highway|Hwy|Block|Sector|Colony|Nagar|Market|Bazar|Gali)[\w\s,.'-]*\b/i,
         type: "address",
         riskLevel: "medium",
         explanation: "Detected possible address",
       },
  
  .safepost-detected-item {
    background: #f8f9fa;
    border-left: 4px solid #e74c3c;
    padding: 12px;
    margin: 8px 0;
    border-radius: 4px;
  }
  
  .safepost-detected-item.high { border-left-color: #f39c12; }
  .safepost-detected-item.medium { border-left-color: #f1c40f; }
  .safepost-detected-item.low { border-left-color: #95a5a6; }
  
  .safepost-modal-actions {
    padding: 16px 24px 24px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .safepost-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .safepost-btn-danger {
    background: #e74c3c;
    color: white;
  }
  
  .safepost-btn-danger:hover {
    background: #c0392b;
  }
  
  .safepost-btn-secondary {
    background: #95a5a6;
    color: white;
  }
  
  .safepost-btn-secondary:hover {
    background: #7f8c8d;
  }
  
  .safepost-preview-image {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    margin: 10px 0;
  }
  
  .safepost-analysis-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px;
    color: #666;
  }
  
  .safepost-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles
if (!document.getElementById("safepost-styles")) {
  const style = document.createElement("style");
  style.id = "safepost-styles";
  style.textContent = WARNING_STYLES;
  document.head.appendChild(style);
}

class SafePostAI {
  constructor() {
    this.isEnabled = true;
    this.pendingUploads = new Map();
    this.init();
  }

  async init() {
    this.interceptFileInputs();
    this.interceptFormSubmissions();
    this.interceptDragAndDrop();
    this.monitorDynamicUploads();
    console.log("✅ SafePost AI: Ready to protect your uploads!");
  }

  // Intercept file input changes
  interceptFileInputs() {
    document.addEventListener("change", async (event) => {
      const input = event.target;
      if (input.type === "file" && input.files.length > 0) {
        await this.handleFileUpload(input.files, input);
      }
    });
  }

  // Intercept form submissions
  interceptFormSubmissions() {
    document.addEventListener("submit", async (event) => {
      const form = event.target;
      const fileInputs = form.querySelectorAll('input[type="file"]');

      for (const input of fileInputs) {
        if (input.files.length > 0) {
          event.preventDefault();
          const shouldContinue = await this.handleFileUpload(
            input.files,
            input
          );
          if (shouldContinue) {
            form.submit();
          }
          return;
        }
      }
    });
  }

  // Intercept drag and drop
  interceptDragAndDrop() {
    document.addEventListener("drop", async (event) => {
      if (event.dataTransfer.files.length > 0) {
        event.preventDefault();
        await this.handleFileUpload(event.dataTransfer.files, event.target);
      }
    });
  }

  // Monitor for dynamic file uploads (social media, etc.)
  monitorDynamicUploads() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const fileInputs = node.querySelectorAll
              ? node.querySelectorAll('input[type="file"]')
              : [];
            fileInputs.forEach((input) => {
              input.addEventListener("change", async (event) => {
                if (event.target.files.length > 0) {
                  await this.handleFileUpload(event.target.files, event.target);
                }
              });
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Main file upload handler
  async handleFileUpload(files, sourceElement) {
    console.log("[SafePostAI] handleFileUpload called", files);
    const imageFiles = Array.from(files).filter(
      (file) =>
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
    );
    console.log("[SafePostAI] Filtered image files:", imageFiles);

    if (imageFiles.length === 0) {
      console.log("[SafePostAI] No image files detected.");
      return true;
    }

    for (const file of imageFiles) {
      try {
        console.log(`[SafePostAI] Analyzing file: ${file.name}`);
        const analysis = await this.analyzeImageFile(file);
        console.log("[SafePostAI] Analysis result:", analysis);
        if (analysis.riskLevel !== "none" && analysis.warnings.length > 0) {
          console.log("[SafePostAI] Risk detected, showing overlay warning.");
          const shouldContinue = await this.showDetailedWarning(file, analysis);
          console.log(
            "[SafePostAI] User decision from overlay:",
            shouldContinue
          );
          if (!shouldContinue) {
            this.clearFileInput(sourceElement);
            return false;
          }
        } else {
          console.log(
            "[SafePostAI] No significant risk detected, no overlay shown."
          );
        }
      } catch (error) {
        console.error("❌ Image analysis failed:", error);
        // Do not show any error popup or notification; fail silently
      }
    }

    return true;
  }

  // Analyze image file
  async analyzeImageFile(file) {
    try {
      console.log(`[SafePostAI] Starting OCR for file: ${file.name}`);
      const text = await this.extractTextFromImage(file);
      console.log(
        "[SafePostAI] Extracted text:",
        text.substring(0, 200) + "..."
      );

      console.log("[SafePostAI] Running OpenAI analysis...");
      const openaiAnalysis = await this.analyzeWithOpenAI(text);
      console.log("[SafePostAI] OpenAI analysis result:", openaiAnalysis);

      console.log("[SafePostAI] Running HuggingFace analysis...");
      const huggingFaceAnalysis = await this.analyzeWithHuggingFace(text);
      console.log(
        "[SafePostAI] HuggingFace analysis result:",
        huggingFaceAnalysis
      );

      console.log("[SafePostAI] Running regex analysis...");
      const regexAnalysis = this.analyzeWithRegex(text);
      console.log("[SafePostAI] Regex analysis result:", regexAnalysis);

      // Combine results
      const combined = this.combineAnalyses(
        openaiAnalysis,
        huggingFaceAnalysis,
        regexAnalysis,
        text
      );
      console.log("[SafePostAI] Combined analysis:", combined);
      return combined;
    } catch (error) {
      console.error("[SafePostAI] Analysis error:", error);
      throw error;
    }
  }

  // Extract text using OCR.space
  async extractTextFromImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("apikey", OCR_SPACE_API_KEY);
    formData.append("scale", "true");
    formData.append("isTable", "true");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || "OCR processing failed");
    }

    return result.ParsedResults?.[0]?.ParsedText || "";
  }

  // Analyze with OpenAI
  async analyzeWithOpenAI(text) {
    const prompt = `You are an expert privacy analyst. Analyze this text extracted from an image for sensitive personal information.

Look for:
- Full addresses (street, city, state, PIN)
- Government IDs (Aadhaar, PAN, Passport, Driving License)
- Phone numbers and email addresses
- Financial information (bank details, credit card numbers)
- Medical information
- Official document headers/letterheads

For each item found, specify:
1. Type of information
2. Exact text/value found
3. Risk level (low/medium/high/critical)
4. Why it's risky if leaked

Text to analyze:
"""${text}"""

Respond in JSON:
{
  "overallRisk": "none|low|medium|high|critical",
  "findings": [
    {
      "type": "address|aadhaar|pan|phone|email|document|financial|medical|other",
      "value": "exact text found",
      "riskLevel": "low|medium|high|critical",
      "explanation": "why this is risky",
      "location": "approximate position in text"
    }
  ],
  "summary": "brief explanation of overall privacy risk"
}`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a privacy and security expert.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 1000,
            temperature: 0.1,
          }),
        }
      );

      const data = await response.json();
      const content = data.choices[0].message.content;

      try {
        return JSON.parse(content);
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      return null;
    }
  }

  // Analyze with Hugging Face
  async analyzeWithHuggingFace(text) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/dbmdz/bert-large-cased-finetuned-conll03-english",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: text.substring(0, 1000), // Limit input size
            parameters: {
              aggregation_strategy: "simple",
            },
          }),
        }
      );

      const results = await response.json();

      if (Array.isArray(results)) {
        const findings = results
          .filter((item) => item.score > 0.8) // High confidence only
          .map((item) => ({
            type: item.entity_group?.toLowerCase() || "other",
            value: item.word,
            riskLevel: this.mapHuggingFaceRisk(item.entity_group, item.score),
            explanation: `Detected ${item.entity_group} with ${Math.round(item.score * 100)}% confidence`,
            location: `Position ${item.start}-${item.end}`,
          }));

        return {
          overallRisk: findings.length > 0 ? "medium" : "none",
          findings: findings,
          summary: `Found ${findings.length} potential entities`,
        };
      }
    } catch (error) {
      console.error("Hugging Face API error:", error);
    }

    return null;
  }

  mapHuggingFaceRisk(entityGroup, score) {
    const riskMap = {
      PER: score > 0.9 ? "high" : "medium", // Person names
      LOC: score > 0.9 ? "high" : "medium", // Locations
      ORG: score > 0.9 ? "medium" : "low", // Organizations
      MISC: "low",
    };
    return riskMap[entityGroup] || "low";
  }

  // Enhanced regex analysis for Indian documents
  analyzeWithRegex(text) {
    const findings = [];
    let overallRisk = "none";

    // Enhanced patterns for Indian context
    const patterns = {
      aadhaar: {
        regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
        type: "aadhaar",
        riskLevel: "critical",
        explanation:
          "Aadhaar number can be used for identity theft and unauthorized access to services",
      },
      pan: {
        regex: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
        type: "pan",
        riskLevel: "critical",
        explanation:
          "PAN number can be used for financial fraud and tax-related identity theft",
      },
      phone: {
        regex: /(\+91[-\s]?)?[6-9]\d{9}/g,
        type: "phone",
        riskLevel: "high",
        explanation:
          "Phone numbers can be used for harassment, spam, and social engineering attacks",
      },
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        type: "email",
        riskLevel: "high",
        explanation:
          "Email addresses can be used for phishing, spam, and account takeover attempts",
      },
      address: {
        regex:
          /\b\d{1,5}[\s,]+[A-Za-z0-9 .'-]+(Avenue|Ave|Street|St|Road|Rd|Drive|Dr|Lane|Ln|Way|Place|Plaza|Boulevard|Blvd|Court|Ct|Circle|Cir|Parkway|Pkwy|Terrace|Ter|Trail|Trl|Highway|Hwy|Block|Sector|Colony|Nagar|Market|Bazar|Gali)[\w\s,.'-]*\b/gi,
        type: "address",
        riskLevel: "medium",
        explanation: "Detected possible address",
      },
      pincode: {
        regex: /\b\d{6}\b/g,
        type: "pincode",
        riskLevel: "medium",
        explanation:
          "PIN codes reveal location and can be used for targeted scams",
      },
    };

    // Document type detection
    const documentPatterns = [
      {
        keywords: ["aadhaar", "unique identification"],
        type: "aadhaar_document",
        risk: "critical",
      },
      {
        keywords: ["permanent account number", "income tax", "pan card"],
        type: "pan_document",
        risk: "critical",
      },
      {
        keywords: ["passport", "republic of india"],
        type: "passport",
        risk: "critical",
      },
      {
        keywords: ["driving licence", "transport department"],
        type: "driving_licence",
        risk: "high",
      },
      {
        keywords: ["bank statement", "account number"],
        type: "bank_statement",
        risk: "critical",
      },
    ];

    const lowerText = text.toLowerCase();
    for (const doc of documentPatterns) {
      if (doc.keywords.some((keyword) => lowerText.includes(keyword))) {
        findings.push({
          type: "document",
          value: doc.type.replace("_", " ").toUpperCase(),
          riskLevel: doc.risk,
          explanation: `This appears to be a ${doc.type.replace("_", " ")} which contains highly sensitive personal information`,
          location: "Document header/content",
        });
        if (doc.risk === "critical") overallRisk = "critical";
      }
    }

    // Pattern matching
    for (const [patternName, config] of Object.entries(patterns)) {
      const matches = [...text.matchAll(config.regex)];
      for (const match of matches) {
        // Skip false positives for dates/times that look like Aadhaar numbers
        if (patternName === "aadhaar" && this.isLikelyDateTime(match[0]))
          continue;

        findings.push({
          type: config.type,
          value: match[0],
          riskLevel: config.riskLevel,
          explanation: config.explanation,
          location: `Position ${match.index}`,
        });

        if (config.riskLevel === "critical") overallRisk = "critical";
        else if (config.riskLevel === "high" && overallRisk !== "critical")
          overallRisk = "high";
        else if (config.riskLevel === "medium" && overallRisk === "none")
          overallRisk = "medium";
      }
    }

    return {
      overallRisk,
      findings,
      summary: `Regex analysis found ${findings.length} potential privacy risks`,
    };
  }

  // Helper to avoid false positive Aadhaar detection for dates/times
  isLikelyDateTime(text) {
    const dateTimePatterns = [
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}:\d{2}:\d{2}$/,
    ];
    return dateTimePatterns.some((pattern) =>
      pattern.test(text.replace(/\s/g, ""))
    );
  }

  // Combine analyses from all sources
  combineAnalyses(openai, huggingFace, regex, originalText) {
    const allFindings = [];
    let highestRisk = "none";

    // Combine findings from all sources
    [openai, huggingFace, regex].forEach((analysis) => {
      if (analysis && analysis.findings) {
        allFindings.push(...analysis.findings);
        if (
          this.getRiskLevel(analysis.overallRisk) >
          this.getRiskLevel(highestRisk)
        ) {
          highestRisk = analysis.overallRisk;
        }
      }
    });

    // Remove duplicates and merge similar findings
    const uniqueFindings = this.deduplicateFindings(allFindings);

    return {
      riskLevel: highestRisk,
      warnings: uniqueFindings,
      extractedText: originalText,
      summary: this.generateRiskSummary(highestRisk, uniqueFindings.length),
    };
  }

  // Helper to get numeric risk level for comparison
  getRiskLevel(risk) {
    const levels = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
    return levels[risk] || 0;
  }

  // Remove duplicate findings
  deduplicateFindings(findings) {
    const seen = new Set();
    return findings.filter((finding) => {
      const key = `${finding.type}-${finding.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Generate risk summary
  generateRiskSummary(riskLevel, findingsCount) {
    const summaries = {
      critical: `🚨 CRITICAL: Found ${findingsCount} highly sensitive items that could lead to identity theft or fraud`,
      high: `⚠️ HIGH RISK: Found ${findingsCount} personal information items that could compromise your privacy`,
      medium: `⚠️ MEDIUM RISK: Found ${findingsCount} potentially sensitive items`,
      low: `ℹ️ LOW RISK: Found ${findingsCount} minor privacy concerns`,
      none: "✅ No significant privacy risks detected",
    };
    return summaries[riskLevel] || summaries["none"];
  }

  // Show detailed warning modal as overlay (never navigate away)
  async showDetailedWarning(file, analysis) {
    return new Promise((resolve) => {
      console.log(
        "[SafePostAI] Preparing to show overlay modal for",
        file.name,
        analysis
      );
      // Remove any existing modal overlays
      document
        .querySelectorAll(".safepost-modal-overlay")
        .forEach((el) => el.remove());
      const modal = this.createWarningModal(file, analysis, resolve);
      document.body.appendChild(modal);
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
      // Restore scrolling when modal is closed
      const cleanup = () => {
        document.body.style.overflow = "";
      };
      modal.addEventListener("remove", cleanup);
      // Also restore on resolve
      const origResolve = resolve;
      resolve = (val) => {
        cleanup();
        origResolve(val);
      };
      console.log("[SafePostAI] Overlay modal shown.");
    });
  }

  // Create warning modal
  createWarningModal(file, analysis, resolve) {
    const overlay = document.createElement("div");
    overlay.className = "safepost-modal-overlay";

    const riskIcons = {
      critical: "🚨",
      high: "⚠️",
      medium: "⚠️",
      low: "ℹ️",
      none: "✅",
    };

    overlay.innerHTML = `
      <div class="safepost-modal">
        <div class="safepost-modal-header">
          <h3 class="safepost-modal-title safepost-risk-${analysis.riskLevel}">
            ${riskIcons[analysis.riskLevel]} Privacy Risk Detected
          </h3>
        </div>
        <div class="safepost-modal-content">
          <p><strong>File:</strong> ${file.name}</p>
          <p><strong>Risk Level:</strong> <span class="safepost-risk-${analysis.riskLevel}">${analysis.riskLevel.toUpperCase()}</span></p>
          <p>${analysis.summary}</p>
          
          ${
            analysis.warnings.length > 0
              ? `
            <h4>Detected Sensitive Information:</h4>
            ${analysis.warnings
              .map(
                (warning) => `
              <div class="safepost-detected-item ${warning.riskLevel}">
                <strong>${warning.type.toUpperCase()}:</strong> ${warning.value}<br>
                <small>${warning.explanation || "This information could be used maliciously"}</small>
              </div>
            `
              )
              .join("")}
          `
              : ""
          }
          
          <h4>What could happen if this is shared?</h4>
          <ul>
            ${this.getRiskExplanations(analysis.riskLevel)
              .map((exp) => `<li>${exp}</li>`)
              .join("")}
          </ul>
        </div>
        <div class="safepost-modal-actions">
          <button class="safepost-btn safepost-btn-danger" data-action="cancel">
            🛑 Don't Upload (Recommended)
          </button>
          <button class="safepost-btn safepost-btn-secondary" data-action="proceed">
            ⚠️ Upload Anyway (Risky)
          </button>
        </div>
      </div>
    `;

    // Handle button clicks
    overlay.addEventListener("click", (e) => {
      if (e.target.dataset.action === "cancel") {
        overlay.remove();
        document.body.style.overflow = "";
        resolve(false);
      } else if (e.target.dataset.action === "proceed") {
        overlay.remove();
        document.body.style.overflow = "";
        resolve(true);
      } else if (e.target === overlay) {
        overlay.remove();
        document.body.style.overflow = "";
        resolve(false);
      }
    });

    return overlay;
  }

  // Get risk explanations based on level
  getRiskExplanations(riskLevel) {
    const explanations = {
      critical: [
        "Identity theft using government ID numbers",
        "Financial fraud using personal details",
        "Unauthorized access to government services",
        "Complete identity impersonation",
      ],
      high: [
        "Privacy invasion and stalking",
        "Targeted scams and social engineering",
        "Harassment via phone/email",
        "Location-based security risks",
      ],
      medium: [
        "Spam and unwanted marketing",
        "Social engineering attempts",
        "Minor privacy violations",
      ],
      low: ["Minimal privacy concerns", "General information exposure"],
    };
    return explanations[riskLevel] || explanations["low"];
  }

  // Clear file input
  clearFileInput(element) {
    if (element && element.type === "file") {
      element.value = "";
    }
  }

  // Show error message
  showErrorMessage(message) {
    // Disabled: No error popup should be shown
  }
}

// Initialize SafePost AI
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new SafePostAI());
} else {
  new SafePostAI();
}

console.log("🛡️ SafePost AI v2.0: Enhanced upload protection loaded!");
