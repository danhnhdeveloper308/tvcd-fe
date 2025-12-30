"use client";

import { useProductionLines } from '../hooks/useProductionData';
import { getPercentageColor, getPercentageColorForRFT } from '../lib/utils';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { productionLines, loading, error, refetch } = useProductionLines();
  const [mounted, setMounted] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<{ rowIndex: number, factory: number } | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter type: 'HTM' | 'CD' | 'QSL'
  const [filterType, setFilterType] = useState<'HTM' | 'CD' | 'QSL'>('HTM');
  
  // All codes displayed by default (empty = show all)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [filterEnabled, setFilterEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset filter when switching filter type (but keep initial HTM filter)
  useEffect(() => {
    // Only reset if switching away from initial HTM state
    if (filterType !== 'HTM') {
      setFilterEnabled(false);
      setSelectedCodes([]);
    }
  }, [filterType]);

  if (!mounted) {
    return null;
  }

  // Process data based on filter type
  let validLines: any[] = [];
  
  if (filterType === 'HTM') {
    // HTM lines - regular line data
    // Backend returns: percentagePPH="71.5055562227%", percentageHT="80.0000000025%", rft="77.1186440678%"
    validLines = productionLines
      .filter((item: any) => item.lineType === 'HTM' && item.nhaMay && item.line && item.to && item.code);
  } else if (filterType === 'CD') {
    // CD lines - regular line data
    validLines = productionLines
      .filter((item: any) => item.lineType === 'CD' && item.nhaMay && item.line && item.to && item.code);
  } else if (filterType === 'QSL') {
    // QSL - expand HTM lines into QSL groups (Quai/Sơn/Lót)
    const qslExpanded: any[] = [];
    
    productionLines
      .filter((item: any) => item.lineType === 'HTM' && item.qslSummary && item.qslSummary.groups && item.qslSummary.groups.length > 0)
      .forEach((line: any) => {
        // QSL has 3 groups: Quai (index 0), Sơn (index 1), Lót (index 2)
        const groupNames = ['QUAI', 'SƠN', 'LÓT'];
        
        line.qslSummary.groups.forEach((group: any, index: number) => {
          qslExpanded.push({
            code: `${line.code}_${groupNames[index]}`, // Unique code for each QSL group
            nhaMay: line.nhaMay,
            line: line.line,
            to: groupNames[index], // Use group name as "to"
            percentageHT: group.phanTramHt?.toString() || '0',
            percentagePPH: group.keHoachNgay?.toString() || '0', // QSL: Kế hoạch ngày
            rft: group.keHoachGio?.toString() || '0',            // QSL: Kế hoạch giờ (not RFT)
            lineType: 'HTM',
            isQSL: true,
            qslData: group, // Keep full QSL data
            originalLine: line, // Keep reference to original line
          });
        });
      });
    
    validLines = qslExpanded;
  }

  // Get unique items with full info for filter, grouped and sorted
  const sortByLineAndTeam = (items: any[]) => {
    return items.sort((a, b) => {
      // First sort by line
      const lineCompare = a.line.localeCompare(b.line);
      if (lineCompare !== 0) return lineCompare;

      // Then sort by team number
      const getFirstNumber = (to: string) => {
        const match = to.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      return getFirstNumber(a.to) - getFirstNumber(b.to);
    });
  };

  const uniqueItemsByFactory = {
    TS1: sortByLineAndTeam(validLines.filter((item: any) => item.nhaMay === 'TS1').map((item: any) => ({
      code: item.code,
      nhaMay: item.nhaMay,
      line: item.line,
      to: item.to,
      display: `${item.line} - ${item.to}`
    }))),
    TS2: sortByLineAndTeam(validLines.filter((item: any) => item.nhaMay === 'TS2').map((item: any) => ({
      code: item.code,
      nhaMay: item.nhaMay,
      line: item.line,
      to: item.to,
      display: `${item.line} - ${item.to}`
    }))),
    TS3: sortByLineAndTeam(validLines.filter((item: any) => item.nhaMay === 'TS3').map((item: any) => ({
      code: item.code,
      nhaMay: item.nhaMay,
      line: item.line,
      to: item.to,
      display: `${item.line} - ${item.to}`
    })))
  };

  const allUniqueItems = [...uniqueItemsByFactory.TS1, ...uniqueItemsByFactory.TS2, ...uniqueItemsByFactory.TS3];

  // Apply filter if enabled
  const filteredLines = filterEnabled && selectedCodes.length > 0
    ? validLines.filter((item: any) => {
        // For QSL items, check original line code (without _QUAI/_SƠN/_LÓT suffix)
        if (item.isQSL && item.code) {
          const originalCode = item.code.split('_')[0]; // Remove _QUAI/_SƠN/_LÓT
          return selectedCodes.includes(originalCode);
        }
        // For regular items (HTM/CD)
        return selectedCodes.includes(item.code);
      })
    : validLines;

  const groupedByFactory = {
    TS1: filteredLines.filter((item: any) => item.nhaMay === 'TS1'),
    TS2: filteredLines.filter((item: any) => item.nhaMay === 'TS2'),
    TS3: filteredLines.filter((item: any) => item.nhaMay === 'TS3'),
  };

  const url = process.env.NODE_ENV === 'development' ? 'http://localhost:3010' : 'https://live-chart-rho.vercel.app';

  // Mapping of code to factory and index for TV route
  const codeToRouteMapping: Record<string, { factory: string; index: number }> = {
    // TS1
    'KVHB07M01': { factory: 'ts1', index: 0 },
    'KVHB07M02': { factory: 'ts1', index: 1 },
    'KVHB07M03': { factory: 'ts1', index: 2 },
    'KVHB07M04': { factory: 'ts1', index: 3 },
    'KVHB07M05': { factory: 'ts1', index: 5 },
    'KVHB07M06': { factory: 'ts1', index: 5 },
    'KVHB07M07': { factory: 'ts1', index: 6 },
    'KVHB07M08': { factory: 'ts1', index: 6 },
    'KVHB07M09': { factory: 'ts1', index: 7 },
    'KVHB07M10': { factory: 'ts1', index: 8 },
    'KVHB07M13': { factory: 'ts1', index: 9 },
    'KVHB07M14': { factory: 'ts1', index: 10 },
    'KVHB07M39': { factory: 'ts1', index: 4 },
    // TS2
    'KVHB07M17': { factory: 'ts2', index: 0 },
    'KVHB07M18': { factory: 'ts2', index: 1 },
    'KVHB07M19': { factory: 'ts2', index: 2 },
    'KVHB07M20': { factory: 'ts2', index: 3 },
    'KVHB07M21': { factory: 'ts2', index: 4 },
    'KVHB07M22': { factory: 'ts2', index: 5 },
    'KVHB07M23': { factory: 'ts2', index: 6 },
    'KVHB07M24': { factory: 'ts2', index: 7 },
    // TS3
    'KVHB07M25': { factory: 'ts3', index: 0 },
    'KVHB07M26': { factory: 'ts3', index: 1 },
    'KVHB07M27': { factory: 'ts3', index: 0 },
    'KVHB07M28': { factory: 'ts3', index: 6 },
    'KVHB07M29': { factory: 'ts3', index: 7 },
    'KVHB07M30': { factory: 'ts3', index: 8 },
    'KVHB07M31': { factory: 'ts3', index: 9 },
    'KVHB07M32': { factory: 'ts3', index: 2 },
    'KVHB07M33': { factory: 'ts3', index: 3 },
    'KVHB07M34': { factory: 'ts3', index: 4 },
    'KVHB07M35': { factory: 'ts3', index: 0 },
    'KVHB07M36': { factory: 'ts3', index: 0 },
    'KVHB07M37': { factory: 'ts3', index: 5 },
    'KVHB07M38': { factory: 'ts3', index: 10 },
  };

  const handleOpenChart = (item: any) => {
    // For QSL items, use center TV route with factory and line
    if (item.isQSL && item.originalLine) {
      const factory = item.nhaMay.toLowerCase(); // TS1 -> ts1
      const lineNumber = item.line.match(/\d+/)?.[0]; // LINE 1 -> 1
      if (factory && lineNumber) {
        window.open(`${url}/tv-center?factory=${factory}&line=${lineNumber}`, '_blank');
        return;
      }
    }
    
    // For regular items (HTM/CD), use route with factory and index
    const routeInfo = codeToRouteMapping[item.code];
    if (routeInfo) {
      window.open(`${url}/tv?code=${item.code}&factory=${routeInfo.factory}&index=${routeInfo.index}`, '_blank');
    } else {
      // Fallback to old route if mapping not found
      window.open(`${url}/tv?code=${item.code}`, '_blank');
    }
  };

  const handleToggleCode = (code: string) => {
    setSelectedCodes(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    setSelectedCodes(allUniqueItems.map(item => item.code));
  };

  const handleDeselectAll = () => {
    setSelectedCodes([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading production data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-white text-xl mb-4">Error: {error}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sortByTeam = (items: any[]) => {
    return items.sort((a, b) => {
      const getFirstNumber = (to: string) => {
        const match = to.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      return getFirstNumber(a.to) - getFirstNumber(b.to);
    });
  };

  const sortedGroups = {
    TS1: sortByTeam([...groupedByFactory.TS1]),
    TS2: sortByTeam([...groupedByFactory.TS2]),
    TS3: sortByTeam([...groupedByFactory.TS3]),
  };

  // Dynamic headers based on filter type
  const getHeaders = () => {
    if (filterType === 'QSL') {
      return {
        col3: 'SLTH',
        col4: 'KH Ngày',
        col5: 'KH Giờ'
      };
    }
    // HTM and CD use same headers
    return {
      col3: 'SLTH',
      col4: 'PPH',
      col5: 'RFT'
    };
  };

  const headers = getHeaders();

  const maxRows = Math.max(
    sortedGroups.TS1.length,
    sortedGroups.TS2.length,
    sortedGroups.TS3.length
  );

  const renderCell = (item: any, factoryIndex: number, rowIndex: number) => {
    const isHovered = hoveredRow?.rowIndex === rowIndex && hoveredRow?.factory === factoryIndex;
    const hoverClass = isHovered ? 'bg-slate-600/60' : '';
    
    if (!item) {
      return (
        <>
          <td style={{ width: '6.67%' }} className={`py-4 border-r border-b border-slate-600/50 transition-colors`}></td>
          <td style={{ width: '6.67%' }} className={`py-4 border-r border-b border-slate-600/50 transition-colors`}></td>
          <td style={{ width: '6.67%' }} className={`py-4 border-r border-b border-slate-600/50 transition-colors`}></td>
          <td style={{ width: '6.67%' }} className={`py-4 border-r border-b border-slate-600/50 transition-colors`}></td>
          <td style={{ width: '6.67%' }} className={`py-4 border-b border-slate-600/50 transition-colors`}></td>
        </>
      );
    }

    // Parse values - backend returns strings with % or commas
    // HTM: percentageHT="80.0000000025%", percentagePPH="71.5055562227%", rft="77.1186440678%"
    // CD: percentageHT="78%", rft="1,421" (number without %)
    // QSL: percentageHT=number, percentagePPH=number (keHoachNgay), rft=number (keHoachGio)
    const parseValue = (val: any) => {
      if (val === null || val === undefined || val === '') return 0;
      // Remove % sign and commas, then parse
      const cleaned = String(val).replace(/%/g, '').replace(/,/g, '');
      return parseFloat(cleaned) || 0;
    };

    const htValue = parseValue(item.percentageHT);
    const pphValue = parseValue(item.percentagePPH);
    const rftValue = parseValue(item.rft);

    const htColors = getPercentageColor(htValue);
    const pphColors = getPercentageColor(pphValue);
    const rftColors = getPercentageColorForRFT(rftValue);

    // For QSL items, display raw values instead of percentages for PPH and RFT
    const displayPPH = item.isQSL ? Math.round(pphValue) : `${Math.round(pphValue)}%`;
    const displayRFT = item.isQSL ? Math.round(rftValue) : `${Math.round(rftValue)}%`;
    const displayHT = `${Math.round(htValue)}%`;

    return (
      <>
        <td
          style={{ width: '6.67%', fontSize: 'clamp(1rem, 1.8vw, 1.25rem)' }}
          className={`w-full py-4 font-bold text-white text-center border-r border-b border-slate-600/50 cursor-pointer transition-colors ${hoverClass} relative group`}
          onMouseEnter={() => setHoveredRow({ rowIndex, factory: factoryIndex })}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => handleOpenChart(item)}
          // title={tooltipContent}
        >
          {item.line}
          {isHovered && (
            <div className="absolute left-2 -translate-x-2 bottom-full mb-2 px-4 py-3 bg-slate-900 text-white text-sm rounded-lg shadow-2xl border border-purple-500 whitespace-pre-line z-50 min-w-[180px]">
              {/* <div className="font-semibold text-purple-300 mb-2">📍 {item.nhaMay} - {item.line} - {item.to}</div> */}
              <div className="space-y-1">
                {/* <div>SLTH: <span className="font-bold text-blue-400">{item.percentageHT}%</span></div>
                <div>PPH: <span className="font-bold text-green-400">{item.percentagePPH}%</span></div>
                <div>RFT: <span className="font-bold text-yellow-400">{item.rft}%</span></div> */}
                <div>SLTH: <span className={
                  `font-bold px-2 rounded ${htColors.textColor} ${htColors.bgColor} ${htColors.shadow}`
                }>{displayHT}</span></div>
                <div>{item.isQSL ? 'KH Ngày' : 'PPH'}: <span className={
                  `font-bold px-2 rounded ${item.isQSL ? 'text-white bg-blue-500' : `${pphColors.textColor} ${pphColors.bgColor} ${pphColors.shadow}`}`
                }>{displayPPH}</span></div>
                <div>{item.isQSL ? 'KH Giờ' : 'RFT'}: <span className={
                  `font-bold px-2 rounded ${item.isQSL ? 'text-white bg-green-500' : `${rftColors.textColor} ${rftColors.bgColor} ${rftColors.shadow}`}`
                }>{displayRFT}</span></div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-purple-300">🔧 Nhấn để xem chi tiết</div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-500"></div>
            </div>
          )}
        </td>
        <td
          style={{ width: '6.67%', fontSize: 'clamp(1rem, 1.8vw, 1.25rem)' }}
          className={`py-4 font-bold text-white text-center border-r border-b border-slate-600/50 cursor-pointer transition-colors ${hoverClass} relative`}
          onMouseEnter={() => setHoveredRow({ rowIndex, factory: factoryIndex })}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => handleOpenChart(item)}
        >
          {item.to}
        </td>
        <td
          style={{ width: '6.67%' }}
          className={`py-4 text-center border-r border-b border-slate-600/50 cursor-pointer transition-colors ${hoverClass} relative`}
          onMouseEnter={() => setHoveredRow({ rowIndex, factory: factoryIndex })}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => handleOpenChart(item)}
        >
          <span style={{ fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', minWidth: '85px', display: 'inline-block' }} className={`px-4 py-2 rounded-lg font-bold ${htColors.bgColor} ${htColors.textColor} ${htColors.shadow}`}>
            {displayHT}
          </span>
        </td>
        <td
          style={{ width: '6.67%' }}
          className={`py-4 text-center border-r border-b border-slate-600/50 cursor-pointer transition-colors ${hoverClass} relative`}
          onMouseEnter={() => setHoveredRow({ rowIndex, factory: factoryIndex })}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => handleOpenChart(item)}
        >
          <span style={{ fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', minWidth: '85px', display: 'inline-block' }} className={`px-4 py-2 rounded-lg font-bold ${item.isQSL ? 'bg-blue-600 text-white' : `${pphColors.bgColor} ${pphColors.textColor} ${pphColors.shadow}`}`}>
            {displayPPH}
          </span>
        </td>
        <td
          style={{ width: '6.67%' }}
          className={`py-4 text-center border-b border-slate-600/50 cursor-pointer transition-colors ${hoverClass} relative`}
          onMouseEnter={() => setHoveredRow({ rowIndex, factory: factoryIndex })}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => handleOpenChart(item)}
        >
          <span style={{ fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', minWidth: '85px', display: 'inline-block' }} className={`px-4 py-2 rounded-lg font-bold ${item.isQSL ? 'bg-green-600 text-white' : `${rftColors.bgColor} ${rftColors.textColor} ${rftColors.shadow}`}`}>
            {displayRFT}
          </span>
        </td>
      </>
    );
  };

  return (
    <div
      style={{
        // fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontFamily: "Calibri, Arial, sans-serif"
      }}
      className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-auto">
      <div className="mx-auto px-20 py-4 pb-24">
         <div
            className="absolute bg-white/95 rounded backdrop-blur-sm shadow-lg flex items-center justify-center"
            style={{
              width: "clamp(2.2rem, 4vw, 4.4rem)",
              height: "clamp(2.2rem, 4vw, 4.4rem)",
              aspectRatio: "1"
            }}
          >
            <img
              src="/logo.png"
              alt="TBS GROUP Logo"
              className="w-full h-full object-contain filter drop-shadow-xl"
              loading="eager"
            />
          </div>
        <header className="text-center mb-3">
         
          <div className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 backdrop-blur-lg rounded-2xl px-5 py-2 shadow-xl border border-indigo-300">
            <div className="flex items-center justify-center gap-2">
              <div className="text-2xl">📊</div>
              <h1 className="text-xl font-bold text-white">
                BẢNG THEO DÕI TỔNG QUAN KẾT QUẢ TRỰC TUYẾN 34 ĐẦU RA THTX TS
              </h1>
            </div>
          </div>
          <div></div>
        </header>

        {/* Filter Controls */}
        <div className="mb-4 flex items-center justify-center gap-4">
          {/* Filter Type Selector */}
          <div className="flex gap-2 bg-slate-800/90 backdrop-blur-lg rounded-xl px-2 py-2 border border-slate-700 shadow-lg">
            <button
              onClick={() => setFilterType('HTM')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterType === 'HTM'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🏭 Hoàn Thiện May (HTM)
            </button>
            {/* <button
              onClick={() => setFilterType('CD')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterType === 'CD'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ✂️ Chặt Dán (CD)
            </button>
            <button
              onClick={() => setFilterType('QSL')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterType === 'QSL'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📦 Quai-Sơn-Lót (QSL)
            </button> */}
          </div>

          <label className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-lg rounded-xl px-4 py-2 border border-slate-700 shadow-lg">
            <input
              type="checkbox"
              checked={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-gray-400 text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-white font-semibold">
              {filterEnabled ? 'Tắt Bộ Lọc' : 'Bật Bộ Lọc'}
            </span>
          </label>

          <button
            onClick={() => setShowFilterModal(true)}
            disabled={!filterEnabled}
            className={`px-6 py-2 rounded-xl font-semibold shadow-lg transition-all ${filterEnabled
                ? 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
          >
            Chọn Đầu Ra ({selectedCodes.length})
          </button>

          {filterEnabled && selectedCodes.length > 0 && (
            <div className="text-white bg-green-600/80 px-4 py-2 rounded-xl backdrop-blur-lg border border-green-500 shadow-lg">
              Hiển thị {filteredLines.length} / {validLines.length} đầu ra
            </div>
          )}
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden border-2 border-purple-500 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Chọn Đầu Ra  ({selectedCodes.length} đã chọn)
                </h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-white hover:text-red-400 text-3xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Chọn Tất Cả
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Bỏ Chọn Tất Cả
                </button>
              </div>

              <div className="overflow-y-auto max-h-[50vh] bg-slate-900/50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* TS1 Column */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 pb-2 border-b-2 border-purple-500">TS1</h3>
                    <div className="flex flex-col gap-2">
                      {uniqueItemsByFactory.TS1.map((item) => (
                        <label
                          key={item.code}
                          className="flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 py-2 cursor-pointer transition-colors border border-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCodes.includes(item.code)}
                            onChange={() => handleToggleCode(item.code)}
                            className="w-4 h-4 rounded border-gray-400 text-purple-600 focus:ring-purple-500 focus:ring-2 flex-shrink-0"
                          />
                          <span className="text-white font-medium text-sm">{item.display}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* TS2 Column */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 pb-2 border-b-2 border-purple-500">TS2</h3>
                    <div className="flex flex-col gap-2">
                      {uniqueItemsByFactory.TS2.map((item) => (
                        <label
                          key={item.code}
                          className="flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 py-2 cursor-pointer transition-colors border border-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCodes.includes(item.code)}
                            onChange={() => handleToggleCode(item.code)}
                            className="w-4 h-4 rounded border-gray-400 text-purple-600 focus:ring-purple-500 focus:ring-2 flex-shrink-0"
                          />
                          <span className="text-white font-medium text-sm">{item.display}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* TS3 Column */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 pb-2 border-b-2 border-purple-500">TS3</h3>
                    <div className="flex flex-col gap-2">
                      {uniqueItemsByFactory.TS3.map((item) => (
                        <label
                          key={item.code}
                          className="flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 py-2 cursor-pointer transition-colors border border-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCodes.includes(item.code)}
                            onChange={() => handleToggleCode(item.code)}
                            className="w-4 h-4 rounded border-gray-400 text-purple-600 focus:ring-purple-500 focus:ring-2 flex-shrink-0"
                          />
                          <span className="text-white font-medium text-sm">{item.display}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  Áp Dụng Bộ Lọc
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-[50px] overflow-x-auto">
          {/* TS1 Table */}
          <div className="flex-1 min-w-[400px] bg-slate-800/90 backdrop-blur-lg rounded-2xl p-3 border border-slate-700 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <th colSpan={5} className="py-3 text-center font-bold text-white">
                      <div
                        style={{ fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }}
                        className="flex items-center justify-center gap-2"
                      >
                        <span>TS1</span>
                        <span className="text-lg text-purple-200">({sortedGroups.TS1.length} đầu ra)</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80">
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">LINE</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">Tổ</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col3}</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col4}</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col5}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroups.TS1.map((item, rowIndex) => {
                    const lineNumber = parseInt(item.line.match(/\d+/)?.[0] || '0');
                    const isEvenLine = lineNumber % 2 === 0;
                    const zebraClass = isEvenLine ? 'bg-gray-700' : 'bg-slate-700/20';
                    
                    return (
                      <tr key={rowIndex} className={`${zebraClass} transition-all duration-200`}>
                        {renderCell(item, 1, rowIndex)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TS2 Table */}
          <div className="flex-1 min-w-[400px] bg-slate-800/90 backdrop-blur-lg rounded-2xl p-3 border border-slate-700 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <th colSpan={5} className="py-3 text-center text-lg font-bold text-white">
                      <div
                        style={{ fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }}
                        className="flex items-center justify-center gap-2">
                        <span>TS2</span>
                        <span className="text-lg text-purple-200">({sortedGroups.TS2.length} đầu ra)</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80">
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">LINE</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">Tổ</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col3}</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col4}</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col5}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroups.TS2.map((item, rowIndex) => {
                    const lineNumber = parseInt(item.line.match(/\d+/)?.[0] || '0');
                    const isEvenLine = lineNumber % 2 === 0;
                   const zebraClass = isEvenLine ? 'bg-gray-700' : 'bg-slate-700/20';
                    
                    return (
                      <tr key={rowIndex} className={`${zebraClass} transition-all duration-200`}>
                        {renderCell(item, 2, rowIndex)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TS3 Table */}
          <div className="flex-1 min-w-[400px] bg-slate-800/90 backdrop-blur-lg rounded-2xl p-3 border border-slate-700 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <th colSpan={5} className="py-3 text-center text-lg font-bold text-white">
                      <div
                        style={{ fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }}
                        className="flex items-center justify-center gap-2"
                      >
                        <span>TS3</span>
                        <span className="text-lg text-purple-200">({sortedGroups.TS3.length} đầu ra)</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80">
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">LINE</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">Tổ</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col3}</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col4}</th>
                    <th style={{ width: '20%', fontSize: 'clamp(1.125rem, 2vw, 1.5rem)' }} className="py-3 font-bold text-white border-r border-white/30">{headers.col5}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroups.TS3.map((item, rowIndex) => {
                    const lineNumber = parseInt(item.line.match(/\d+/)?.[0] || '0');
                    const isEvenLine = lineNumber % 2 === 0;
                    const zebraClass = isEvenLine ? 'bg-gray-700' : 'bg-slate-700/20';
                    
                    return (
                      <tr key={rowIndex} className={`${zebraClass} transition-all duration-200`}>
                        {renderCell(item, 3, rowIndex)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}