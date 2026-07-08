export interface ScanResult {
  id?: number;
  riskScore: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  recommendation: string;
  details: {
    urgencyLevel: string;
    domainStatus: string;
    credentialHarvesting: boolean;
    impersonationTarget: string;
    threatType: string;
    explanation: string;
  };
  timestamp: string;
  scannedText: string;
}
