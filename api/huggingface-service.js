// HuggingFace API Service for SafePost AI
class HuggingFaceService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api-inference.huggingface.co/models";
    this.models = {
      ner: "dbmdz/bert-large-cased-finetuned-conll03-english",
      toxicity: "unitary/toxic-bert",
      zeroShot: "facebook/bart-large-mnli",
      sentiment: "cardiffnlp/twitter-roberta-base-sentiment-latest",
    };
  }

  async makeRequest(modelName, payload) {
    const response = await fetch(`${this.baseUrl}/${modelName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `HuggingFace API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  // Named Entity Recognition for PII detection
  async detectEntities(text) {
    try {
      const result = await this.makeRequest(this.models.ner, {
        inputs: text,
      });

      // Filter for PII-related entities
      const piiEntities = result.filter(
        (entity) =>
          ["PER", "LOC", "ORG", "MISC"].includes(entity.entity_group) ||
          ["PERSON", "LOCATION", "ORGANIZATION"].includes(entity.entity_group)
      );

      return piiEntities;
    } catch (error) {
      console.error("Error in NER detection:", error);
      return [];
    }
  }

  // Toxicity detection
  async detectToxicity(text) {
    try {
      const result = await this.makeRequest(this.models.toxicity, {
        inputs: text,
      });

      // toxic-bert returns toxicity scores
      const toxicScore =
        result[0]?.find((item) => item.label === "TOXIC")?.score || 0;
      return {
        isToxic: toxicScore > 0.5,
        score: toxicScore,
        confidence: toxicScore,
      };
    } catch (error) {
      console.error("Error in toxicity detection:", error);
      return { isToxic: false, score: 0, confidence: 0 };
    }
  }

  // Zero-shot classification for policy violations
  async detectPolicyViolations(text) {
    const policyLabels = [
      "hate speech",
      "harassment",
      "misinformation",
      "spam",
      "violence",
      "adult content",
      "copyright violation",
      "privacy violation",
    ];

    try {
      const result = await this.makeRequest(this.models.zeroShot, {
        inputs: text,
        parameters: {
          candidate_labels: policyLabels,
        },
      });

      // Return violations with confidence > 0.7
      const violations = result.labels
        .map((label, index) => ({
          policy: label,
          confidence: result.scores[index],
        }))
        .filter((item) => item.confidence > 0.7);

      return violations;
    } catch (error) {
      console.error("Error in policy violation detection:", error);
      return [];
    }
  }

  // Sentiment analysis
  async analyzeSentiment(text) {
    try {
      const result = await this.makeRequest(this.models.sentiment, {
        inputs: text,
      });

      return {
        label: result[0]?.label || "NEUTRAL",
        score: result[0]?.score || 0,
      };
    } catch (error) {
      console.error("Error in sentiment analysis:", error);
      return { label: "NEUTRAL", score: 0 };
    }
  }

  // PII detection using regex patterns
  detectPIIPatterns(text) {
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      address:
        /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|place|pl|chsl|mandir|nagar|colony|society|apartment|building|tower|complex|residency|heights|park|gardens|enclave|layout|phase|sector|block|plot|flat|house|near|dist|maharashtra|mumbai|delhi|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|west|east|north|south)\b/gi,
      indianAddress:
        /\b\d+[\/\-]?\d*\s+[\w\s]+(chsl|society|apartment|building|tower|complex|residency|heights|park|gardens|enclave|layout|phase|sector|block|plot|flat|house|near|dist|maharashtra|mumbai|delhi|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|gujarat|rajasthan|karnataka|tamil nadu|west bengal|uttar pradesh|bihar|madhya pradesh|odisha|kerala|assam|jharkhand|chhattisgarh|uttarakhand|himachal pradesh|manipur|meghalaya|nagaland|tripura|arunachal pradesh|mizoram|sikkim|goa|punjab|haryana|jammu and kashmir|ladakh|andhra pradesh|telangana)[\w\s]*\d{6}/gi,
      pincode: /\b\d{6}\b/g,
    };

    const detected = [];

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match) => {
        detected.push({
          type: type,
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 1.0,
        });
      });
    }

    return detected;
  }

  // Main analysis function
  async analyzeText(text) {
    if (!text || text.trim().length === 0) {
      return {
        pii: [],
        entities: [],
        toxicity: { isToxic: false, score: 0 },
        policyViolations: [],
        sentiment: { label: "NEUTRAL", score: 0 },
        isRisky: false,
      };
    }

    try {
      // Run all analyses in parallel
      const [piiPatterns, entities, toxicity, policyViolations, sentiment] =
        await Promise.all([
          this.detectPIIPatterns(text),
          this.detectEntities(text),
          this.detectToxicity(text),
          this.detectPolicyViolations(text),
          this.analyzeSentiment(text),
        ]);

      const isRisky =
        piiPatterns.length > 0 ||
        entities.length > 0 ||
        toxicity.isToxic ||
        policyViolations.length > 0;

      return {
        pii: piiPatterns,
        entities: entities,
        toxicity: toxicity,
        policyViolations: policyViolations,
        sentiment: sentiment,
        isRisky: isRisky,
      };
    } catch (error) {
      console.error("Error in text analysis:", error);
      return {
        pii: [],
        entities: [],
        toxicity: { isToxic: false, score: 0 },
        policyViolations: [],
        sentiment: { label: "NEUTRAL", score: 0 },
        isRisky: false,
        error: error.message,
      };
    }
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = HuggingFaceService;
} else {
  window.HuggingFaceService = HuggingFaceService;
}

