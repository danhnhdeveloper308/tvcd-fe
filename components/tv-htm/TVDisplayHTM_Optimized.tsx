"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { RefreshCw, ChevronDown } from "lucide-react"
import { useProductionData } from "@/hooks/useProductionData"
import useTime from "@/hooks/useTime"
import { getPercentageColor, getPercentageColorForRFT } from "@/lib/utils"
import Image from "next/image"
import UpArrowIcon from "../UpArrowIcon"
import DownArrowIcon from "../DownArrowIcon"

interface TVDisplayHTMProps {
  maChuyenLine?: string
  factory?: string
  line?: string
  team?: string
  index?: string
  refreshInterval?: number
  tvMode?: boolean
}

// 14 data points for timeline
const dataErrors = [
  { label: "KEO", field: "loi1", isCritical: true },
  { label: "LỖ KIM", field: "loi2", isCritical: false },
  { label: "CHỈ", field: "loi3", isCritical: true },
  { label: "DA", field: "loi4", isCritical: true },
  { label: "MÀU VÂN KĐB", field: "loi5", isCritical: true },
  { label: "HW", field: "loi6", isCritical: true },
  { label: "DK GỢN SÓNG", field: "loi7", isCritical: true },
  { label: "SƠN", field: "loi8", isCritical: true },
  { label: "CHI TIẾT NHĂN", field: "loi9", isCritical: true },
  { label: "LOGO", field: "loi10", isCritical: true },
  { label: "ÉP MỜ", field: "loi11", isCritical: true },
  { label: "CHI TIẾT KTH", field: "loi12", isCritical: true },
  { label: "DÁNG", field: "loi13", isCritical: true },
  { label: "KHÁC", field: "loi14", isCritical: false },
]

