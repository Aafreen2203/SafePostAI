// Enhanced version with better patterns
class AIPrivacyAnalyzer {
  constructor(config = {}) {
    this.openaiApiKey = config.openaiApiKey;
    this.huggingfaceApiKey = config.huggingfaceApiKey;
    this.preferredProvider = config.preferredProvider || "openai";
  }

  async analyzePrivacySensitivity(text) {
    // Enhanced patterns for better detection
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
      ssn: {
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        risk: "critical",
      },
      fullName: {
        regex: /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g,
        risk: "medium",
      },
    };

    const sensitiveItems = [];
    let highestRisk = "none";

    Object.entries(patterns).forEach(([type, config]) => {
      const matches = [...text.matchAll(config.regex)];
      matches.forEach((match) => {
        sensitiveItems.push({
          type: type,
          value: match[0],
          confidence: 0.8,
          risk: config.risk,
        });

        // Update highest risk level
        if (
          config.risk === "critical" ||
          (config.risk === "high" && highestRisk !== "critical") ||
          (config.risk === "medium" && highestRisk === "none")
        ) {
          highestRisk = config.risk;
        }
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