const SYSTEM_PROMPT = `You are an AI-powered sensitive data leak prevention system embedded in a browser extension. 
Your goal is to analyze user-provided content and detect any text that may contain sensitive or personally identifiable information (PII) or confidential data. 

Sensitive information includes but is not limited to:
- Personal details: full names, phone numbers, email addresses, postal addresses, date of birth
- Government IDs: passport numbers, Aadhaar numbers, Social Security numbers
- Financial info: credit/debit card numbers, bank account details, IBAN, CVV
- Authentication data: usernames, passwords, API keys, tokens, security answers
- Health-related data: medical reports, prescriptions, health IDs
- Company confidential info: internal project names, unreleased product details, internal documents

**Instructions:**
1. Scan the provided text and identify all possible sensitive data instances.
2. For each detected instance:
   - Classify it into one of the categories above.
   - Provide a short reason why it may be sensitive.
   - Suggest a safe alternative or masking approach (e.g., replace digits with "X", blur in images).
3. If no sensitive data is found, return: "No sensitive content detected."

**Output format (JSON)**:
{
  "detected": true/false,
  "items": [
    {
      "text": "string (exact match)",
      "category": "string",
      "reason": "string",
      "suggestion": "string"
    }
  ]
}

Analyze this content:
"{USER_INPUT_TEXT}"`;

async function analyzeWithHuggingFace(text) {
  try {
    console.log("🔍 Analyzing text with Hugging Face...");

    const settings = await getStoredSettings();
    if (!settings.huggingfaceToken) {
      throw new Error("Hugging Face API token not configured");
    }

    // Replace the placeholder with actual user input
    const prompt = SYSTEM_PROMPT.replace("{USER_INPUT_TEXT}", text);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.huggingfaceToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.1,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Hugging Face response received");

    // Try to parse JSON response
    let result;
    try {
      const responseText = data[0]?.generated_text || data.generated_text || "";

      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else if (responseText.includes("No sensitive content detected")) {
        result = {
          detected: false,
          items: [],
        };
      } else {
        // Fallback: treat as detection with general warning
        result = {
          detected: true,
          items: [
            {
              text: text.substring(0, 50) + "...",
              category: "Unknown",
              reason: "Potential sensitive content detected",
              suggestion: "Review content before posting",
            },
          ],
        };
      }
    } catch (parseError) {
      console.warn("⚠️ Could not parse JSON response, using fallback");
      result = {
        detected: true,
        items: [
          {
            text: text.substring(0, 50) + "...",
            category: "Unknown",
            reason: "Could not analyze content properly",
            suggestion: "Review content manually before posting",
          },
        ],
      };
    }

    return result;
  } catch (error) {
    console.error("❌ Hugging Face analysis failed:", error);
    throw error;
  }
}
