"use client";

import { io, Socket } from "socket.io-client";

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private lastMessageTime = 0;
  private throttleDelay = 100; // Allow updates every 100ms (10 per second max)

  constructor() {
    this.connect();
  }

  private connect() {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    this.socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: this.reconnectInterval,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
    });

    // ✅ NEW: Listen for connection established
    this.socket.on("connection-established", (data: any) => {
      // console.log('✅ WebSocket: Connection established', {
      //   clientId: data.clientId,
      //   timestamp: data.timestamp
      // });
    });

    this.socket.on("disconnect", (reason) => {
      // console.log('🔌 WebSocket disconnected:', reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("💥 Max reconnection attempts reached");
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      this.reconnectAttempts = 0;
    });
  }

  // Subscribe to production updates by maChuyenLine (for TV displays)
  subscribeToMaChuyenLine(
    maChuyenLine: string,
    callback: (data: any) => void,
    factory?: string,
    index?: number
  ) {
    if (!this.socket) {
      console.error("❌ WebSocket: Socket not initialized");
      return;
    }

    // Throttled callback wrapper - allow rapid updates for real-time production data
    const throttledCallback = (data: any) => {
      const now = Date.now();
      const timeSinceLastMessage = now - this.lastMessageTime;

      // ✅ Always validate data first

      if (!this.validateBackendData(data)) {
        console.error("❌ WebSocket: Invalid data received");
        return;
      }

      // ✅ Light throttle (100ms) - prevents duplicate messages but allows rapid updates
      if (timeSinceLastMessage < this.throttleDelay) {
        return;
      }

      this.lastMessageTime = now;
      callback(data);
    };

    this.socket.emit("subscribe-production", {
      maChuyenLine,
      factory,
      index: index !== undefined ? index : undefined,
    });

    // ✅ Listen for subscription confirmation with timeout
    const confirmTimeout = setTimeout(() => {
      console.warn(
        "⚠️ WebSocket: No subscription confirmation received within 5s for",
        maChuyenLine
      );
    }, 5000);

    this.socket.once("subscription-confirmed", (confirmation: any) => {
      clearTimeout(confirmTimeout);
    });

    // ✅ Listen for production updates
    this.socket.on("production-update", (data) => {
      if (data.maChuyenLine === maChuyenLine) {
        throttledCallback(data);
      } else {
        console.log("⚠️ WebSocket: maChuyenLine mismatch, skipping callback");
      }
    });

    // ✅ Listen for CD-specific channel
    if (maChuyenLine.includes("CD")) {
      const cdChannel = `cd:${maChuyenLine}`;

      this.socket.on(cdChannel, (data) => {
        callback(data);
      });
    }

    // Listen for system broadcasts
    this.socket.on("cd-data-refresh", (data) => {
      if (maChuyenLine.includes("CD")) {
        callback({ type: "refresh", ...data });
      }
    });
  }

  // ✅ Simplified CD subscription
  subscribeToCDLine(maChuyenLine: string, callback: (data: any) => void) {
    if (!this.socket) return;

    // The channel name that backend emits to
    const cdChannel = `cd:${maChuyenLine}`;

    // Remove any existing listener first to avoid duplicates
    this.socket.off(cdChannel);

    // Add new listener
    this.socket.on(cdChannel, (data) => {
      callback(data);
    });
  }

  // Validate backend data structure matches GoogleSheetsProductionDto
  private validateBackendData(data: any): boolean {
    // Must have timestamp from backend
    if (!data.timestamp) return false;

    // Must have maChuyenLine or factory
    if (!data.maChuyenLine && !data.factory) return false;

    // Check for backend data structure
    if (data.data?.data || data.data?.summary) {
      const record = data.data.data || data.data.summary;
      // Validate key fields exist (theo chuẩn cột A-AS)
      return !!(
        typeof record.maChuyen === "string" ||
        typeof record.maChuyenLine === "string" ||
        typeof record.slth === "number"
      );
    }

    return true; // Allow other valid structures
  }

  // Subscribe to factory updates (for dashboards)
  subscribeToFactory(factory: string, callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.emit("subscribe-production", { factory });

    // Listen for production updates
    this.socket.on("production-update", callback);
    this.socket.on("production-immediate", callback);
  }

  // Subscribe to specific line/team
  subscribeToLineTeam(
    factory: string,
    line: string,
    team: string,
    callback: (data: any) => void
  ) {
    if (!this.socket) return;

    this.socket.emit("subscribe-production", { factory, line, team });

    // Listen for production updates
    this.socket.on("production-update", callback);
    this.socket.on("production-immediate", callback);
  }

  // Subscribe to Center TV updates (factory + line)
  subscribeToCenterTV(
    factory: string,
    line: string,
    callback: (data: any) => void
  ) {
    if (!this.socket) {
      console.error("❌ WebSocket: Socket not initialized");
      return;
    }

    const roomName = `center-tv-${factory.toLowerCase()}-${line}`;

    // ✅ Emit subscription request to backend
    this.socket.emit("subscribe-center-tv", { factory, line });

    // ✅ Listen for subscription confirmation
    this.socket.once(
      "center-tv-subscription-confirmed",
      (confirmation: any) => {
        // console.log('✅ WebSocket: Center TV subscription confirmed', confirmation);
      }
    );

    // ✅ Listen for center-tv-update events from the room
    this.socket.on("center-tv-update", (data) => {
      // Filter to only process events for this factory+line
      if (data.factory === factory && data.line === line) {
        // console.log(`📦 WebSocket: Received center-tv-update for ${factory} LINE ${line}`);
        callback(data);
      }
    });
  }

  // ✅ NEW: Subscribe to CD Product updates by sheet code (cd1, cd2, cd3, cd4)
  subscribeToCDProduct(code: string, callback: (data: any) => void) {
    if (!this.socket) {
      console.error("❌ WebSocket not initialized");
      return;
    }

    const sheetCode = code.toUpperCase(); // CD1, CD2, CD3, CD4

    console.log(`🔌 Subscribing to CD Product ${sheetCode}`);

    // Subscribe to specific sheet
    this.socket.emit("subscribe-cd-product", { code: sheetCode });

    // Listen for subscription confirmation
    this.socket.once(
      "cd-product-subscription-confirmed",
      (confirmation: any) => {
        // console.log("✅ CD Product subscription confirmed:", confirmation);
      }
    );

    // Listen for updates
    this.socket.on("cd-product-update", (data) => {
      // Only process updates for the subscribed sheet
      if (data.sheet === sheetCode) {
        // console.log(`📡 CD Product update received for ${sheetCode}:`, data);
        callback(data);
      }
    });
  }

  // Listen for system-wide updates
  onSystemUpdate(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.on("system-update", callback);
  }

  // Unsubscribe from updates
  unsubscribe(callback: (data: any) => void) {
    if (!this.socket) return;

    // Remove all event listeners
    this.socket.off("production-update", callback);
    this.socket.off("production-immediate", callback);
    this.socket.off("system-update", callback);
    this.socket.off("cd-data-refresh", callback);

    // ✅ Also remove CD-specific channels
    // Note: We can't know the exact channel name here, so we'll use removeAllListeners
    // This is called during cleanup anyway
  }

  // Get connection status with callback for status updates
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Monitor connection status changes
  onConnectionStatusChange(callback: (connected: boolean) => void) {
    if (!this.socket) return;

    this.socket.on("connect", () => callback(true));
    this.socket.on("disconnect", () => callback(false));
    this.socket.on("connect_error", () => callback(false));
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
