"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import websocketService from "@/services/websocket.service";
import apiService from "@/services/api.service";
import type {
  CDProductData,
  CDProductWebSocketUpdate,
} from "@/types/cd-product.types";

interface UseCDProductDataOptions {
  code: string; // cd1, cd2, cd3, cd4
  enableRealtime?: boolean;
  tvMode?: boolean; // Enable auto-refresh for TV displays
}

export function useCDProductData(options: UseCDProductDataOptions) {
  const [data, setData] = useState<CDProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render counter

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Real-time update handler - Server-confirmed data only
  const handleRealtimeUpdate = useCallback(
    (updateData: CDProductWebSocketUpdate) => {

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

        return newData;
      });
    },
    []
  );

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        }/api/display/cd-product?code=${options.code}&_t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch CD product data");
      }

      setData(result.data);
    } catch (err) {
      console.error(
        `❌ Error fetching CD product data for ${options.code}:`,
        err
      );
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [options.code]);

  // Setup WebSocket subscriptions
  useEffect(() => {
    if (!options.enableRealtime) {
      return;
    }


    // Subscribe to CD Product updates
    const socket = (websocketService as any).socket;

    if (socket) {
      // Subscribe to specific sheet
      socket.emit("subscribe-cd-product", { code: options.code.toUpperCase() });

      // Listen for subscription confirmation
      socket.once("cd-product-subscription-confirmed", (confirmation: any) => {
        setConnected(true);
      });

      // Listen for updates
      socket.on("cd-product-update", handleRealtimeUpdate);

      // Monitor connection status
      socket.on("connect", () => {
        setConnected(true);
        // Re-subscribe after reconnection
        socket.emit("subscribe-cd-product", {
          code: options.code.toUpperCase(),
        });
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.off("cd-product-update", handleRealtimeUpdate);
        socket.off("cd-product-subscription-confirmed");
      }
    };
  }, [options.code, options.enableRealtime, handleRealtimeUpdate]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
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

export default useCDProductData;