export default function TVDisplayHTM({
  maChuyenLine,
  factory,
  line,
  team,
  index,
  refreshInterval = 30000,
  tvMode = false,
}: TVDisplayHTMProps) {
  const { minutes, hours } = useTime({})
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

  const { data, loading, error, connected, refresh } = useProductionData({
    maChuyenLine,
    factory,
    line,
    team,
    index,
    enableRealtime: true,
    tvMode,
  })

  // ⚠️ AUTO RELOAD after 8:00 AM to switch ENDLINE sheet - ONE TIME ONLY
  const [hasReloadedAfter830, setHasReloadedAfter830] = useState(() => {
    // Check localStorage để tránh reload lại nếu đã reload trong ngày
    // ⚠️ CRITICAL: Check if running on client-side (localStorage only available in browser)
    if (typeof window === 'undefined') return false;
    
    const today = new Date().toDateString();
    const lastReloadDate = localStorage.getItem('lastReloadDate');
    return lastReloadDate === today;
  });
  
  const [isReloading, setIsReloading] = useState(false);
  
  useEffect(() => {
    // ⚠️ CRITICAL: Only run on client-side
    if (typeof window === 'undefined') return;
    
    const currentTimeInMinutes = hours * 60 + minutes;
    // const cutoffTime = 8 * 60 + 30; // 8:30 AM = 510 minutes
    const cutoffTime = 8 * 60; // 8:00 AM = 480 minutes
    const today = new Date().toDateString();
    const lastReloadDate = localStorage.getItem('lastReloadDate');
    
    // Reset flag vào 00:00 (midnight) cho ngày mới
    if (currentTimeInMinutes < 30 && lastReloadDate !== today) {
      // Ngày mới, reset flag
      localStorage.removeItem('lastReloadDate');
      setHasReloadedAfter830(false);
    }
    
    // Chỉ reload MỘT LẦN khi qua 8:30 và chưa reload trong ngày hôm nay
    if (currentTimeInMinutes >= cutoffTime && !hasReloadedAfter830 && lastReloadDate !== today && !isReloading) {
      console.log(`⏰ Time is ${formattedTime} - Auto reloading to switch ENDLINE sheet (ONE TIME ONLY)`);
      setIsReloading(true);
      setHasReloadedAfter830(true);
      
      // Lưu flag vào localStorage
      localStorage.setItem('lastReloadDate', today);
      
      // Force reload sau 2 giây
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [hours, minutes]); // ⚠️ REMOVED hasReloadedAfter830 from deps to prevent infinite loop

  // Show reload message ONLY when actually reloading
  if (isReloading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-white text-2xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          Switching to daily ENDLINE sheet... Reloading in 2s
        </div>
      </div>
    );
  }

  // ✅ OPTIMIZATION: Process data once với useMemo
  const displayData = useMemo(() => {
    if (!data || !data.summary) return null;

    const summary = data.summary;

    return {
      // Basic info
      nhaMay: summary.nhaMay || '',
      line: summary.line || '',
      to: summary.to || '',
      maHang: summary.maHang || '',
      image: summary.image || '',

      // Production metrics
      thoigianlamviec: summary.thoigianlamviec || 0,
      ldLayout: summary.ldLayout || 0,
      ldCoMat: summary.ldCoMat || 0,
      diffLdCoMatLayout: summary.diffLdCoMatLayout || 0,

      slth: summary.slth || 0,
      targetNgay: summary.targetNgay || 0,
      lkkh: summary.lkkh || 0,
      lkth: summary.lkth || 0,
      phanTramHt: summary.phanTramHt || 0,
      diffLkthTarget: summary.diffLkthTarget || 0,
      diffPhanTramHt100: summary.diffPhanTramHt100 || 0,

      targetGio: summary.targetGio || 0,
      pphKh: summary.pphKh || 0,
      pphTh: summary.pphTh || 0,
      phanTramHtPph: summary.phanTramHtPph || 0,
      ratioPphThKh: summary.ratioPphThKh || 0,
      diffPhanTramHtPph100: summary.diffPhanTramHtPph100 || 0,

      // QC metrics
      tongKiem: summary.tongKiem || 0,
      datLan1: summary.datLan1 || 0,
      tongDat: summary.tongDat || 0,
      tongLoi: summary.tongLoi || 0,
      rft: summary.rft || 0,
      diffRftTarget: summary.diffRftTarget || 0,

      // Error fields from root level (for reference, but we use hourly slot data for display)
      loi1: (summary as any).loi1 || 0,
      loi2: (summary as any).loi2 || 0,
      loi3: (summary as any).loi3 || 0,
      loi4: (summary as any).loi4 || 0,
      loi5: (summary as any).loi5 || 0,
      loi6: (summary as any).loi6 || 0,
      loi7: (summary as any).loi7 || 0,
      loi8: (summary as any).loi8 || 0,
      loi9: (summary as any).loi9 || 0,
      loi10: (summary as any).loi10 || 0,
      loi11: (summary as any).loi11 || 0,
      loi12: (summary as any).loi12 || 0,
      loi13: (summary as any).loi13 || 0,
      loi14: (summary as any).loi14 || 0,

      // Hourly data
      hourlyData: summary.hourlyData || {},
    };
  }, [data?.lastUpdate]); // Only recompute when lastUpdate changes

  // ✅ FLASH DETECTION LOGIC (CD Pattern)
  const [flashingCells, setFlashingCells] = useState<Set<string>>(new Set());
  const prevDataRef = useRef<any>(null);

  useEffect(() => {
    if (!displayData) return;

    if (!prevDataRef.current) {
      prevDataRef.current = displayData;
      return;
    }

    const prev = prevDataRef.current;
    const curr = displayData;
    const newFlashing = new Set<string>();

    const check = (key: string, val1: any, val2: any) => {
      if (val1 !== val2) {
        newFlashing.add(key);
      }
    };

    // Check all production fields
    check('thoigianlamviec', prev.thoigianlamviec, curr.thoigianlamviec);
    check('ldLayout', prev.ldLayout, curr.ldLayout);
    check('ldCoMat', prev.ldCoMat, curr.ldCoMat);
    check('maHang', prev.maHang, curr.maHang);

    check('targetNgay', prev.targetNgay, curr.targetNgay);
    check('lkkh', prev.lkkh, curr.lkkh);
    check('lkth', prev.lkth, curr.lkth);
    check('phanTramHt', prev.phanTramHt, curr.phanTramHt);
    check('diffLkthTarget', prev.diffLkthTarget, curr.diffLkthTarget);
    check('diffPhanTramHt100', prev.diffPhanTramHt100, curr.diffPhanTramHt100);

    check('targetGio', prev.targetGio, curr.targetGio);
    check('pphKh', prev.pphKh, curr.pphKh);
    check('pphTh', prev.pphTh, curr.pphTh);
    check('phanTramHtPph', prev.phanTramHtPph, curr.phanTramHtPph);
    check('ratioPphThKh', prev.ratioPphThKh, curr.ratioPphThKh);
    check('diffPhanTramHtPph100', prev.diffPhanTramHtPph100, curr.diffPhanTramHtPph100);

    check('tongKiem', prev.tongKiem, curr.tongKiem);
    check('datLan1', prev.datLan1, curr.datLan1);
    check('tongDat', prev.tongDat, curr.tongDat);
    check('tongLoi', prev.tongLoi, curr.tongLoi);
    check('rft', prev.rft, curr.rft);
    check('diffRftTarget', prev.diffRftTarget, curr.diffRftTarget);

    // Note: loi1-14 are not at root level, they're in hourly slots
    // Flash detection for errors happens via currentErrors changes

    // Check hourly data
    const timeSlots = ['h830', 'h930', 'h1030', 'h1130', 'h1330', 'h1430', 'h1530', 'h1630', 'h1800', 'h1900', 'h2000'];
    timeSlots.forEach(slot => {
      const prevSlot = (prev.hourlyData as any)?.[slot];
      const currSlot = (curr.hourlyData as any)?.[slot];

      if (prevSlot && currSlot) {
        check(`hourly-${slot}-sanluong`, prevSlot.sanluong, currSlot.sanluong);
        check(`hourly-${slot}-percentage`, prevSlot.percentage, currSlot.percentage);
      }
    });

    if (newFlashing.size > 0) {
      setFlashingCells(newFlashing);
      setTimeout(() => setFlashingCells(new Set()), 2000);
    }

    prevDataRef.current = curr;
  }, [displayData]);

  // ✅ HELPER FUNCTIONS
  const getFlashClass = (key: string, baseClass: string = "") => {
    return flashingCells.has(key)
      ? `animate-flash-yellow ${baseClass}`
      : `transition-colors duration-500 ${baseClass}`;
  };

  const formatNumber = (num: number | string): string => {
    if (num === "" || num === null || num === undefined) return "0";
    return Number(num).toLocaleString("de-DE");
  };

  const formatPercentage = (num: number, decimals: number = 0): string => {
    if (typeof num !== 'number') return "0";
    return parseFloat(num.toFixed(decimals)).toString();
  };

  // Get current errors from hourly data
  const getCurrentErrors = useCallback(() => {
    if (!displayData?.hourlyData) return null;

    const timeSlots = ['h2000', 'h1900', 'h1800', 'h1630', 'h1530', 'h1430', 'h1330', 'h1130', 'h1030', 'h930', 'h830'];

    for (const timeSlot of timeSlots) {
      const slotData = (displayData.hourlyData as any)?.[timeSlot];
      if (slotData && typeof slotData === 'object' && 'loi1' in slotData) {
        return {
          tongDat: slotData.tongDat || 0,
          datLan1: slotData.datLan1 || 0,
          tuiChuaTaiChe: slotData.tuiChuaTaiChe || 0,
          loi1: slotData.loi1 || 0,
          loi2: slotData.loi2 || 0,
          loi3: slotData.loi3 || 0,
          loi4: slotData.loi4 || 0,
          loi5: slotData.loi5 || 0,
          loi6: slotData.loi6 || 0,
          loi7: slotData.loi7 || 0,
          loi8: slotData.loi8 || 0,
          loi9: slotData.loi9 || 0,
          loi10: slotData.loi10 || 0,
          loi11: slotData.loi11 || 0,
          loi12: slotData.loi12 || 0,
          loi13: slotData.loi13 || 0,
          loi14: slotData.loi14 || 0,
          errorpercentage1: slotData.errorpercentage1 || 0,
          errorpercentage2: slotData.errorpercentage2 || 0,
          errorpercentage3: slotData.errorpercentage3 || 0,
          errorpercentage4: slotData.errorpercentage4 || 0,
          errorpercentage5: slotData.errorpercentage5 || 0,
          errorpercentage6: slotData.errorpercentage6 || 0,
          errorpercentage7: slotData.errorpercentage7 || 0,
          errorpercentage8: slotData.errorpercentage8 || 0,
          errorpercentage9: slotData.errorpercentage9 || 0,
          errorpercentage10: slotData.errorpercentage10 || 0,
          errorpercentage11: slotData.errorpercentage11 || 0,
          errorpercentage12: slotData.errorpercentage12 || 0,
          errorpercentage13: slotData.errorpercentage13 || 0,
          errorpercentage14: slotData.errorpercentage14 || 0,
        };
      }
    }
    return null;
  }, [displayData?.hourlyData]);

  const currentErrors = useMemo(() => getCurrentErrors(), [displayData?.hourlyData]);
  const currentDatLan1 = currentErrors?.datLan1 || 0;
  const currentTuiChuaTaiChe = currentErrors?.tuiChuaTaiChe || 0;
  const taichedat = (displayData?.tongDat || 0) - currentDatLan1;
  const tuiChosua = (displayData?.tongLoi || 0) - taichedat;

  // Check if has errors - check from currentErrors (hourly data)
  const hasErrors = currentErrors ? dataErrors.some(e => (currentErrors as any)[e.field] > 0) : false;

  // Get duLieu from latest hourly slot
  const getDuLieu = useCallback(() => {
    if (!displayData?.hourlyData) return null;

    const timeSlots = ['h2000', 'h1900', 'h1800', 'h1630', 'h1530', 'h1430', 'h1330', 'h1130', 'h1030', 'h930', 'h830'];

    for (const timeSlot of timeSlots) {
      const slotData = (displayData.hourlyData as any)?.[timeSlot];
      if (slotData && typeof slotData === 'object' && 'duLieu' in slotData) {
        return slotData.duLieu;
      }
    }
    return null;
  }, [displayData?.hourlyData]);

  // Check duLieu logic and return warning message
  const getDataWarning = useMemo(() => {
    if (!displayData) return null;

    const duLieu = getDuLieu();
    const lkth = displayData.lkth || 0;
    const tongDat = displayData.tongDat || 0;

    // TH1: duLieu === "ĐỦ" && lkth > tongDat => "SAI LOGIC"
    if (duLieu === "ĐỦ" && lkth > tongDat) {
      return "SAI LOGIC";
    }

    // TH2: duLieu === "THIẾU" && lkth > tongDat => "QA CHƯA UP DATA"
    if (duLieu === "THIẾU" && lkth > tongDat) {
      return "QA CHƯA UP DATA";
    }

    return null;
  }, [displayData?.lkth, displayData?.tongDat, displayData?.hourlyData]);

  // Get optimized error list - Sort by count (high to low)
  const getOptimizedErrorList = () => {
    if (!displayData || !currentErrors) return [];

    return dataErrors.map((errorItem, index) => ({
      ...errorItem,
      count: (currentErrors as any)[errorItem.field] || 0,
      percentage: (currentErrors as any)[`errorpercentage${index + 1}`] || 0,
    })).sort((a, b) => b.count - a.count); // Sort by count descending
  };

  // Check if we should display value for a time slot
  const shouldDisplaySlotValue = (timeSlot: string): boolean => {
    if (!displayData?.hourlyData) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;

    const timeSlotMap: { [key: string]: number } = {
      "h830": 8 * 60 + 30, "h930": 9 * 60 + 30, "h1030": 10 * 60 + 30,
      "h1130": 11 * 60 + 30, "h1330": 13 * 60 + 30, "h1430": 14 * 60 + 30,
      "h1530": 15 * 60 + 30, "h1630": 16 * 60 + 30, "h1800": 18 * 60,
      "h1900": 19 * 60, "h2000": 20 * 60,
    };

    // Check if current time is before 8:30 AM (overnight data scenario)
    const isBeforeWorkStart = currentMinutes < timeSlotMap["h830"];

    if (isBeforeWorkStart) {
      // Check if we have data from yesterday (any slot has sanluong > 0)
      const hasYesterdayData = Object.keys(timeSlotMap).some(slot => {
        const slotData = (displayData.hourlyData as any)?.[slot];
        return slotData && slotData.sanluong > 0;
      });

      if (hasYesterdayData) {
        // For yesterday's data, show all slots that have sanluong > 0
        const slotData = (displayData.hourlyData as any)?.[timeSlot];
        return slotData && slotData.sanluong > 0;
      }
    }

    // Normal case: only show slots that have passed
    const slotMinutes = timeSlotMap[timeSlot];
    return slotMinutes !== undefined && currentMinutes >= slotMinutes;
  };

  // Check if time slot has passed (for color logic)
  const hasTimeSlotPassed = (timeSlot: string): boolean => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const timeSlotMap: { [key: string]: number } = {
      "h830": 8 * 60 + 30, "h930": 9 * 60 + 30, "h1030": 10 * 60 + 30,
      "h1130": 11 * 60 + 30, "h1330": 13 * 60 + 30, "h1430": 14 * 60 + 30,
      "h1530": 15 * 60 + 30, "h1630": 16 * 60 + 30, "h1800": 18 * 60,
      "h1900": 19 * 60, "h2000": 20 * 60,
    };
    const slotMinutes = timeSlotMap[timeSlot];
    return slotMinutes !== undefined && currentMinutes >= slotMinutes;
  };

  // Get hourly target color
  const getHourlyTargetColor = (timeSlot: string) => {
    const slotData = (displayData?.hourlyData as any)?.[timeSlot];
    if (!slotData) return { bgColor: "bg-slate-900/50", textColor: "text-white" };

    const percentage = slotData.percentage || 0;
    const colorScheme = getPercentageColor(percentage);
    return { bgColor: colorScheme.bgColor, textColor: colorScheme.textColor };
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    }
    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [])

  useEffect(() => {
    if (!connected && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [connected, refresh, refreshInterval])

  if (loading && !displayData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-white text-2xl flex items-center gap-3">
          <RefreshCw className="animate-spin" size={32} />
          Đang tải dữ liệu real-time...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Lỗi kết nối</h2>
          <p className="text-xl mb-6">{error}</p>
          <button onClick={refresh} className="bg-white text-red-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (!displayData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Không có dữ liệu</div>
      </div>
    )
  }

  const hasDiffLayoutCoMat = displayData.diffLdCoMatLayout !== 0;

  return (
    <div
      className="h-screen w-screen text-white font-bold overflow-hidden tv-container grid relative"
      style={{
        gridTemplateRows: "clamp(120px, 17vh, 175px) 1fr",
        gap: "0.5rem",
        margin: 0,
      }}
    >
      {/* Data Warning Overlay - Absolute positioned in center */}
      {getDataWarning && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div 
            className="animate-pulse bg-yellow-400 text-red-600 font-black px-12 py-6 rounded-xl border-4 border-red-600 shadow-2xl pointer-events-auto"
            style={{ 
              fontSize: "clamp(1.5rem, 3vw, 4.5rem)",
              animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              boxShadow: "0 0 50px rgba(239, 68, 68, 0.5), 0 0 100px rgba(251, 191, 36, 0.3)"
            }}
          >
            ⚠️ {getDataWarning} ⚠️
          </div>
        </div>
      )}

      {/* Modern Header */}
      <div className="tv-header glass-header flex-shrink-0 z-20" style={{ height: '100%' }}>
        <div className="grid gap-2 h-full items-center px-2 grid-cols-12" style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
          {/* Logo Section */}
          <div className="col-span-1 h-full w-full flex flex-col items-center justify-between py-2 min-w-0">
            <div className="flex flex-row justify-center items-center gap-0.5">
              <button
                className="relative bg-white/95 rounded backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-200 cursor-pointer group"
                style={{ width: "clamp(2.2rem, 4vw, 4.4rem)", height: "clamp(2.2rem, 4vw, 4.4rem)", aspectRatio: "1" }}
                title="Chọn Line Sản Xuất"
              >
                <img src="/coach.png" alt="COACH Logo" className="w-full h-full object-contain filter drop-shadow-xl group-hover:drop-shadow-2xl transition-all" loading="eager" />
                <ChevronDown size={12} className="absolute -bottom-1 -right-1 text-blue-600 bg-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="relative bg-white/95 rounded backdrop-blur-sm shadow-lg flex items-center justify-center"
                style={{ width: "clamp(2.2rem, 4vw, 4.4rem)", height: "clamp(2.2rem, 4vw, 4.4rem)", aspectRatio: "1" }}>
                <img src="/logo.png" alt="TBS GROUP Logo" className="w-full h-full object-contain filter drop-shadow-xl" loading="eager" />
              </div>
            </div>
            <div className="text-center px-2 py-1">
              <div style={{ fontSize: "clamp(1.8rem,2.8vw,3rem)" }} className="font-black text-white leading-none" suppressHydrationWarning={true}>
                {formattedTime}
              </div>
            </div>
          </div>

          {/* Production Metrics */}
          <div className="col-span-11 h-full flex items-center justify-center min-w-0 overflow-hidden">
            <div className={'grid ' + (hasDiffLayoutCoMat ? 'grid-cols-10' : 'grid-cols-9') + ' w-full gap-2 items-center h-full min-w-0'}
              style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>

              {/* TGLV */}
              <div className="flex flex-col items-center justify-center h-full min-w-0 col-span-[80px]">
                <div className="text-white font-black mb-1" style={{ fontSize: "clamp(1.0rem,1.8vw,1.5rem)" }}>TGLV</div>
                <div className={getFlashClass('thoigianlamviec', "font-black rounded px-2 metric-card-group1 flex items-center justify-center w-full max-w-[80px]")}
                  style={{ fontSize: "clamp(1.8rem,3vw,3.2rem)" }}>
                  {formatNumber(displayData.thoigianlamviec)}
                </div>
              </div>

              {/* Factory/Line/Team */}
              <div className="w-full col-span-3 -ml-4 mt-5" style={{ fontSize: "clamp(2.0rem,3.5vw,4.2rem)" }}>
                <div className="flex items-center justify-between gap-2 metric-card-violet py-1 px-2 w-full">
                  <div className={getFlashClass('nhaMay', "text-white font-black")}>{displayData.nhaMay}</div>
                  <div className={getFlashClass('line', "text-white font-black")}>{displayData.line}</div>
                  <div className={getFlashClass('to', "text-white font-black")}>{displayData.to}</div>
                </div>
              </div>

              {/* Layout */}
              <div className="px-2 py-1 text-center flex flex-col justify-center items-center h-full min-w-0 col-span-1" style={{ minWidth: 0 }}>
                <div className="text-white font-black mb-1" style={{ fontSize: "clamp(1.0rem,1.8vw,1.5rem)" }}>LAYOUT</div>
                <div className={getFlashClass('ldLayout', "font-black text-white rounded px-2 py-1 metric-card-violet flex items-center justify-center w-full")}
                  style={{ fontSize: "clamp(1.8rem,3vw,3.2rem)" }}>
                  {formatNumber(displayData.ldLayout)}
                </div>
              </div>

              {/* Có mặt */}
              <div className={'py-1 text-center flex flex-col justify-center items-center h-full min-w-0 ' + (hasDiffLayoutCoMat ? 'col-span-2' : 'col-span-1 px-2')}
                style={{ minWidth: 0 }}>
                <div className="text-white font-black mb-1" style={{ fontSize: "clamp(1.0rem,1.8vw,1.5rem)" }}>CÓ MẶT</div>
                <div className={`relative font-black text-white flex items-center justify-center rounded px-4 py-1 metric-card-violet w-full`}
                  style={{ fontSize: "clamp(1.8rem,3vw,3.2rem)" }}>
                  <span className={getFlashClass('ldCoMat', "text-center")}>{formatNumber(displayData.ldCoMat)}</span>
                  {hasDiffLayoutCoMat && (
                    <div className="absolute right-2">
                      <div className={getFlashClass('diffLdCoMatLayout', "flex items-center justify-center rounded-sm bg-gradient-to-tr from-[#090013] via-[#140028] to-[#1a0038] text-white font-semibold px-2 py-1 border border-[#c084fc] shadow-[0_0_15px_4px_rgba(192,132,252,0.8),0_0_6px_2px_rgba(255,255,255,0.1)]")}
                        style={{ fontSize: "clamp(1.6rem,2.8vw,3rem)" }}>
                        {displayData.diffLdCoMatLayout > 0 ? `+${formatNumber(displayData.diffLdCoMatLayout)}` : formatNumber(displayData.diffLdCoMatLayout)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mã hàng */}
              <div className="px-2 py-1 text-center flex flex-col justify-center h-full min-w-0 col-span-2" style={{ minWidth: 0 }}>
                <div className="font-black mb-1 text-transparent" style={{ fontSize: "clamp(0.8rem,1.5vw,1.4rem)" }}>TĂNG CA</div>
                <div className={getFlashClass('maHang', "font-black text-white metric-card-violet rounded px-1 py-1 overflow-hidden min-w-0 flex items-center justify-center")}
                  style={{ fontSize: "clamp(1.8rem,3vw,3.2rem)" }}>
                  <div className="truncate w-full text-center">{displayData.maHang}</div>
                </div>
              </div>

              {/* Image */}
              <div className="p-0 text-center flex flex-col justify-center items-center h-full min-w-[80px] w-full overflow-hidden col-span-1" style={{ minWidth: 0 }}>
                {displayData.image && displayData.image !== "" && (
                  <div className="flex items-center justify-center metric-card-violet p-1 backdrop-blur-sm shadow-xl w-full h-full"
                    style={{ overflow: "hidden", maxWidth: "100%", maxHeight: "100%", aspectRatio: "1" }}>
                    <Image
                      src={displayData.image !== "#N/A" ? displayData.image : "/window.svg"}
                      alt="COACH"
                      className="object-cover rounded-md"
                      width={120}
                      height={120}
                      priority
                      quality={75}
                      style={{ width: "100%", height: "100%", maxWidth: "clamp(4rem, 8vw, 7.5rem)", maxHeight: "clamp(4rem, 8vw, 7.5rem)", objectFit: "cover", flexShrink: 0 }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        const parent = target.parentElement
                        if (parent) {
                          parent.className = "flex items-center justify-center bg-gray-800/80 border-2 border-cyan-400/50 w-full h-full rounded-lg px-2 py-1"
                          parent.innerHTML = '<span class="text-cyan-300 text-sm font-bold">COACH</span>'
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`tv-main flex-grow flex flex-col p-1 overflow-hidden ${!hasErrors ? 'mt-2' : 'mt-1 gap-1'}`}>
        {/* Combined Group - Row 1 & 2 */}
        <div className={`grid grid-cols-3 ${hasErrors ? 'flex-1' : 'flex-grow'} ${!hasErrors ? 'gap-3' : ''}`}>
          {/* Group 1 - Production & Performance (col-span-2) */}
          <div className={`col-span-2 glass-card-group2 border border-blue-400/30 flex flex-col ${hasErrors ? 'px-4 py-2' : 'p-6'}`}>
            <div className="grid grid-cols-4 flex-1 gap-1 border-b border-blue-400/30 pb-2">
              {/* MỤC TIÊU SL NGÀY */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>MỤC TIÊU SL NGÀY</div>
                <div className={getFlashClass('targetNgay', "metric-card-group2 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatNumber(displayData.targetNgay)}
                </div>
              </div>

              {/* LK K.HOẠCH */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>LK K.HOẠCH</div>
                <div className={getFlashClass('lkkh', "metric-card-group2 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatNumber(displayData.lkkh)}
                </div>
              </div>

              {/* LK T.HIỆN */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>LK T.HIỆN</div>
                <div className={getFlashClass('lkth', "metric-card-group2 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatNumber(displayData.lkth)}
                </div>
                <div className="font-black flex items-center justify-center gap-1" style={{ fontSize: "clamp(1rem,2vw,3rem)" }}>
                  <div className={getFlashClass('diffLkthTarget', `flex flex-row items-center justify-center ${displayData.diffLkthTarget > 0 ? 'text-green-400' : displayData.diffLkthTarget < 0 ? 'text-red-500' : ''}`)}>
                    {displayData.diffLkthTarget > 0 && <UpArrowIcon />}
                    {displayData.diffLkthTarget < 0 && <DownArrowIcon />}
                    {formatNumber(Math.abs(displayData.diffLkthTarget))}
                  </div>
                </div>
              </div>

              {/* %HT SLTH */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>%HT SLTH</div>
                <div className={(() => {
                  const colorScheme = getPercentageColor(displayData.phanTramHt);
                  return getFlashClass('phanTramHt', `metric-card-full-color font-black ${colorScheme.bgColor} ${colorScheme.textColor} ${colorScheme.borderColor} border ${colorScheme.shadow} rounded-lg`);
                })()}
                  style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatPercentage(displayData.phanTramHt, 0)}%
                </div>
                <div className="font-black flex items-center justify-center gap-1" style={{ fontSize: "clamp(1rem,2vw,3rem)" }}>
                  <div className={getFlashClass('diffPhanTramHt100', `flex flex-row items-center justify-center ${displayData.diffPhanTramHt100 > 0 ? 'text-green-400' : displayData.diffPhanTramHt100 < 0 ? 'text-red-500' : ''}`)}>
                    {displayData.diffPhanTramHt100 > 0 && <UpArrowIcon />}
                    {displayData.diffPhanTramHt100 < 0 && <DownArrowIcon />}
                    {formatPercentage(Math.abs(displayData.diffPhanTramHt100), 2)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 flex-1">
              {/* MỤC TIÊU SL GIỜ */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>MỤC TIÊU SL GIỜ</div>
                <div className={getFlashClass('targetGio', "metric-card-group2 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatNumber(displayData.targetGio)}
                </div>
              </div>

              {/* PPH MỤC TIÊU */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>PPH MỤC TIÊU</div>
                <div className={getFlashClass('pphKh', "metric-card-group2 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatPercentage(displayData.pphKh, 2)}
                </div>
              </div>

              {/* PPH T.HIỆN */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>PPH T.HIỆN</div>
                <div className={getFlashClass('pphTh', "metric-card-group2 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatPercentage(displayData.pphTh, 2)}
                </div>
                <div style={{ fontSize: "clamp(1rem,2vw,3rem)" }}>
                  <div className={getFlashClass('ratioPphThKh', `flex flex-row items-center justify-center font-black ${displayData.ratioPphThKh > 0 ? 'text-green-400' : displayData.ratioPphThKh < 0 ? 'text-red-500' : ''}`)}>
                    {displayData.ratioPphThKh > 0 && <UpArrowIcon />}
                    {displayData.ratioPphThKh < 0 && <DownArrowIcon />}
                    {formatPercentage(Math.abs(displayData.ratioPphThKh), 2)}
                  </div>
                </div>
              </div>

              {/* %HT PPH */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>%HT PPH</div>
                <div className={(() => {
                  const colorScheme = getPercentageColor(displayData.phanTramHtPph);
                  return getFlashClass('phanTramHtPph', `metric-card-full-color font-black ${colorScheme.bgColor} ${colorScheme.textColor} ${colorScheme.borderColor} border ${colorScheme.shadow} rounded-lg`);
                })()}
                  style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatPercentage(displayData.phanTramHtPph, 0)}%
                </div>
                <div style={{ fontSize: "clamp(1rem,2vw,3rem)" }}>
                  <div className={getFlashClass('diffPhanTramHtPph100', `flex flex-row items-center justify-center font-black ${displayData.diffPhanTramHtPph100 > 0 ? 'text-green-400' : displayData.diffPhanTramHtPph100 < 0 ? 'text-red-500' : ''}`)}>
                    {displayData.diffPhanTramHtPph100 > 0 && <UpArrowIcon />}
                    {displayData.diffPhanTramHtPph100 < 0 && <DownArrowIcon />}
                    {formatPercentage(Math.abs(displayData.diffPhanTramHtPph100), 2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2 - QC Metrics (col-span-1) */}
          <div className={`glass-card-group1 p-2 border border-gray-400/30 flex flex-col ${hasErrors ? 'px-4 py-2' : 'p-8'}`}>
            <div className="grid grid-cols-2 flex-1 gap-1 border-b border-gray-400/30 pb-2">
              {/* LK QC KIỂM */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>LK QC KIỂM</div>
                <div className={getFlashClass('tongKiem', "metric-card-group1 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatNumber(displayData.tongKiem)}
                </div>
                <div className={`font-black flex items-center justify-center ${currentDatLan1 > 0 ? 'text-green-400' : currentDatLan1 < 0 ? 'text-red-500' : 'text-white'}`} style={{ fontSize: "clamp(1rem,1.9vw,2.8rem)" }}>
                  {formatNumber(currentDatLan1)} đạt lần 1
                </div>
              </div>

              {/* LK TÚI ĐẠT */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>LK TÚI ĐẠT</div>
                <div className={getFlashClass('tongDat', "metric-card-group1 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatNumber(displayData.tongDat)}
                </div>
                {/* <div className={`font-black flex items-center justify-center ${taichedat > 0 ? 'text-green-400' : taichedat < 0 ? 'text-red-500' : 'text-white'}`} style={{ fontSize: "clamp(1rem,1.9vw,2.8rem)" }}>
                  {formatNumber(taichedat)} tái chế đạt
                </div> */}
                {taichedat > 0 && (
                  <div className={`font-black flex items-center justify-center ${taichedat > 0 ? 'text-green-400' : taichedat < 0 ? 'text-red-500' : 'text-white'}`} style={{ fontSize: "clamp(1rem,1.9vw,2.8rem)" }}>
                    {formatNumber(taichedat)} tái chế đạt
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 flex-1">
              {/* LK TÚI LỖI */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>LK TÚI LỖI</div>
                <div className={getFlashClass('tongLoi', "metric-card-group1 font-black")} style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatNumber(displayData.tongLoi)}
                </div>
                {tuiChosua > 0 && taichedat > 0 && (
                  <div className="font-black flex items-center justify-center text-red-500" style={{ fontSize: "clamp(1rem,1.9vw,2.8rem)" }}>
                    <DownArrowIcon />
                    {formatNumber(tuiChosua)} chờ sửa
                  </div>
                )}
              </div>

              {/* RFT */}
              <div className="text-center">
                <div className="text-white font-black leading-tight mb-1" style={{ fontSize: "clamp(0.8rem,1.8vw,2rem)" }}>RFT</div>
                <div className={(() => {
                  const colorScheme = getPercentageColorForRFT(displayData.rft);
                  return getFlashClass('rft', `metric-card-full-color font-black ${colorScheme.bgColor} ${colorScheme.textColor} ${colorScheme.borderColor} border ${colorScheme.shadow} rounded-lg`);
                })()}
                  style={{ fontSize: "clamp(2rem,4.8vw,5.4rem)", lineHeight: 1.2 }}>
                  {formatPercentage(displayData.rft, 0)}%
                </div>
                <div className="font-black flex items-center justify-center gap-1" style={{ fontSize: "clamp(1rem,2vw,3rem)" }}>
                  <div className={getFlashClass('diffRftTarget', `flex flex-row items-center justify-center ${displayData.diffRftTarget > 0 ? 'text-green-400' : displayData.diffRftTarget < 0 ? 'text-red-500' : ''}`)}>
                    {displayData.diffRftTarget > 0 && <UpArrowIcon />}
                    {displayData.diffRftTarget < 0 && <DownArrowIcon />}
                    {formatPercentage(Math.abs(displayData.diffRftTarget), 2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Error Analysis & Hourly Timeline */}
        <div className={`glass-card-group3 border border-red-400/30 flex flex-col ${hasErrors ? 'flex-1 p-1 gap-2' : 'flex-1 p-4 gap-4'}`}>
          {/* Error Analysis Section */}
          {hasErrors && (
            <div className="flex-1">
              <div className="flex h-full error-qc-container items-stretch gap-2 justify-start">
                {getOptimizedErrorList().map((errorItem, displayIndex) => (
                  <div key={displayIndex} className="flex flex-col items-center gap-1 flex-1 min-w-[85px] max-w-[290px]">
                    <div className="uppercase text-yellow-200 font-semibold tracking-wide text-center w-full"
                      style={{ fontSize: "clamp(0.65rem, 0.9vw, 1.1rem)", letterSpacing: '0.03em', fontFamily: 'Arial Narrow' }}>
                      {errorItem.label}
                    </div>
                    <div className="flex w-full items-center justify-center px-0.5">
                      <div className={getFlashClass(errorItem.field, "bg-white text-black font-black rounded-md flex items-center justify-center py-1 border-1 border-yellow-100 w-full max-w-[70px]")}
                        style={{ fontSize: "clamp(1.2rem, 2.2vw, 2.5rem)", lineHeight: 1 }}>
                        {formatNumber(errorItem.count)}
                      </div>
                    </div>
                    <div className="flex items-center justify-center px-0.5 w-full">
                      <div className={(() => {
                        const percent = errorItem.percentage;
                        const bgColor = percent <= 2.0 ? 'bg-green-500' : 'bg-red-500';
                        return getFlashClass(`${errorItem.field}-percent`, `${bgColor} rounded-md text-white font-black flex items-center justify-center w-full max-w-[70px] py-1`);
                      })()}
                        style={{ fontSize: "clamp(1.2rem, 2.2vw, 2.5rem)", lineHeight: 1 }}>
                        {Math.round(errorItem.percentage)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly Timeline Section */}
          <div className={`${hasErrors ? 'flex-1' : 'flex-grow'}`}>
            <div className="grid grid-cols-11 h-full hourly-timeline-container">
              {[
                { time: "8:30", field: "h830" }, { time: "9:30", field: "h930" }, { time: "10:30", field: "h1030" },
                { time: "11:30", field: "h1130" }, { time: "13:30", field: "h1330" }, { time: "14:30", field: "h1430" },
                { time: "15:30", field: "h1530" }, { time: "16:30", field: "h1630" }, { time: "18:00", field: "h1800" },
                { time: "19:00", field: "h1900" }, { time: "20:00", field: "h2000" },
              ].map(({ time, field }) => {
                const shouldDisplay = shouldDisplaySlotValue(field);

                // Only calculate these if we need to display
                const slotData = shouldDisplay ? (displayData.hourlyData as any)?.[field] : null;
                const sanluong = slotData?.sanluong || 0;
                const colors = shouldDisplay ? getHourlyTargetColor(field) : { bgColor: "bg-slate-900/50", textColor: "text-white" };

                return (
                  <div key={time} className="flex flex-col h-full hourly-timeline-item">
                    <div className="text-center text-white font-bold py-1 hourly-timeline-header border-slate-600/50 border-1 bg-slate-900/50"
                      style={{ fontSize: hasErrors ? "clamp(0.8rem,1.8vw,2.2rem)" : "clamp(1rem,2.2vw,2.8rem)" }}>
                      {time}
                    </div>
                    <div className={`flex-1 flex items-center justify-center hourly-timeline-content border-slate-600/50 border-2 border-t-0 ${colors.bgColor} ${colors.textColor} w-full h-full border border-white/20 shadow-lg`}
                      style={{ fontSize: "clamp(1.5rem,3vw,3.8rem)", lineHeight: 1.2 }}>
                      {shouldDisplay && (
                        <div className={getFlashClass(`hourly-${field}-sanluong`, "font-black")}>
                          {formatNumber(sanluong)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
