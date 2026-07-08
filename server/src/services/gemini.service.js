import { GoogleGenAI, Type } from "@google/genai";
import { config } from "../config/env.js";

let aiClient = null;

/**
 * Lazy initialization of the Gemini SDK client
 * @returns {GoogleGenAI}
 */
const getAiClient = () => {
  if (!aiClient) {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your environment or secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
};

/**
 * Perform a real-time scam scan using the Gemini model
 * @param {string} type - 'url' | 'text' | 'email'
 * @param {string} content - the text or link content to scan
 * @returns {Promise<string>} - RAW JSON response from Gemini
 */
export const scanContent = async (type, content) => {
  const ai = getAiClient();

  const systemInstruction = `You are an AI Cybersecurity Assistant specializing in phishing detection, scam analysis, fraud awareness, malicious messaging, impersonation attacks, and social engineering.

Analyze ONLY the content provided by the user.
Never invent facts.
If you cannot determine something from the provided content, explicitly state that it cannot be verified.
Return ONLY valid JSON.
Do not include markdown.
Do not explain outside JSON.`;

  const prompt = `Analyze the following user content for cyber threat metrics.
Input Type: ${type}
Content to Analyze:
"""
${content}
"""`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          risk: {
            type: Type.STRING,
            description: "Risk assessment: 'Safe', 'Suspicious', or 'Dangerous'."
          },
          confidence: {
            type: Type.INTEGER,
            description: "An integer confidence percentage from 0 to 100."
          },
          category: {
            type: Type.STRING,
            description: "Scam category (e.g. Phishing, SMS Spoofing, WhatsApp Scam, Financial Fraud, Safe, etc.)."
          },
          summary: {
            type: Type.STRING,
            description: "A clear, professional summary explaining the threat evaluation."
          },
          reasons: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: "Concrete warning markers or trust cues found."
          },
          recommendation: {
            type: Type.STRING,
            description: "Clear actionable advice: e.g. BLOCK IMMEDIATELY, SAFE TO INTERACT, or VERIFY SENDER."
          }
        },
        required: ["risk", "confidence", "category", "summary", "reasons", "recommendation"]
      }
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Received an empty or invalid response from the generative model.");
  }

  return responseText.trim();
};
