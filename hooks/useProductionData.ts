'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocket.service';
import apiService from '../services/api.service';
import autoRefreshService from '../services/auto-refresh.service';
import { useProductionStore } from '../stores/productionStore';

interface UseProductionDataOptions {
  maChuyenLine?: string;
  factory?: string;
  line?: string;
  team?: string;
  index?: string; // NEW: Team index for ENDLINE RFT filtering (0=Tổ 1, 1=Tổ 2, etc.)
  enableRealtime?: boolean;
  tvMode?: boolean; // Enable auto-refresh for TV displays
}

// Import từ store để sử dụng chung interface
import { ProductionData as StoreProductionData } from '../stores/productionStore';

interface ProductionData {
  maChuyenLine: string;
  factory: string;
  data: StoreProductionData[];
  summary: StoreProductionData;
  lastUpdate: string;
}

// Custom hook for production lines
export function useProductionLines() {
  const productionLines = useProductionStore((state) => state.productionLines);
  const linesLoading = useProductionStore((state) => state.linesLoading);
  const linesError = useProductionStore((state) => state.linesError);
  const fetchProductionLines = useProductionStore((state) => state.fetchProductionLines);
  const [hasFetched, setHasFetched] = useState(false);

  // Auto-fetch on first use if not already loaded
  useEffect(() => {
    // Only fetch once per component lifecycle
    if (!hasFetched && productionLines.length === 0 && !linesLoading && !linesError) {
      setHasFetched(true);
      fetchProductionLines();
    }
  }, []); // Empty deps - only run once on mount

  return {
    productionLines,
    loading: linesLoading,
    error: linesError,
    refetch: fetchProductionLines,
  };
}

