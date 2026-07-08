import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, ShieldCheck, ArrowLeft, Upload, FileText, Link2, Image as ImageIcon, 
  RefreshCw, Send, AlertTriangle, AlertOctagon, Copy, Check, Info, Shield, 
  Terminal, ArrowRight, Eye, Download, Sparkles, FileWarning, ExternalLink 
} from "lucide-react";
import { ScanResult } from "../types";
import axios from "axios";
import { scanContentApi } from "../services/scan.service";
import { generatePdfReport } from "../utils/pdfGenerator";
import Tesseract from "tesseract.js";
import jsQR from "jsqr";

interface ScanPageProps {
  onBackToHome: () => void;
  onNewScanResult: (result: ScanResult) => void;
  scans: ScanResult[];
}

export default function ScanPage({ onBackToHome, onNewScanResult, scans }: ScanPageProps) {
  const [activeTab, setActiveTab] = useState<"text" | "url" | "image">("text");
  
  // Inputs
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Image scanning specific states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number | null>(null);
  const [scanState, setScanState] = useState<"idle" | "uploading" | "decoding_qr" | "running_ocr" | "analyzing" | "success" | "failure">("idle");
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const [qrDetected, setQrDetected] = useState<boolean>(false);

  // Helper to decode QR code from base64/url source
  const scanQRCode = (imageSrc: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            resolve(code.data);
          } else {
            resolve(null);
          }
        } catch (err) {
          console.error("QR decoding failed:", err);
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = imageSrc;
    });
  };

  // Helper to compress image asynchronously before processing
  const compressImageAsync = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Target maximum bounds to keep text sharp but file highly optimized
          const MAX_BOUND = 1400;
          if (width > MAX_BOUND || height > MAX_BOUND) {
            if (width > height) {
              height = Math.round((height * MAX_BOUND) / width);
              width = MAX_BOUND;
            } else {
              width = Math.round((width * MAX_BOUND) / height);
              height = MAX_BOUND;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress quality to 0.85 (best trade-off between OCR legibility and file size)
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          resolve(compressed);
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const isMountedRef = useRef(true);
  const toastTimeoutRef = useRef<any>(null);
  const uploadProgressTimeoutRef = useRef<any>(null);
  const copiedTimeoutRef = useRef<any>(null);
  const scanIntervalRef = useRef<any>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastType(type);
    toastTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setToastMessage(null);
      }
    }, 4000);
  };

  const handleDownloadPdf = () => {
    if (!currentResult) {
      showToast("No active scan result available to generate report.", "error");
      return;
    }
    try {
      generatePdfReport(currentResult);
      showToast("PDF report downloaded successfully.", "success");
    } catch (err: any) {
      console.error("PDF download handler error:", err);
      showToast("Failed to generate PDF report. Please try again.", "error");
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelSourceRef = useRef<any>(null);

  // Cancel any pending request if the component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (cancelSourceRef.current) {
        cancelSourceRef.current.cancel("Scanner view closed/unmounted");
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (uploadProgressTimeoutRef.current) {
        clearTimeout(uploadProgressTimeoutRef.current);
      }
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const loadingSteps = [
    "Establishing secure sandboxed gateway...",
    "Extracting metadata stream headers...",
    "Scanning input against known malicious heuristics...",
    "Analyzing brand impersonation and visual spoofs...",
    "Compiling AI threat intelligence assessment report..."
  ];

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImage = async (file: File) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file format. Please upload PNG, JPG, JPEG, or WEBP only.");
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setError("File is too large. Maximum size allowed is 10 MB.");
      return;
    }

    setImageFile(file);
    setError(null);
    setUploadProgress(0);

    try {
      const compressedBase64 = await compressImageAsync(file);
      setImagePreview(compressedBase64);
      setImageBase64(compressedBase64);
      setUploadProgress(100);
      if (uploadProgressTimeoutRef.current) {
        clearTimeout(uploadProgressTimeoutRef.current);
      }
      uploadProgressTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setUploadProgress(null);
        }
      }, 1000);
    } catch (err) {
      console.error("Image compression error:", err);
      // Fallback to standard base64 if canvas compression fails
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultStr = e.target?.result as string;
        setImagePreview(resultStr);
        setImageBase64(resultStr);
        setUploadProgress(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Submit scan to our real API endpoint
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCurrentResult(null);
    setDetectedText(null);
    setQrDetected(false);

    let messageToSend = "";
    let typeParam: "url" | "text" | "email" = "text";

    if (activeTab === "text") {
      const trimmedText = textInput.trim();
      if (!trimmedText) {
        setError("Paste a suspicious link or message to begin.");
        return;
      }
      messageToSend = trimmedText;
      typeParam = "text";
    } else if (activeTab === "url") {
      const trimmedUrl = urlInput.trim();
      if (!trimmedUrl) {
        setError("Paste a suspicious link or message to begin.");
        return;
      }
      
      // Validate URL
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!urlRegex.test(trimmedUrl)) {
        setError("Please enter a valid URL or domain (e.g. wells-fargo-alert.com).");
        return;
      }
      messageToSend = trimmedUrl;
      typeParam = "url";
    } else if (activeTab === "image") {
      if (!imageBase64) {
        setError("Please upload an image/screenshot to perform the scan.");
        return;
      }
      
      setLoading(true);
      setScanState("uploading");
      setUploadProgress(10);
      
      // Simulate file load and optimization steps
      for (let p = 10; p <= 100; p += 15) {
        setUploadProgress(Math.min(p, 100));
        await new Promise((r) => setTimeout(r, 60));
      }
      setUploadProgress(null);

      // QR Code Decoding
      setScanState("decoding_qr");
      const decodedQR = await scanQRCode(imageBase64);
      
      if (decodedQR) {
        setQrDetected(true);
        setDetectedText(decodedQR);
        messageToSend = decodedQR;
        
        // Match standard URL regex to forward as a URL scan type if applicable
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        if (urlRegex.test(decodedQR.trim())) {
          typeParam = "url";
        } else {
          typeParam = "text";
        }
      } else {
        // OCR Glyph Extraction
        setScanState("running_ocr");
        setOcrProgress(0);
        
        try {
          const result = await Tesseract.recognize(
            imageBase64,
            "eng",
            {
              logger: (m) => {
                if (m.status === "recognizing text") {
                  setOcrProgress(Math.round(m.progress * 100));
                }
              }
            }
          );
          
          const extractedText = result.data?.text || "";
          if (!extractedText.trim()) {
            setLoading(false);
            setScanState("failure");
            setError("No visible text or QR code detected in the uploaded image. Please ensure the image contains clear, readable alphanumeric characters.");
            return;
          }
          
          setDetectedText(extractedText);
          messageToSend = extractedText;
          typeParam = "text";
        } catch (ocrErr: any) {
          console.error("OCR error:", ocrErr);
          setLoading(false);
          setScanState("failure");
          setError("Failed to extract text from image during sandbox OCR processing.");
          return;
        }
      }

      setScanState("analyzing");
      setAnalysisProgress(15);
    }

    // Cancel previous request if any
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel("New scan initiated");
    }
    cancelSourceRef.current = axios.CancelToken.source();

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    if (activeTab !== "image") {
      setLoading(true);
      setLoadingStep(0);
      scanIntervalRef.current = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingSteps.length - 1) return prev + 1;
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
          }
          return prev;
        });
      }, 450);
    } else {
      // Dynamic progress ticking for analysis step during image analysis
      scanIntervalRef.current = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev === null) return null;
          if (prev < 90) return prev + 8;
          return prev;
        });
      }, 250);
    }

    try {
      const payload = {
        type: typeParam,
        content: messageToSend
      };

      const data = await scanContentApi(payload, cancelSourceRef.current.token);
      const backendData = data.data;

      // Map "Safe" -> 5, "Suspicious" -> 45, "Dangerous" -> 95
      let mappedRiskScore = 10;
      if (backendData.risk === "Dangerous") {
        mappedRiskScore = 95;
      } else if (backendData.risk === "Suspicious") {
        mappedRiskScore = 45;
      } else {
        mappedRiskScore = 5;
      }

      // Map confidence level
      let mappedConfidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
      const confNum = Number(backendData.confidence);
      if (!isNaN(confNum)) {
        if (confNum >= 80) {
          mappedConfidence = "HIGH";
        } else if (confNum >= 40) {
          mappedConfidence = "MEDIUM";
        }
      } else if (backendData.confidence) {
        const confStr = String(backendData.confidence).toUpperCase();
        if (confStr.includes("HIGH")) mappedConfidence = "HIGH";
        else if (confStr.includes("MED")) mappedConfidence = "MEDIUM";
      }

      const finalResult: ScanResult = {
        riskScore: mappedRiskScore,
        confidence: mappedConfidence,
        reasons: backendData.reasons || [],
        recommendation: backendData.recommendation || "Safe",
        details: {
          urgencyLevel: backendData.risk === "Dangerous" ? "HIGH" : "NONE",
          domainStatus: typeParam === "url" && backendData.risk === "Dangerous" ? "SUSPICIOUS" : "SAFE",
          credentialHarvesting: backendData.risk === "Dangerous",
          impersonationTarget: backendData.category || "None",
          threatType: backendData.category || "General Analysis",
          explanation: backendData.summary || ""
        },
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        scannedText: activeTab === "image" ? `[Image Scan: ${imageFile?.name || "screenshot.png"}] ${messageToSend}` : messageToSend
      };

      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      if (isMountedRef.current) {
        setCurrentResult(finalResult);
        onNewScanResult(finalResult);
        setAnalysisProgress(100);
        setScanState("success");
        setLoading(false);
      }

    } catch (err: any) {
      if (axios.isCancel(err)) {
        console.log("Scan cancelled:", err.message);
        return;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (isMountedRef.current) {
        setScanState("failure");
        setLoading(false);
        console.error("Scan error:", err);
        const errorMessage = err.response?.data?.message || err.message || "The cybersecurity threat analysis failed.";
        setError(errorMessage);
      }
    }
  };

  const copyReport = () => {
    if (!currentResult) return;
    const reportText = `[AI Cyber Threat Intelligence Report]
Timestamp: ${currentResult.timestamp}
Result Category: ${currentResult.details.threatType}
Risk Score: ${currentResult.riskScore}%
AI Confidence Assessment: ${currentResult.confidence}
Target Impersonation Entity: ${currentResult.details.impersonationTarget}
Linguistic Urgency Tactics: ${currentResult.details.urgencyLevel}
Credential Harvesting Flag: ${currentResult.details.credentialHarvesting ? "YES" : "NO"}
Domain Security Rating: ${currentResult.details.domainStatus}
Actionable Recommendation: ${currentResult.recommendation}
Linguistic Explanation: ${currentResult.details.explanation}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setCopied(false);
      }
    }, 2000);
  };

  const resetScanner = () => {
    setTextInput("");
    setUrlInput("");
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setCurrentResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent-secondary/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToHome}
              className="p-3 rounded-xl bg-bg-secondary hover:bg-border-custom border border-border-custom hover:border-accent-primary/20 text-text-muted hover:text-text-primary transition-all cursor-pointer flex items-center justify-center group"
              id="scan-back-btn"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-primary animate-ping" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent-primary font-bold">
                  Active Threat Laboratory
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-text-primary tracking-tight">
                Secure Sandboxed <span className="text-accent-secondary">Scam Analyzer</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-text-muted bg-bg-secondary border border-border-custom px-3 py-1.5 rounded-xl">
              ACTIVE_SECTOR: US-WEST_CORE
            </span>
          </div>
        </div>

        {/* WORKSPACE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: SCAN INPUT MODULE (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-[28px] bg-bg-secondary border border-border-custom p-6 sm:p-8">
              
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-bg-card rounded-2xl border border-border-custom mb-8">
                <button
                  onClick={() => { setActiveTab("text"); setError(null); }}
                  className={`py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === "text"
                      ? "bg-accent-primary text-text-primary shadow-md"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-secondary/40"
                  }`}
                  id="tab-btn-text"
                >
                  <FileText className="w-4 h-4" />
                  Text Content
                </button>
                <button
                  onClick={() => { setActiveTab("url"); setError(null); }}
                  className={`py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === "url"
                      ? "bg-accent-primary text-text-primary shadow-md"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-secondary/40"
                  }`}
                  id="tab-btn-url"
                >
                  <Link2 className="w-4 h-4" />
                  URL Redirect
                </button>
                <button
                  onClick={() => { setActiveTab("image"); setError(null); }}
                  className={`py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === "image"
                      ? "bg-accent-primary text-text-primary shadow-md"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-secondary/40"
                  }`}
                  id="tab-btn-image"
                >
                  <ImageIcon className="w-4 h-4" />
                  Screenshot
                </button>
              </div>

              {/* INPUT FORM */}
              <form onSubmit={handleScanSubmit} className="space-y-6">
                
                {activeTab === "text" && (
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-mono text-text-muted font-semibold tracking-wider">
                      Paste Suspect Messaging Copy
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste text copy here (e.g. PayPal warning, restricted card notification, refund SMS, WhatsApp demand)..."
                      className="w-full min-h-[220px] max-h-[400px] rounded-2xl bg-bg-card border border-border-custom hover:border-accent-primary/20 focus:border-accent-primary focus:outline-none p-5 text-sm text-text-primary placeholder:text-text-muted/50 transition-all font-sans leading-relaxed resize-y"
                      disabled={loading}
                      id="scan-text-textarea"
                    />
                  </div>
                )}

                {activeTab === "url" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-mono text-text-muted font-semibold tracking-wider">
                        Enter Link or Domain URL
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60 text-sm font-mono">
                          HTTPS://
                        </div>
                        <input
                          type="text"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="chase-account-protection-sec.com/login"
                          className="w-full py-4 pl-24 pr-4 rounded-2xl bg-bg-card border border-border-custom hover:border-accent-primary/20 focus:border-accent-primary focus:outline-none text-sm text-text-primary placeholder:text-text-muted/50 transition-all font-mono"
                          disabled={loading}
                          id="scan-url-input"
                        />
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-bg-card border border-border-custom text-xs text-text-muted flex items-start gap-3">
                      <Info className="w-4.5 h-4.5 text-accent-secondary shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Our backend threat resolver will sandbox the URL metadata, mapping certificate validity, checking clone templates, and evaluating spoof layouts without sending cookies or local credentials.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "image" && (
                  <div className="space-y-4">
                    <label className="block text-xs uppercase font-mono text-text-muted font-semibold tracking-wider">
                      Upload screenshot of suspect scam
                    </label>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={triggerFileSelect}
                      className={`relative min-h-[200px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-6 transition-all cursor-pointer ${
                        dragActive 
                          ? "border-accent-primary bg-accent-primary/5" 
                          : "border-border-custom hover:border-accent-primary/20 bg-bg-card"
                      }`}
                      id="scan-image-dropzone"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {imagePreview ? (
                        <div className="relative group w-full max-w-[280px]">
                          <img
                            src={imagePreview}
                            alt="Scan target screenshot preview"
                            className="rounded-xl border border-border-custom max-h-[160px] mx-auto object-contain"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <span className="text-xs font-semibold text-text-primary bg-bg-primary border border-border-custom px-3 py-1.5 rounded-lg">
                              Replace Image
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border-custom flex items-center justify-center text-text-muted mb-4 group-hover:text-text-primary">
                            <Upload className="w-6 h-6 text-accent-secondary" />
                          </div>
                          <p className="text-sm text-text-primary font-semibold mb-1">
                            Drag & Drop screenshot or browse
                          </p>
                          <p className="text-xs text-text-muted">
                            Supports PNG, JPG, JPEG, WEBP files up to 10MB
                          </p>
                        </>
                      )}
                    </div>

                    {/* Additional textual context if needed */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase font-mono text-text-muted font-semibold tracking-wider">
                        Additional Textual Context (Optional)
                      </label>
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="e.g. Received via SMS from +1 (341) 555-0142"
                        className="w-full py-3.5 px-4 rounded-xl bg-bg-card border border-border-custom hover:border-accent-primary/20 focus:border-accent-primary focus:outline-none text-sm text-text-primary placeholder:text-text-muted/50 transition-all"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Submitting Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-border-custom">
                  <button
                    type="button"
                    onClick={resetScanner}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-bg-card hover:bg-border-custom border border-border-custom text-text-muted hover:text-text-primary text-sm font-semibold tracking-wide transition-all cursor-pointer"
                  >
                    Reset Input
                  </button>

                  <button
                    type="submit"
                    disabled={
                      loading || 
                      (activeTab === "text" && !textInput.trim()) || 
                      (activeTab === "url" && !urlInput.trim()) || 
                      (activeTab === "image" && !imageBase64)
                    }
                    className="w-full sm:flex-1 relative px-6 py-3.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 disabled:bg-bg-card disabled:border-border-custom disabled:text-text-muted/50 text-text-primary font-bold tracking-wider transition-all shadow-[0_4px_24px_rgba(124,58,237,0.25)] hover:shadow-[0_4px_30px_rgba(124,58,237,0.4)] disabled:shadow-none cursor-pointer flex items-center justify-center gap-2 group overflow-hidden"
                    id="scan-submit-btn"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 text-accent-secondary animate-spin" />
                        Scanning Cyber Vectors...
                      </>
                    ) : (
                      <>
                        <Send className="w-4.5 h-4.5 text-accent-secondary" />
                        Initiate Sandbox Analysis
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>

          {/* RIGHT PANEL: LIVE THREAT DICTATION & GRAPHS (5 Columns) */}
          <div className="lg:col-span-5">
            <div className="rounded-[28px] bg-bg-secondary border border-border-custom p-6 sm:p-8 min-h-[460px] flex flex-col justify-between relative overflow-hidden">
              
              {currentResult && (
                <div className={`absolute -right-24 -bottom-24 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none transition-all ${
                  currentResult.riskScore > 75 
                    ? "bg-status-danger" 
                    : currentResult.riskScore > 30 
                    ? "bg-accent-secondary" 
                    : "bg-status-success"
                }`} />
              )}

              {/* EMPTY STATE */}
              {!loading && !currentResult && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4" id="scan-empty-state">
                  <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border-custom flex items-center justify-center mb-6 text-text-muted/60">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h4 className="font-display font-bold text-lg text-text-primary mb-2">
                    Paste a suspicious link or message to begin.
                  </h4>
                  <p className="text-sm text-text-muted max-w-sm leading-relaxed mb-6">
                    Awaiting secure sandbox session trigger. Provide content parameters in the left panel and initiate inspection to populate real-time threat data.
                  </p>
                  
                  {/* Preset Quick Loader Buttons */}
                  <div className="w-full space-y-2 pt-4 border-t border-border-custom">
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                      Quick Load Presets for immediate API scan:
                    </span>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => {
                          setActiveTab("text");
                          setTextInput("Netflix Alert: Your payment method was declined. Please verify your billing address immediately at https://netflix-billing-resolve-92.com to restore service access.");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-bg-card border border-border-custom text-text-muted hover:text-text-primary text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Netflix Phishing SMS
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("url");
                          setUrlInput("http://wells-fargo-card-auth-alert.org");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-bg-card border border-border-custom text-text-muted hover:text-text-primary text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Wells Fargo Fake URL
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LOADING STATE */}
              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4" id="scan-loading-state">
                  <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-accent-primary/10 border-t-accent-primary animate-spin" />
                    <Terminal className="w-6 h-6 text-accent-secondary animate-pulse" />
                  </div>
                  
                  {activeTab === "image" ? (
                    <div className="w-full space-y-5 max-w-xs text-left">
                      <h4 className="font-display font-bold text-base text-text-primary text-center mb-4">
                        Processing Sandbox Cyber Vectors...
                      </h4>
                      
                      {/* Upload Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-text-muted">
                          <span>1. Image Parsing & Prep</span>
                          <span className="text-accent-secondary font-bold">
                            {scanState === "uploading" ? `${uploadProgress || 0}%` : (scanState !== "idle" && scanState !== "uploading" ? "COMPLETED" : "WAITING")}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden border border-border-custom">
                          <div 
                            className={`h-full transition-all duration-300 ${scanState === "uploading" ? "bg-accent-secondary" : "bg-status-success"}`}
                            style={{ 
                              width: scanState === "uploading" 
                                ? `${uploadProgress || 0}%` 
                                : (scanState !== "idle" && scanState !== "uploading" ? "100%" : "0%") 
                            }}
                          />
                        </div>
                      </div>

                      {/* QR & OCR Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-text-muted">
                          <span>2. QR Decoding & OCR Extraction</span>
                          <span className="text-accent-secondary font-bold">
                            {scanState === "decoding_qr" 
                              ? "DECODING QR..." 
                              : scanState === "running_ocr" 
                              ? `OCR: ${ocrProgress || 0}%` 
                              : (scanState === "analyzing" || scanState === "success" ? "COMPLETED" : "WAITING")}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden border border-border-custom">
                          <div 
                            className={`h-full transition-all duration-300 ${scanState === "running_ocr" ? "bg-accent-secondary" : (scanState === "decoding_qr" ? "bg-accent-primary/50 animate-pulse" : (scanState === "analyzing" || scanState === "success" ? "bg-status-success" : "bg-transparent"))}`}
                            style={{ 
                              width: scanState === "running_ocr" 
                                ? `${ocrProgress || 0}%` 
                                : (scanState === "decoding_qr" ? "30%" : (scanState === "analyzing" || scanState === "success" ? "100%" : "0%")) 
                            }}
                          />
                        </div>
                      </div>

                      {/* Analysis Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-text-muted">
                          <span>3. AI Cyber Threat Scan</span>
                          <span className="text-accent-secondary font-bold">
                            {scanState === "analyzing" ? `${analysisProgress || 0}%` : (scanState === "success" ? "COMPLETED" : "WAITING")}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden border border-border-custom">
                          <div 
                            className={`h-full transition-all duration-300 ${scanState === "analyzing" ? "bg-accent-secondary" : (scanState === "success" ? "bg-status-success" : "bg-transparent")}`}
                            style={{ 
                              width: scanState === "analyzing" 
                                ? `${analysisProgress || 0}%` 
                                : (scanState === "success" ? "100%" : "0%") 
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-center pt-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-[9px] font-mono text-accent-secondary animate-pulse uppercase tracking-widest font-bold">
                          {scanState === "uploading" && "Optimizing & Compiling File..."}
                          {scanState === "decoding_qr" && "Scanning For QR Headers..."}
                          {scanState === "running_ocr" && "Parsing Optical Glyphs..."}
                          {scanState === "analyzing" && "Evaluating AI Threat Models..."}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-display font-bold text-lg text-text-primary mb-3">
                        Analyzing for phishing indicators...
                      </h4>
                      
                      <div className="h-6 overflow-hidden">
                        <motion.p
                          key={loadingStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs font-mono text-accent-secondary tracking-wide uppercase"
                        >
                          {loadingSteps[loadingStep]}
                        </motion.p>
                      </div>

                      <div className="w-48 h-[3px] bg-bg-card rounded-full mt-6 overflow-hidden border border-border-custom">
                        <motion.div
                          className="h-full bg-accent-primary"
                          initial={{ width: "0%" }}
                          animate={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ERROR STATE */}
              {error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4" id="scan-error-state">
                  <div className="w-16 h-16 rounded-2xl bg-status-danger/10 border border-status-danger/30 flex items-center justify-center mb-6 text-status-danger">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h4 className="font-display font-bold text-lg text-status-danger mb-2">
                    Threat Resolver Fault
                  </h4>
                  <p className="text-sm text-text-muted max-w-md leading-relaxed mb-6">
                    {error}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setError(null);
                        handleScanSubmit(new Event("submit") as any);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-text-primary text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                    >
                      Retry Analysis
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="px-5 py-2.5 rounded-xl bg-bg-card border border-border-custom hover:border-accent-primary/20 text-text-muted hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Dismiss Error
                    </button>
                  </div>
                </div>
              )}

              {/* SUCCESS RESULTS CARD */}
              {currentResult && !loading && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex-1 flex flex-col justify-between"
                  id="scan-result-card"
                >
                  {/* Result Header */}
                  <div className="flex items-start justify-between mb-6 pb-4 border-b border-border-custom">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-text-muted">
                        Extracted Threat Category:
                      </span>
                      <h4 className="font-display font-bold text-xl text-text-primary mt-1">
                        {currentResult.details.threatType}
                      </h4>
                    </div>
                    
                     <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleDownloadPdf}
                        disabled={!currentResult}
                        className="p-2 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-secondary hover:text-text-primary border border-accent-primary/20 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download PDF Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Report
                      </button>

                      <button
                        onClick={copyReport}
                        className="p-2 rounded-lg bg-bg-card hover:bg-border-custom text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                        title="Copy Threat Report"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-status-success" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Report
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Core Metrics Score Ring & Status */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    
                    {/* Ring score */}
                    <div className="bg-bg-card p-4 rounded-2xl border border-border-custom flex items-center gap-3">
                      <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            stroke="rgba(255,255,255,0.02)"
                            strokeWidth="4"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="28"
                            cy="28"
                            r="22"
                            stroke={
                              currentResult.riskScore > 75 
                                ? "var(--color-status-danger)" 
                                : currentResult.riskScore > 30 
                                ? "var(--color-accent-secondary)" 
                                : "var(--color-status-success)"
                            }
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray="138.16"
                            initial={{ strokeDashoffset: 138.16 }}
                            animate={{ strokeDashoffset: 138.16 - (138.16 * currentResult.riskScore) / 100 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          />
                        </svg>
                        <span className={`absolute font-display font-bold text-xs ${
                          currentResult.riskScore > 75 
                            ? "text-status-danger" 
                            : currentResult.riskScore > 30 
                            ? "text-accent-secondary" 
                            : "text-status-success"
                        }`}>
                          {currentResult.riskScore}%
                        </span>
                      </div>
                      <div>
                        <div className="text-[9px] text-text-muted uppercase tracking-wider font-mono">
                          Risk Index
                        </div>
                        <div className={`text-xs font-display font-bold uppercase ${
                          currentResult.riskScore > 75 
                            ? "text-status-danger" 
                            : currentResult.riskScore > 30 
                            ? "text-accent-secondary" 
                            : "text-status-success"
                        }`}>
                          {currentResult.riskScore > 75 ? "SEVERE" : currentResult.riskScore > 30 ? "SUSPICIOUS" : "SAFE"}
                        </div>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="bg-bg-card p-4 rounded-2xl border border-border-custom flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-bg-secondary flex items-center justify-center shrink-0 border border-border-custom">
                        {currentResult.riskScore > 75 ? (
                          <AlertOctagon className="w-5 h-5 text-status-danger" />
                        ) : currentResult.riskScore > 30 ? (
                          <AlertTriangle className="w-5 h-5 text-accent-secondary" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-status-success" />
                        )}
                      </div>
                      <div>
                        <div className="text-[9px] text-text-muted uppercase tracking-wider font-mono">
                          AI Confidence
                        </div>
                        <div className="text-xs font-display font-bold uppercase text-text-primary">
                          {currentResult.confidence}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detected Content Panel */}
                  {detectedText && (
                    <div className="mb-6 p-4 rounded-2xl bg-bg-card border border-border-custom text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold">
                          {qrDetected ? "Decoded QR Code Content:" : "Extracted Optical Character (OCR) Copy:"}
                        </span>
                        {qrDetected && (
                          <span className="px-2 py-0.5 rounded-full bg-status-success/15 border border-status-success/30 text-status-success text-[9px] font-mono uppercase font-bold animate-pulse">
                            QR Code Decoded
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-text-primary bg-bg-secondary p-3.5 rounded-xl border border-border-custom max-h-36 overflow-y-auto break-all whitespace-pre-wrap select-text leading-relaxed">
                        {detectedText}
                      </div>
                    </div>
                  )}

                  {/* Core threat details parameters list */}
                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-2xl bg-bg-card border border-border-custom">
                      <span className="text-[9px] uppercase font-mono text-text-muted tracking-widest block mb-1">
                        Technical Audit Log:
                      </span>
                      <p className="text-xs text-text-muted leading-relaxed font-sans">
                        {currentResult.details.explanation}
                      </p>
                    </div>

                    {/* Security parameters grids */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-bg-card rounded-xl border border-border-custom text-xs">
                        <span className="text-[9px] text-text-muted font-mono block uppercase">Impersonation Target:</span>
                        <span className="font-display font-semibold text-text-primary mt-0.5 block">
                          {currentResult.details.impersonationTarget}
                        </span>
                      </div>
                      <div className="p-3 bg-bg-card rounded-xl border border-border-custom text-xs">
                        <span className="text-[9px] text-text-muted font-mono block uppercase">Urgency Tactics:</span>
                        <span className="font-display font-semibold text-text-primary mt-0.5 block">
                          {currentResult.details.urgencyLevel}
                        </span>
                      </div>
                      <div className="p-3 bg-bg-card rounded-xl border border-border-custom text-xs">
                        <span className="text-[9px] text-text-muted font-mono block uppercase">Domain Authenticity:</span>
                        <span className="font-display font-semibold text-text-primary mt-0.5 block">
                          {currentResult.details.domainStatus}
                        </span>
                      </div>
                      <div className="p-3 bg-bg-card rounded-xl border border-border-custom text-xs">
                        <span className="text-[9px] text-text-muted font-mono block uppercase">Credential Soliciting:</span>
                        <span className="font-display font-semibold text-text-primary mt-0.5 block">
                          {currentResult.details.credentialHarvesting ? "YES (DETECTED)" : "NO (NONE)"}
                        </span>
                      </div>
                    </div>

                    {/* Threat reasons tags */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
                        Threat Flags Triggered:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentResult.reasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-bg-card border border-border-custom text-text-primary flex items-center gap-1.5"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              currentResult.riskScore > 75 
                                ? "bg-status-danger" 
                                : "bg-accent-secondary"
                            }`} />
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Operational recommendation box */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    currentResult.riskScore > 75
                      ? "bg-status-danger/5 border-status-danger/20 text-status-danger"
                      : currentResult.riskScore > 30
                      ? "bg-accent-secondary/5 border-accent-secondary/20 text-accent-secondary"
                      : "bg-status-success/5 border-status-success/20 text-status-success"
                  }`}>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest font-mono font-semibold opacity-75">
                        Defensive System Mitigation Recommendation
                      </div>
                      <div className="text-base font-display font-bold uppercase tracking-wider mt-0.5">
                        {currentResult.recommendation}
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      currentResult.riskScore > 75
                        ? "bg-status-danger/10 border-status-danger/20"
                        : currentResult.riskScore > 30
                        ? "bg-accent-secondary/10 border-accent-secondary/20"
                        : "bg-status-success/10 border-status-success/20"
                    }`}>
                      {currentResult.riskScore > 75 ? (
                        <AlertOctagon className="w-5 h-5" />
                      ) : currentResult.riskScore > 30 ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                </motion.div>
              )}

            </div>
          </div>

        </div>

        {/* RECENT SCANS LOGS TABLE */}
        <div className="mt-16 rounded-[28px] bg-bg-secondary border border-border-custom p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-text-primary flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent-secondary" />
              Secure Inbound Threat Ledger Logs
            </h3>
            <span className="font-mono text-xs text-text-muted bg-bg-card border border-border-custom px-2.5 py-1 rounded-md">
              LOG_ENTRIES: {scans.length}
            </span>
          </div>

          {scans.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              <FileWarning className="w-10 h-10 text-text-muted/40 mx-auto mb-4" />
              <p className="text-xs font-mono uppercase tracking-wider mb-1">LEDGER_EMPTY</p>
              <p className="text-xs">All real-time scan metrics reside inside this transient session ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-custom text-text-muted uppercase font-mono tracking-wider pb-3">
                    <th className="py-3 font-semibold">Timestamp</th>
                    <th className="py-3 font-semibold">Security Level</th>
                    <th className="py-3 font-semibold">Risk Index</th>
                    <th className="py-3 font-semibold">Analyzed Content Segment</th>
                    <th className="py-3 font-semibold text-right">System Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {scans.slice().reverse().map((scan, idx) => (
                    <tr key={idx} className="hover:bg-bg-card/20 transition-colors">
                      <td className="py-3.5 font-mono text-text-muted">{scan.timestamp}</td>
                      <td className="py-3.5 font-medium text-text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            scan.riskScore > 75 
                              ? "bg-status-danger" 
                              : scan.riskScore > 30 
                              ? "bg-accent-secondary" 
                              : "bg-status-success"
                          }`} />
                          {scan.details.threatType}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono">
                        <span className={
                          scan.riskScore > 75 
                            ? "text-status-danger font-bold" 
                            : scan.riskScore > 30 
                            ? "text-accent-secondary font-bold" 
                            : "text-status-success font-bold"
                        }>
                          {scan.riskScore}%
                        </span>
                      </td>
                      <td className="py-3.5 text-text-muted max-w-[280px] truncate">
                        {scan.scannedText}
                      </td>
                      <td className="py-3.5 text-right font-mono text-text-primary font-bold tracking-wider">
                        <span className={`px-2 py-1 rounded-md text-[10px] ${
                          scan.riskScore > 75 
                            ? "bg-status-danger/10 text-status-danger border border-status-danger/25" 
                            : scan.riskScore > 30 
                            ? "bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/25" 
                            : "bg-status-success/10 text-status-success border border-status-success/25"
                        }`}>
                          {scan.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-lg ${
              toastType === "error"
                ? "bg-status-danger/10 border-status-danger/30 text-status-danger"
                : toastType === "success"
                ? "bg-status-success/10 border-status-success/30 text-status-success"
                : "bg-accent-primary/10 border-accent-primary/30 text-accent-secondary"
            }`}
          >
            {toastType === "error" ? (
              <AlertOctagon className="w-5 h-5 shrink-0 text-status-danger" />
            ) : (
              <ShieldCheck className="w-5 h-5 shrink-0 text-status-success" />
            )}
            <div className="text-xs font-mono font-semibold tracking-wide text-text-primary">
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
