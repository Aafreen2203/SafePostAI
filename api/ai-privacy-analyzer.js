// Enhanced version with better patterns
class AIPrivacyAnalyzer {
  constructor(config = {}) {
    this.openaiApiKey = config.openaiApiKey;
    this.huggingfaceApiKey = config.huggingfaceApiKey;
    this.preferredProvider = config.preferredProvider || "openai";
  }

  async analyzePrivacySensitivity(text) {
    const lower = text.toLowerCase();
    let sensitiveItems = [];
    let highestRisk = "none";

    // 1. Document type detection by header/keywords (fuzzy)
    const docTypes = [
      {
        name: "Aadhaar Card",
        keywords: ["aadhaar", "aadhar", "unique identification authority"],
        risk: "critical",
      },
      {
        name: "PAN Card",
        keywords: [
          "permanent account number",
          "income tax department",
          "pan card",
        ],
        risk: "critical",
      },
      {
        name: "Passport",
        keywords: ["passport", "republic of india"],
        risk: "critical",
      },
      {
        name: "Driving Licence",
        keywords: ["driving licence", "dl no", "licence no"],
        risk: "high",
      },
    ];
    for (const doc of docTypes) {
      if (doc.keywords.some((k) => lower.includes(k))) {
        sensitiveItems.push({
          type: "document",
          value: doc.name,
          confidence: 0.9,
          risk: doc.risk,
        });
        if (doc.risk === "critical") highestRisk = "critical";
        else if (doc.risk === "high" && highestRisk !== "critical")
          highestRisk = "high";
      }
    }

    // 2. Aadhaar header/label detection (fuzzy)
    if (
      lower.includes("unique identification authority") ||
      lower.includes("aadhaar") ||
      lower.includes("aadhar")
    ) {
      sensitiveItems.push({
        type: "aadhaarHeader",
        value: "Aadhaar header/label",
        confidence: 0.9,
        risk: "critical",
      });
      highestRisk = "critical";
    }

    // 3. Indian address detection (looser)
    const indianAddressRegex =
      /\b\d{1,4}[\s,]*(mg road|main road|colony|nagar|market|bazar|street|st|road|rd|lane|ln|gali|block|sector)\b/i;
    if (indianAddressRegex.test(text)) {
      sensitiveItems.push({
        type: "indianAddress",
        value: "Possible Indian address",
        confidence: 0.8,
        risk: "high",
      });
      if (highestRisk !== "critical") highestRisk = "high";
    }

    // 4. Standard patterns (email, phone, credit card, etc.)
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
      aadhaarNumber: {
        regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, // 12 digit Aadhaar
        risk: "critical",
      },
      panNumber: {
        regex: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g, // PAN format
        risk: "critical",
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
    Object.entries(patterns).forEach(([type, config]) => {
      const matches = [...text.matchAll(config.regex)];
      matches.forEach((match) => {
        sensitiveItems.push({
          type,
          value: match[0],
          confidence: 0.8,
          risk: config.risk,
        });
        if (config.risk === "critical") highestRisk = "critical";
        else if (config.risk === "high" && highestRisk !== "critical")
          highestRisk = "high";
        else if (config.risk === "medium" && highestRisk === "none")
          highestRisk = "medium";
      });
    });

    return {
      sensitiveItems,
      riskLevel: highestRisk,
      explanation:
        sensitiveItems.length > 0
          ? `Found ${sensitiveItems.length} sensitive item(s): ${sensitiveItems
              .map((i) => i.type)
              .join(", ")}`
          : "No sensitive content found",
    };
  }
}

// Make it globally available
if (typeof window !== "undefined") {
  window.AIPrivacyAnalyzer = AIPrivacyAnalyzer;
}
