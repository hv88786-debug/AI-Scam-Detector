import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import backendApp from "./server/src/app.js";

dotenv.config();

// Helper to get Gemini client securely
let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in your AI Studio secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Mount the new standard MVC backend application
  app.use(backendApp);

  app.use(express.json());

  // API Route for real-time scam analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { message, type = "auto", imageData, mimeType } = req.body;

      if (!message && !imageData) {
        return res.status(400).json({ error: "Either message content or screenshot/image data is required for analysis." });
      }

      // Initialize Gemini Client inside request handler to prevent crashing if key is missing on start
      const ai = getGemini();

      const prompt = `Analyze the following input content (Type: ${type}) for cybersecurity threats, scams, phishing indicators, fraud, impersonation, or credential harvesting flags.
      
Input Text Content:
"""
${message || "No textual context provided. Inspect the attached image/screenshot context."}
"""

Instructions:
1. Examine the screenshot or textual data for high-pressure wording, malicious URLs, fake brand logos (DHL, Chase, Netflix, WhatsApp etc.), credential-soliciting or OTP codes.
2. Formulate an objective threat intelligence evaluation.`;

      const contents: any[] = [];
      if (imageData && mimeType) {
        // Clean base64 prefix if present
        const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        });
      }
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: `You are an elite cybersecurity intelligence system specialized in detecting scams, phishing attempts, fraudulent domains, messaging scams (SMS/WhatsApp), financial fraud, and credential harvesting.
          Your task is to provide objective, mathematically sound, and actionable threat analysis of the provided content.
          If an image is provided, inspect the text or visual elements inside it.
          Never invent statistics or false references. Stick strictly to detecting threat hallmarks inside the input.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: {
                type: Type.INTEGER,
                description: "A cybersecurity threat risk score from 0 (completely safe) to 100 (confirmed scam/malicious).",
              },
              confidence: {
                type: Type.STRING,
                description: "Confidence in this assessment: HIGH, MEDIUM, or LOW.",
              },
              reasons: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "List of concrete threat indicators or trust factors detected in the input.",
              },
              recommendation: {
                type: Type.STRING,
                description: "Clear actionable advice: BLOCK IMMEDIATELY, PROCEED WITH CAUTION, or SAFE.",
              },
              details: {
                type: Type.OBJECT,
                properties: {
                  urgencyLevel: {
                    type: Type.STRING,
                    description: "High-pressure tactics detected: HIGH, MEDIUM, or NONE.",
                  },
                  domainStatus: {
                    type: Type.STRING,
                    description: "Links or domain security status: SUSPICIOUS, SAFE, or NOT_APPLICABLE.",
                  },
                  credentialHarvesting: {
                    type: Type.BOOLEAN,
                    description: "Whether the message solicits OTP keys, passwords, pins, or bank logins.",
                  },
                  impersonationTarget: {
                    type: Type.STRING,
                    description: "Name of the entity or brand being impersonated (e.g. Netflix, Chase Bank, DHL), or 'None'.",
                  },
                  threatType: {
                    type: Type.STRING,
                    description: "Specific threat category: Phishing, Fake Bank, WhatsApp Scam, QR Fraud, SMS Scam, Identity Theft, or Safe.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A professional 2-3 sentence technical explanation of why this risk score was generated.",
                  },
                },
                required: ["urgencyLevel", "domainStatus", "credentialHarvesting", "impersonationTarget", "threatType", "explanation"],
              },
            },
            required: ["riskScore", "confidence", "reasons", "recommendation", "details"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No analysis received from the AI model.");
      }

      const result = JSON.parse(responseText.trim());
      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error("Analysis Error:", error);
      const errorMessage = error.message || "";
      const isConfigError = errorMessage.includes("GEMINI_API_KEY");

      return res.status(isConfigError ? 503 : 500).json({
        success: false,
        message: isConfigError
          ? "The AI Scan system is currently offline: GEMINI_API_KEY secret is not configured in the workspace settings."
          : "Secure analysis scan failed. Please verify your connection and try again."
      });
    }
  });

  // Serve static assets or use Vite Dev Server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Scam Detector Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
