import api from "./api";
import { CancelToken } from "axios";

export interface BackendScanRequest {
  type: "url" | "text" | "email";
  content: string;
}

export interface BackendScanResponse {
  success: boolean;
  data: {
    risk: "Safe" | "Suspicious" | "Dangerous";
    confidence: number;
    category: string;
    summary: string;
    reasons: string[];
    recommendation: string;
  };
}

/**
 * Executes content scan on the backend POST /api/scan endpoint
 * @param payload The type and content to scan
 * @param cancelToken Optional Axios cancel token for request cancellation
 */
export const scanContentApi = async (
  payload: BackendScanRequest,
  cancelToken?: CancelToken
): Promise<BackendScanResponse> => {
  const response = await api.post<BackendScanResponse>("/api/scan", payload, {
    cancelToken,
  });
  return response.data;
};
