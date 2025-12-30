"use client";

import {
  TVDisplayAPIResponse,
  ProductionAPIResponse,
  ProductionQuery,
  APIResponse,
  ProductionLinesResponse,
} from "../types/api.types";

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  }

  // Generic fetch method với error handling
  private async fetchApi<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          ...options?.headers,
        },
        cache: "no-store",
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Production data endpoints
  async getProductionData(
    query: ProductionQuery
  ): Promise<APIResponse<ProductionAPIResponse>> {
    const searchParams = new URLSearchParams();

    if (query.maChuyenLine)
      searchParams.set("maChuyenLine", query.maChuyenLine);
    if (query.factory) searchParams.set("factory", query.factory);
    if (query.line) searchParams.set("line", query.line);
    if (query.team) searchParams.set("team", query.team);
    if (query.shift) searchParams.set("shift", query.shift.toString());

    const endpoint = `/production/data?${searchParams.toString()}`;
    return this.fetchApi<ProductionAPIResponse>(endpoint);
  }

  // Production summary
  async getProductionSummary(
    query: Partial<ProductionQuery>
  ): Promise<APIResponse<ProductionAPIResponse>> {
    const searchParams = new URLSearchParams();

    if (query.factory) searchParams.set("factory", query.factory);
    if (query.line) searchParams.set("line", query.line);
    if (query.team) searchParams.set("team", query.team);

    const endpoint = `/production/summary?${searchParams.toString()}`;
    return this.fetchApi<ProductionAPIResponse>(endpoint);
  }

  // Metadata
  async getMetadata(): Promise<APIResponse<any>> {
    return this.fetchApi<any>("/production/metadata");
  }

  // TV Display endpoint - Single optimized endpoint for TV displays
  async getTVDisplayData(
    code: string,
    factory?: string,
    index?: string // NEW: Team index for ENDLINE filtering
  ): Promise<APIResponse<TVDisplayAPIResponse>> {
    // ✅ CRITICAL: Build URL with factory and index parameters
    let endpoint = `/display/tv?code=${encodeURIComponent(code)}`;


    // ✅ CRITICAL: Add factory parameter for CD lines
    if (factory) {
      endpoint += `&factory=${encodeURIComponent(factory)}`;
    }
    
    // ✅ NEW: Add index parameter for ENDLINE RFT filtering
    if (index !== undefined && index !== null) {
      endpoint += `&index=${encodeURIComponent(index)}`;
    }
    
    // ⚠️ CRITICAL: Cache busting - force fresh data every request
    endpoint += `&_t=${Date.now()}`;

    const response = await this.fetchApi<TVDisplayAPIResponse>(endpoint);

    return response;
  }

  // Legacy display endpoint (still kept for compatibility)
  async getDisplayData(path: string) {
    // path format: "code=KVHB07M01" or "factory=TS1/line=1/team=2"
    const endpoint = `/display/${path}`;
    return this.fetchApi(endpoint);
  }

  async getActiveDisplays() {
    return this.fetchApi("/display/active");
  }

  async getDisplayStats() {
    return this.fetchApi("/display/stats");
  }

  async generateDisplayUrl(params: {
    factory: string;
    line?: string;
    team?: string;
  }) {
    return this.fetchApi("/display/generate-url", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Health check
  async healthCheck() {
    return this.fetchApi("/production/health");
  }

  // Force refresh data
  async refreshData(factory?: string) {
    const searchParams = factory ? `?factory=${factory}` : "";
    const endpoint = `/production/refresh${searchParams}`;

    return this.fetchApi(endpoint, {
      method: "POST",
    });
  }

  // Get production lines list with type filter
  async getProductionLines(
    type?: "HTM" | "CD" | "ALL",
    includeQSL: boolean = true
  ): Promise<APIResponse<ProductionLinesResponse>> {
    const typeParam = type ? `type=${type}` : "type=ALL";
    const qslParam = `includeQSL=${includeQSL}`;
    const endpoint = `/display/lines?${typeParam}&${qslParam}`;
    return this.fetchApi<ProductionLinesResponse>(endpoint);
  }

  // Get data by line type (HTM or CD)
  async getDataByLineType(
    lineType: "HTM" | "CD",
    factory: string = "ALL"
  ): Promise<APIResponse<any>> {
    const endpoint = `/display/${lineType}/data?factory=${factory}`;
    return this.fetchApi(endpoint);
  }

  // HTM Center TV endpoint - Get 3 groups (Quai-Sơn-Lót) by factory and line
  async getCenterTVData(
    factory: string,
    line: string
  ): Promise<APIResponse<any>> {
    const endpoint = `/display/center-tv?factory=${factory}&line=${line}`;
    return this.fetchApi(endpoint);
  }
}

// Singleton instance
const apiService = new ApiService();

export default apiService;
