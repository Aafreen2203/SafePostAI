// AI-Powered Privacy Analysis Service for SafePost AI
class AIPrivacyAnalyzer {
  constructor(config = {}) {
    this.openaiApiKey = config.openaiApiKey;
    this.huggingfaceApiKey = config.huggingfaceApiKey;
    this.preferredProvider = config.preferredProvider || "openai"; // 'openai' or 'huggingface'
    this.loadSettings();
  }

  // Load API keys from chrome storage
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        "openaiApiKey",
        "huggingfaceApiKey",
      ]);
      if (result.openaiApiKey) {
        this.openaiApiKey = result.openaiApiKey;
      }
      if (result.huggingfaceApiKey) {
        this.huggingfaceApiKey = result.huggingfaceApiKey;
      }
    } catch (error) {
      console.warn("Failed to load API keys from storage:", error);
    }
  }

  // Main privacy analysis function using AI
  async analyzePrivacySensitivity(text) {
    if (!text || text.trim().length === 0) {
      return {
        sensitiveItems: [],
        riskLevel: "none",
        confidence: 0,
        provider: null,
      };
    }

    // Ensure settings are loaded
    await this.loadSettings();

    try {
      let result;

      if (this.preferredProvider === "openai" && this.openaiApiKey) {
        result = await this.analyzeWithOpenAI(text);
      } else if (this.huggingfaceApiKey) {
        result = await this.analyzeWithHuggingFace(text);
      } else {
        // Fallback to regex-based analysis
        result = this.analyzeWithRegex(text);
      }

      return result;
    } catch (error) {
      console.error("Error in AI privacy analysis:", error);
      // Fallback to regex-based analysis
      return this.analyzeWithRegex(text);
    }
  }

  // OpenAI GPT-based analysis
  async analyzeWithOpenAI(text) {
    const prompt = `You are a privacy assistant. Your task is to find and return potentially sensitive or personally identifiable information (PII) in the following extracted text.

Sensitive content includes:
- Email addresses
- Phone numbers
- Names (first and last names)
- Passwords or authentication tokens
- Credit card or bank information
- Home addresses or location details
- Government IDs (SSN, Aadhaar, PAN, etc.)
- IP addresses
- Any information that could compromise a user's privacy

Text to analyze:
"""
${text}
"""

Return a JSON response with:
1. "sensitiveItems": Array of objects with "type", "value", and "confidence" (0-1)
2. "riskLevel": "none", "low", "medium", "high", or "critical"
3. "explanation": Brief explanation of privacy concerns

Be precise and only flag actual sensitive information.`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a privacy and PII detection expert. Always respond with valid JSON only.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 500,
            temperature: 0.1,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      try {
        const parsed = JSON.parse(content);
        return {
          sensitiveItems: parsed.sensitiveItems || [],
          riskLevel: parsed.riskLevel || "none",
          confidence: 0.9,
          provider: "openai",
          explanation: parsed.explanation,
        };
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        return this.analyzeWithRegex(text);
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw error;
    }
  }

  // HuggingFace-based analysis using instruction-following model
  async analyzeWithHuggingFace(text) {
    const prompt = `[INST] You are a privacy assistant. Find potentially sensitive or personally identifiable information (PII) in this text.

Look for: emails, phone numbers, names, addresses, IDs, credit cards, passwords, IP addresses.

Text: "${text}"

Respond with JSON only:
{
  "sensitiveItems": [{"type": "email", "value": "example@email.com", "confidence": 0.9}],
  "riskLevel": "medium",
  "explanation": "Found email address"
} [/INST]`;

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.huggingfaceApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 300,
              temperature: 0.1,
              do_sample: false,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`);
      }

      const data = await response.json();
      const generated = data[0]?.generated_text || "";

      // Extract JSON from response
      const jsonMatch = generated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            sensitiveItems: parsed.sensitiveItems || [],
            riskLevel: parsed.riskLevel || "none",
            confidence: 0.85,
            provider: "huggingface",
            explanation: parsed.explanation,
          };
        } catch (parseError) {
          console.error("Error parsing HuggingFace response:", parseError);
        }
      }

      // Fallback if parsing fails
      return this.analyzeWithRegex(text);
    } catch (error) {
      console.error("HuggingFace API error:", error);
      throw error;
    }
  }

  // Regex-based fallback analysis
  analyzeWithRegex(text) {
    const patterns = {
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        type: "Email Address",
        risk: "high",
      },
      phone: {
        regex:
          /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|(\+91[-\s]?)?[6-9]\d{9}/g,
        type: "Phone Number",
        risk: "high",
      },
      creditCard: {
        regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        type: "Credit Card",
        risk: "critical",
      },
      ssn: {
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        type: "SSN",
        risk: "critical",
      },
      aadhaar: {
        regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        type: "Aadhaar Number",
        risk: "critical",
      },
      pan: {
        regex: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
        type: "PAN Card",
        risk: "critical",
      },
      ipAddress: {
        regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        type: "IP Address",
        risk: "medium",
      },
      address: {
        regex:
          /\b\d+\s+[\w\s]+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|chsl|society|apartment|building|mumbai|delhi|bangalore)\b/gi,
        type: "Address",
        risk: "high",
      },
    };

    const sensitiveItems = [];
    let maxRisk = "none";

    for (const [key, config] of Object.entries(patterns)) {
      const matches = [...text.matchAll(config.regex)];
      matches.forEach((match) => {
        sensitiveItems.push({
          type: config.type,
          value: match[0],
          confidence: 1.0,
          risk: config.risk,
        });

        // Update max risk level
        if (config.risk === "critical") maxRisk = "critical";
        else if (config.risk === "high" && maxRisk !== "critical")
          maxRisk = "high";
        else if (
          config.risk === "medium" &&
          !["critical", "high"].includes(maxRisk)
        )
          maxRisk = "medium";
        else if (maxRisk === "none") maxRisk = "low";
      });
    }

    return {
      sensitiveItems,
      riskLevel: sensitiveItems.length > 0 ? maxRisk : "none",
      confidence: 1.0,
      provider: "regex",
      explanation:
        sensitiveItems.length > 0
          ? `Found ${sensitiveItems.length} sensitive item(s)`
          : "No sensitive information detected",
    };
  }

  // Enhanced analysis combining AI + regex
  async comprehensiveAnalysis(text) {
    try {
      // Get AI analysis
      const aiResult = await this.analyzePrivacySensitivity(text);

      // Get regex analysis as backup/validation
      const regexResult = this.analyzeWithRegex(text);

      // Combine and deduplicate results
      const combinedItems = [...aiResult.sensitiveItems];

      // Add regex items that AI might have missed
      regexResult.sensitiveItems.forEach((regexItem) => {
        const exists = combinedItems.some(
          (aiItem) =>
            aiItem.value
              .toLowerCase()
              .includes(regexItem.value.toLowerCase()) ||
            regexItem.value.toLowerCase().includes(aiItem.value.toLowerCase())
        );

        if (!exists) {
          combinedItems.push({
            ...regexItem,
            source: "regex_validation",
          });
        }
      });

      // Determine final risk level
      const riskLevels = ["none", "low", "medium", "high", "critical"];
      const finalRiskLevel =
        riskLevels[
          Math.max(
            riskLevels.indexOf(aiResult.riskLevel),
            riskLevels.indexOf(regexResult.riskLevel)
          )
        ];

      return {
        sensitiveItems: combinedItems,
        riskLevel: finalRiskLevel,
        confidence: Math.max(aiResult.confidence, regexResult.confidence),
        provider: aiResult.provider,
        explanation: aiResult.explanation || regexResult.explanation,
        sources: {
          ai: aiResult,
          regex: regexResult,
        },
      };
    } catch (error) {
      console.error("Error in comprehensive analysis:", error);
      return this.analyzeWithRegex(text);
    }
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIPrivacyAnalyzer;
} else {
  window.AIPrivacyAnalyzer = AIPrivacyAnalyzer;
}