export function useProductionData(options: UseProductionDataOptions) {
  const [data, setData] = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render counter như stock charts
  
  // Zustand store integration
  const updateProductionData = useProductionStore((state) => state.updateData);
  const forceRefresh = useProductionStore((state) => state.forceRefresh);
  
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Separate useEffect to update Zustand store (avoid setState in render)
  useEffect(() => {
    if (!data?.summary) return;
    
    // Debounce store updates to reduce re-renders
    const timeoutId = setTimeout(() => {
      // Update Zustand store với chuẩn mapping A-AS
      updateProductionData({
        maChuyenLine: data.summary.maChuyenLine || '',
        nhaMay: data.summary.nhaMay || '',
        line: data.summary.line || '',
        to: data.summary.to || '',
        maHang: data.summary.maHang || '',
        slth: data.summary.slth || 0,
        lkth: data.summary.lkth || 0,
        lkkh: data.summary.lkkh || 0,
        targetNgay: data.summary.targetNgay || 0,
        bqTargetGio: data.summary.bqTargetGio || 0,
        targetGio: data.summary.targetGio || 0,
        phanTramHt: data.summary.phanTramHt || 0,
        phanTramHtPph: data.summary.phanTramHtPph || 0,
        pphKh: data.summary.pphKh || 0,
        pphTh: data.summary.pphTh || 0,
        pphThNew: data.summary.pphThNew || 0, // TEST field
        tongKiem: data.summary.tongKiem || 0,
        tongDat: data.summary.tongDat || 0,
        tongLoi: data.summary.tongLoi || 0,
        ldLayout: data.summary.ldLayout || 0,
        ldCoMat: data.summary.ldCoMat || 0,
       

        thoigianlamviec: data.summary.thoigianlamviec || 0,
        tongKiemNew: data.summary.tongKiemNew || 0,
        tongDatNew: data.summary.tongDatNew || 0,
        tongLoiNew: data.summary.tongLoiNew || 0,


        lktuiloiNew: data.summary.lktuiloiNew || 0,
        percentagePPHNew: data.summary.percentagePPHNew || 0,
        percentageSLTHNew: data.summary.percentageSLTHNew || 0,
        diffPercentagePPHNew: data.summary.diffPercentagePPHNew || 0,
        diffPercentageSLTHNew: data.summary.diffPercentageSLTHNew || 0,

        hourlyData: data.summary.hourlyData,
        lean: data.summary.lean || '',
        phanTram100: data.summary.phanTram100 || 0,
        t: data.summary.t || 0,
        l: data.summary.l || 0,
        image: data.summary.image || '',
        slcl: data.summary.slcl || 0,
        rft: data.summary.rft || 0,

        lktuiloi: data.summary.lktuiloi || 0,
        nhipsx: data.summary.nhipsx || 0,
        tansuat: data.summary.tansuat || 0,
        tyleloi: data.summary.tyleloi || 0,
        QCTarget: data.summary.QCTarget || 0,


        diffLdCoMatLayout: data.summary.diffLdCoMatLayout || 0,
        diffLkthTarget: data.summary.diffLkthTarget || 0,
        diffRftTarget: data.summary.diffRftTarget || 0,
        diffBqTargetSlcl: data.summary.diffBqTargetSlcl || 0,
        ratioPphThKh: data.summary.ratioPphThKh || 0,
        ratioPphThKhNew: data.summary.ratioPphThKhNew || 0,
        diffPhanTramHt100: data.summary.diffPhanTramHt100 || 0,
        diffPhanTramHtPph100: data.summary.diffPhanTramHtPph100 || 0,
        actual_quantity: data.summary.actual_quantity || data.summary.slth || 0,
        targetDay: data.summary.targetDay || data.summary.targetNgay || 0,
      });
    }, 100); // Debounce 100ms
    
    return () => clearTimeout(timeoutId);
  }, [
    data?.lastUpdate,
    updateProductionData
  ]);

  // Real-time update handler - Server-confirmed data only
  const handleRealtimeUpdate = useCallback((updateData: any) => {
   
    
    // Verify this is legitimate server data (not test data)
    if (updateData._testUpdate || !updateData.timestamp) {
      console.warn('⚠️ Ignored test/invalid update');
      return;
    }
    
    // Force update counter để trigger re-render với server data
    setForceUpdate(prev => prev + 1);
    
    setData(prevData => {
      if (!prevData) {
        return prevData;
      }

      // Handle different socket message types
      if (updateData.message === 'Subscription confirmed') {
        return prevData;
      }

      // Real-time production update - check multiple possible data structures
      let newRecord = null;
      
      // Case 1: updateData.data.data (nested structure)
      if (updateData.data?.data) {
        newRecord = updateData.data.data;
      }
      // Case 2: updateData.data (direct data)
      else if (updateData.data && updateData.data.maChuyenLine) {
        newRecord = updateData.data;
      }
      // Case 3: Direct record
      else if (updateData.maChuyenLine) {
        newRecord = updateData;
      }
      
      // if (!newRecord) {
      //   console.log('⚠️ useProductionData: No newRecord found in any case');
      // }

      if (newRecord) {
        
        // Force complete re-render with new data - merge ALL fields from newRecord
        const newData: ProductionData = {
          maChuyenLine: prevData.maChuyenLine,
          factory: prevData.factory,
          data: [newRecord],
          summary: {
            ...prevData.summary,
            ...newRecord, // ✅ Merge ALL fields from newRecord first
            // Then override specific fields if needed
            maChuyenLine: newRecord.maChuyenLine || prevData.summary.maChuyenLine,
            nhaMay: newRecord.nhaMay || prevData.summary.nhaMay,
            slth: newRecord.slth || newRecord.actual_quantity || 0,
            lkth: newRecord.lkth || newRecord.slth || 0,
            _lastUpdate: Date.now(),
            _renderKey: Date.now(),
          } as StoreProductionData,
          lastUpdate: new Date().toISOString(),
        };
        
        // 🔥 CRITICAL: Update store to trigger flash effect - use the fully merged summary
        useProductionStore.setState({
          data: newData.summary,
        });

        return newData;
      }

      return prevData;
    });
  }, []);

  // Fetch initial data - tối ưu cho TV display
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response: any;
      
      if (optionsRef.current.maChuyenLine) {
       
        
        response = await apiService.getTVDisplayData(
          optionsRef.current.maChuyenLine || '',
          optionsRef.current.factory,
          optionsRef.current.index
        );
        
        
        if (response.success && response.data) {

          // TV endpoint trả về structure khác
          const productionData: any = {
            maChuyenLine: response.data.maChuyenLine || optionsRef.current.maChuyenLine || '',
            factory: response.data.nhaMay || '',
            data: [response.data], // TV endpoint trả về single record
            summary: {
              // Thông tin cơ bản (A-E) - Map directly from response.data
              maChuyenLine: response.data.maChuyenLine || '',
              nhaMay: response.data.nhaMay || '',
              line: response.data.line || '',
              to: response.data.to || '',
              maHang: response.data.maHang || '',

              // Sản lượng và công việc (F-L) - Check both metrics and direct data
              slth: response.data.metrics?.slth || response.data.slth || 0,
              congKh: response.data.metrics?.congKh || response.data.congKh || 0,
              congTh: response.data.metrics?.congTh || response.data.congTh || 0,
              pphKh: response.data.metrics?.pphKh || response.data.pphKh || 0,
              pphTh: response.data.metrics?.pphTh || response.data.pphTh || 0,
              phanTramHtPph: response.data.metrics?.phanTramHtPph || response.data.phanTramHtPph || 0,
              gioSx: response.data.metrics?.gioSx || response.data.gioSx || 0,
              pphThNew: response.data.metrics?.pphThNew || response.data.pphThNew || 0, // TEST field

              // Nhân lực (M-P)
              ldCoMat: response.data.metrics?.ldCoMat || response.data.ldCoMat || 0,
              ldLayout: response.data.metrics?.ldLayout || response.data.ldLayout || 0,
              ldHienCo: response.data.metrics?.ldHienCo || response.data.ldHienCo || 0,
              nangSuat: response.data.metrics?.nangSuat || response.data.nangSuat || 0,

              // PPH và Target (Q-W)
              pphTarget: response.data.metrics?.pphTarget || response.data.pphTarget || 0,
              pphGiao: response.data.metrics?.pphGiao || response.data.pphGiao || 0,
              phanTramGiao: response.data.metrics?.phanTramGiao || response.data.phanTramGiao || 0,
              targetNgay: response.data.metrics?.targetNgay || response.data.targetNgay || 0,
              targetGio: response.data.metrics?.targetGio || response.data.targetGio || 0,
              lkth: response.data.metrics?.lkth || response.data.lkth || 0,
              phanTramHt: response.data.metrics?.phanTramHt || response.data.phanTramHt || 0,

              tongDat: response.data.metrics?.tongDat || response.data.tongDat || 0,
              tongLoi: response.data.metrics?.tongLoi || response.data.tongLoi || 0,
              datLan1: response.data.metrics?.datLan1 || response.data.datLan1 || 0,
              tuiChuaTaiChe: response.data.metrics?.tuiChuaTaiChe || response.data.tuiChuaTaiChe || 0,
              tuiChuaTaiCheNew: response.data.metrics?.tuiChuaTaiCheNew || response.data.tuiChuaTaiCheNew || 0,
              loi1: response.data.loi1 || 0,
              loi2: response.data.loi2 || 0,
              loi3: response.data.loi3 || 0,
              loi4: response.data.loi4 || 0,
              loi5: response.data.loi5 || 0,
              loi6: response.data.loi6 || 0,
              loi7: response.data.loi7 || 0,
              loi8: response.data.loi8 || 0,
              loi9: response.data.loi9 || 0,
              loi10: response.data.loi10 || 0,
              loi11: response.data.loi11 || 0,
              loi12: response.data.loi12 || 0,
              loi13: response.data.loi13 || 0,
              loi14: response.data.loi14 || 0,

              thoigianlamviec: response.data.metrics?.thoigianlamviec || response.data.thoigianlamviec || 0,
              tongKiemNew: response.data.metrics?.tongKiemNew || response.data.tongKiemNew || 0,
              tongDatNew: response.data.metrics?.tongDatNew || response.data.tongDatNew || 0,
              tongLoiNew: response.data.metrics?.tongLoiNew || response.data.tongLoiNew || 0,

              lktuiloiNew: response.data.metrics?.lktuiloiNew || response.data.lktuiloiNew || 0,
              percentagePPHNew: response.data.metrics?.percentagePPHNew || response.data.percentagePPHNew || 0,
              percentageSLTHNew: response.data.metrics?.percentageSLTHNew || response.data.percentageSLTHNew || 0,
              diffPercentagePPHNew: response.data.metrics?.diffPercentagePPHNew || response.data.diffPercentagePPHNew || 0,
              diffPercentageSLTHNew: response.data.metrics?.diffPercentageSLTHNew || response.data.diffPercentageSLTHNew || 0,

              // Hourly data object - CRITICAL: Preserve EXACT backend structure
              // Backend ALWAYS returns { hourly: {...}, cumulative: {...}, total: ..., latest: ... }
              // DO NOT create fallback flat object - it will break nested data access!
              hourlyData: response.data.hourlyData || {},

              // Thông tin bổ sung (AI-AM)
              lean: response.data.lean || response.data.metrics?.lean || '',
              phanTram100: response.data.metrics?.phanTram100 || response.data.phanTram100 || 0,
              t: response.data.metrics?.t || response.data.t || 0,
              l: response.data.metrics?.l || response.data.l || 0,
              image: response.data.metrics?.image || response.data.image || '',
              
              // Chỉ số chất lượng (AN-AS)
              lkkh: response.data.metrics?.lkkh || response.data.lkkh || 0,
              bqTargetGio: response.data.metrics?.bqTargetGio || response.data.bqTargetGio || 0,
              slcl: response.data.metrics?.slcl || response.data.slcl || 0,
              rft: response.data.metrics?.rft || response.data.rft || 0,
              tongKiem: response.data.metrics?.tongKiem || response.data.tongKiem || 0,
              mucTieuRft: response.data.metrics?.mucTieuRft || response.data.mucTieuRft || 95,

              // Additional fields (AY-BH)
              lktuiloi: response.data.metrics?.lktuiloi || response.data.lktuiloi || 0,
              nhipsx: response.data.metrics?.nhipsx || response.data.nhipsx || 0,
              tansuat: response.data.metrics?.tansuat || response.data.tansuat || 0,
              tyleloi: response.data.metrics?.tyleloi || response.data.tyleloi || 0,
              QCTarget: response.data.metrics?.QCTarget || response.data.QCTarget || 0,
              
              // Calculated diff fields - Map from both metrics and direct
              diffLdCoMatLayout: response.data.metrics?.diffLdCoMatLayout || response.data.diffLdCoMatLayout || 0,
              diffLkthTarget: response.data.metrics?.diffLkthTarget || response.data.diffLkthTarget || 0,
              diffRftTarget: response.data.metrics?.diffRftTarget || response.data.diffRftTarget || 0,
              diffBqTargetSlcl: response.data.metrics?.diffBqTargetSlcl || response.data.diffBqTargetSlcl || 0,
              ratioPphThKh: response.data.metrics?.ratioPphThKh || response.data.ratioPphThKh || 0,
              ratioPphThKhNew: response.data.metrics?.ratioPphThKhNew || response.data.ratioPphThKhNew || 0,
              diffPhanTramHt100: response.data.metrics?.diffPhanTramHt100 || response.data.diffPhanTramHt100 || 0,
              diffPhanTramHtPph100: response.data.metrics?.diffPhanTramHtPph100 || response.data.diffPhanTramHtPph100 || 0,

              // Compatibility fields
              actual_quantity: response.data.metrics?.slth || response.data.slth || 0,
              targetDay: response.data.metrics?.targetNgay || response.data.targetNgay || 0,

              // Metadata
              _lastUpdate: Date.now(),
              _renderKey: Date.now()
            },
            lastUpdate: response.data.lastUpdate || new Date().toISOString(),
          };

          setData(productionData);
          return;
        }
      }
      
      // Fallback về production endpoint
      const query = {
        maChuyenLine: optionsRef.current.maChuyenLine,
        factory: optionsRef.current.factory,
        line: optionsRef.current.line,
        team: optionsRef.current.team,
        _t: Date.now(), // Cache busting timestamp
      };
      
      response = await apiService.getProductionData(query) as any;

      
      if (response.success && response.data) {
        // Ensure data has required fields for ProductionData interface
        const productionData: ProductionData = {
          maChuyenLine: response.data.maChuyenLine || options.maChuyenLine || '',
          factory: response.data.factory || options.factory || '',
          data: response.data.data || [],
          summary: response.data.summary || null,
          lastUpdate: response.data.lastUpdate || new Date().toISOString(),
        };
        setData(productionData);
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch production data:', err);
    } finally {
      setLoading(false);
    }
  }, [updateProductionData]);

  const handleSystemUpdate = useCallback((updateData: any) => {
    if (updateData.type === 'data-refresh' && updateData.data?.changesCount > 0) {
      // Clear any existing data first
      setData(null);
      setLoading(true);
      
      // Force fetch with cache bypass
      setTimeout(() => {
        fetchInitialData();
        setForceUpdate(prev => prev + 1);
      }, 100);
    }
  }, [fetchInitialData]);

  // Setup WebSocket subscriptions
  useEffect(() => {
    if (!options.enableRealtime) {
      fetchInitialData();
      return;
    }

    // Subscribe based on available options
    if (options.maChuyenLine) {
      // Parse index to number if string
      const indexNum = options.index !== undefined ? parseInt(options.index) : undefined;
      websocketService.subscribeToMaChuyenLine(
        options.maChuyenLine, 
        handleRealtimeUpdate,
        options.factory,
        indexNum
      );
    } else if (options.factory && options.line && options.team) {
      websocketService.subscribeToLineTeam(options.factory, options.line, options.team, handleRealtimeUpdate);
    } else if (options.factory) {
      websocketService.subscribeToFactory(options.factory, handleRealtimeUpdate);
    }

    // Listen for system updates
    websocketService.onSystemUpdate(handleSystemUpdate);

    // Monitor connection status changes
    websocketService.onConnectionStatusChange(setConnected);
    
    // Set initial connection status
    setConnected(websocketService.isConnected());

    // Listen for test updates from test button
    const handleTestUpdate = (event: any) => {
      handleRealtimeUpdate(event.detail);
    };
    
    window.addEventListener('production-update', handleTestUpdate);

    // Fetch initial data
    fetchInitialData();

    // Setup auto-refresh cho TV mode - ⚠️ CRITICAL: 2 phút = 120000ms để sync với backend cron
    if (options.tvMode) {
      autoRefreshService.startAutoRefresh(120000, async () => {
        // Force clear cache và fetch mới
        setData(null);
        setLoading(true);
        await fetchInitialData();
        setForceUpdate(prev => prev + 1);
      });
    }

    // Cleanup subscriptions
    return () => {
      websocketService.unsubscribe(handleRealtimeUpdate);
      websocketService.unsubscribe(handleSystemUpdate);
      window.removeEventListener('production-update', handleTestUpdate);
      
      // Stop auto-refresh khi cleanup
      if (options.tvMode) {
        autoRefreshService.stop();
      }
    };
  }, [
    options.maChuyenLine,
    options.factory,
    options.line,
    options.team,
    options.enableRealtime,
    options.tvMode,
    handleRealtimeUpdate,
    handleSystemUpdate,
  ]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);
  // ⭐ OPTIMIZATION: Disable auto-refresh when WebSocket is connected
  // WebSocket provides real-time updates every 30s via cron
  // Auto-refresh only serves as fallback when WebSocket disconnects
  useEffect(() => {
    if (!options.tvMode) return;

    if (connected) {
      // WebSocket connected - disable auto-refresh to save quota
      autoRefreshService.stop();
    } else {
      // WebSocket disconnected - enable auto-refresh as fallback
      autoRefreshService.startAutoRefresh(30000, fetchInitialData);
    }

    return () => {
      autoRefreshService.stop();
    };
  }, [connected, options.tvMode, fetchInitialData]);
  return {
    data,
    loading,
    error,
    connected,
    refresh,
    forceUpdate, // Expose forceUpdate counter for component tracking
  };
}

export default useProductionData;