"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import websocketService from "@/services/websocket.service";
import type { QSLData, QSLWebSocketUpdate } from "@/types/qsl.types";

interface UseQSLDataOptions {
  line: number; // 1, 2, 3, 4...
  enableRealtime?: boolean;
  tvMode?: boolean; // Enable auto-refresh for TV displays
}

export function useQSLData(options: UseQSLDataOptions) {
  const [data, setData] = useState<QSLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render counter

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Real-time update handler - Server-confirmed data only
  const handleRealtimeUpdate = useCallback((updateData: QSLWebSocketUpdate) => {
    console.log(`🔄 QSL WebSocket update received for LINE${updateData.line}:`, updateData);

    // Verify this is legitimate server data
    if (!updateData.timestamp || !updateData.data) {
      console.warn("⚠️ Invalid WebSocket update data, ignoring");
      return;
    }

    // Force update counter to trigger re-render with server data
    setForceUpdate((prev) => prev + 1);

    setData((prevData) => {
      // ✅ Direct replacement - trust backend data completely
      const newData = updateData.data;

      console.log(`✅ QSL data updated for LINE${updateData.line}`, {
        totalTeams: newData.totalTeams,
        teams: newData.teams.map((t) => t.tenTo),
        updateType: updateData.type,
      });

      return newData;
    });
  }, []);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        }/api/display/qsl?line=${options.line}&_t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch QSL data");
      }

      console.log(`✅ QSL initial data loaded for LINE${options.line}:`, {
        totalTeams: result.data.totalTeams,
        teams: result.data.teams.map((t: any) => t.tenTo),
      });

      setData(result.data);
    } catch (err) {
      console.error(`❌ Error fetching QSL data for LINE${options.line}:`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [options.line]);

  // Setup WebSocket subscriptions
  useEffect(() => {
    if (!options.enableRealtime) {
      return;
    }

    console.log(`📡 Setting up WebSocket for QSL LINE${options.line}`);

    // Subscribe to QSL updates
    const socket = (websocketService as any).socket;

    if (socket) {
      // Subscribe to specific line
      socket.emit("subscribe-qsl", { line: options.line });

      // Listen for subscription confirmation
      socket.once("qsl-subscription-confirmed", (confirmation: any) => {
        console.log("✅ QSL subscription confirmed:", confirmation);
        setConnected(true);
      });

      // Listen for updates
      socket.on("qsl-update", handleRealtimeUpdate);

      // Monitor connection status
      socket.on("connect", () => {
        console.log("🔌 WebSocket connected, re-subscribing to QSL...");
        setConnected(true);
        // Re-subscribe after reconnection
        socket.emit("subscribe-qsl", { line: options.line });
      });

      socket.on("disconnect", () => {
        console.log("🔌 WebSocket disconnected");
        setConnected(false);
      });
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.off("qsl-update", handleRealtimeUpdate);
        socket.off("qsl-subscription-confirmed");
      }
    };
  }, [options.line, options.enableRealtime, handleRealtimeUpdate]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    console.log(`🔄 Manual refresh triggered for LINE${options.line}`);
    await fetchInitialData();
  }, [fetchInitialData]);

  return {
    data,
    loading,
    error,
    connected,
    refresh,
    forceUpdate, // Used to trigger re-renders when needed
  };
}

export default useQSLData;
