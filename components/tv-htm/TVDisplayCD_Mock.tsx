"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import useTime from "@/hooks/useTime";
import { useProductionDataCD } from "@/hooks/useProductionDataCD";
import { getPercentageColorClass } from "@/lib/utils";

interface TVDisplayCDProps {
  code: string; // e.g., "KVHB07CD26"
}

export default function TVDisplayCD({ code }: TVDisplayCDProps) {
  const { minutes, hours } = useTime({});
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  // Fetch real data from backend
  const { data, loading, error, connected, refresh } = useProductionDataCD({
    maChuyenLine: code,
    enableRealtime: true,
    tvMode: true,
  });

  // ✅ CRITICAL: Process data for display
  const displayData = useMemo(() => {
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.warn(`⚠️ CD Component: Invalid data structure`, data);
      return null;
    }

    const allLines = data.data;
    const factory = data.factory || "TS1";

    // ✅ CRITICAL VALIDATION: Verify factory consistency
    // const factories = [...new Set(allLines.map((l: any) => l.nhaMay))];

    // Section 1: Monthly Plan (4 parent rows + subRows to match Section 2)
    const monthlyPlan = allLines.map((line: any, idx: number) => ({
      cd: `CD${idx + 1}`, // ⭐ Short name: CD1, CD2, CD3, CD4
      canBoQuanLy: line.canBoQuanLy || "", // ⭐ Add canBoQuanLy to Section 1
      khGiaoThang: line.monthlyPlanData?.khGiaoThang || line.khGiaoThang || 0,
      khBqNgay: line.monthlyPlanData?.khBqNgay || 0,
      slkhBq: line.monthlyPlanData?.slkhBq || line.slkh_bqlk || 0,
      slthThang: line.monthlyPlanData?.slthThang || line.slthThang || 0,
      phanTramThang:
        line.monthlyPlanData?.phanTramThang || line.phanTramThang || 0,
      clThang: line.monthlyPlanData?.clThang || line.conlai || 0,
      bqCanSxNgay: line.monthlyPlanData?.bqCanSxNgay || line.bqCansxNgay || 0,
      tglv: line.tglv || 0,
    }));

    // ⭐ Helper to parse MaHang and Mau
    const parseMaHangMau = (fullString: string) => {
      if (!fullString) return { maHang: "", mau: "" };
      // Find the first hyphen to split.
      // Example: "FCW854-XAQ" -> maHang: "FCW854", mau: "XAQ"
      // Example: "KK056" -> maHang: "KK056", mau: ""
      const hyphenIndex = fullString.indexOf("-");
      if (hyphenIndex !== -1) {
        return {
          maHang: fullString.substring(0, hyphenIndex).trim(),
          mau: fullString.substring(hyphenIndex + 1).trim(),
        };
      }
      return { maHang: fullString, mau: "" };
    };

    // Section 2 & 3: CD Groups with sub-rows
    const getCDColor = (idx: number) => {
      // Apply Lime Green theme for all rows as requested
      const commonColor = {
        bgColor: "bg-[#a3c928]", // Lime
        textColor: "text-slate-900",
        rowBg: "bg-[#f7f9e8]", // Light Cream
        subRowText: "text-slate-900",
        borderColor: "border-slate-500",
      };
      
      return commonColor;
    };

    const cdGroups = allLines.map((line: any, idx: number) => {
      const color = getCDColor(idx);

      // ⭐ Extract canBoQuanLy
      const canBoQuanLy = line.canBoQuanLy || "";

      // ⭐ Parse MaHang/Mau for Parent Row
      const { maHang: parentMaHang, mau: parentMau } = parseMaHangMau(
        line.maHang || ""
      );

      // Parent row (CD level)
      const parentRow = {
        to: `CD${idx + 1}`,
        canBoQuanLy: canBoQuanLy,
        maHang: parentMaHang,
        mau: parentMau,
        tglv: line.tglv ? line.tglv.toString() : "",
        ldHienCo: line.ldHienCo ? line.ldHienCo.toString() : "0", // Ensure numeric string for calc
        ldLayout: line.ldLayout ? line.ldLayout.toString() : "0", // Ensure numeric string for calc
        ldCoMat: line.ldCoMat ? line.ldCoMat.toString() : "0", // Ensure numeric string for calc
        targetNgay: line.targetNgay || 0,
        lkkh: line.lkkh || 0,
        lkth: line.lkth || 0,
        slTon: line.tonMayTotal || line.tonMay || 0,
        ngayTon: "",
        dbNgay: line.dbNgay || "", // Add dbNgay to parent row
      };

      // Parent Supply Chain Data
      const parentSupplyRow = {
        ncDv: line.ncdv || 0,
        dbCu: line.dbcu || 0,
        nc1: line.nc1ntt || 0,
        db1: line.db1ntt || 0,
        nc2: line.nc2ntt || 0,
        db2: line.db2ntt || 0,
        nc3: line.nc3ntt || 0,
        db3: line.db3ntt || 0,
      };

      // ✅ FIX: Limit subRows display to max 7 rows (Total 4 CDs * 8 rows = 32 max)
      const MAX_DISPLAY_ROWS = 7;
      // ✅ Frontend filters tonMay > 0
      const subRowsData = (line.subRows || []).filter(
        (sr: any) => sr.tonMay > 0
      ); // Only show rows with inventory

      // Sort subRows by 'to' (Team) ascending
      const sortedSubRows = [...subRowsData].sort((a: any, b: any) => {
        // Extract first number from string like "1+2" -> 1, "5" -> 5
        const numA = parseInt(a.to) || 999;
        const numB = parseInt(b.to) || 999;
        return numA - numB;
      });

      const displaySubRows = sortedSubRows.slice(0, MAX_DISPLAY_ROWS);

      const subRows = displaySubRows.map((subRow: any) => {
        // ⭐ Parse MaHang/Mau for Sub Row
        const { maHang: subMaHang, mau: subMau } = parseMaHangMau(
          subRow.maHang || ""
        );

        return {
          to: `TỔ ${subRow.to || subRow.tglv}`,
          canBoQuanLy: "",
          maHang: subMaHang,
          mau: subMau,
          tglv: "",
          ldDinhBien: "", // Subrows usually don't have this data in this view context, or keep empty
          ldLayout: "",
          targetNgay: subRow.targetNgay || 0,
          lkkh: subRow.lkkh || 0,
          lkth: subRow.lkth || 0,
          slTon: subRow.tonMay || 0,
          ngayTon: subRow.ngayTon || "",
          dbNgay: subRow.dbNgay || "",
          ncdv: subRow.ncdv || 0,
          dbcu: subRow.dbcu || 0,
          nc1: subRow.nc1ntt || 0,
          db1: subRow.db1ntt || 0,
          nc2: subRow.nc2ntt || 0,
          db2: subRow.db2ntt || 0,
          nc3: subRow.nc3ntt || 0,
          db3: subRow.db3ntt || 0,
        };
      });

      // Map Supply Chain Rows corresponding to displaySubRows
      const supplyChainRows = displaySubRows.map((subRow: any) => ({
        ncDv: subRow.ncdv || 0,
        dbCu: subRow.dbcu || 0,
        nc1: subRow.nc1ntt || 0,
        db1: subRow.db1ntt || 0,
        nc2: subRow.nc2ntt || 0,
        db2: subRow.db2ntt || 0,
        nc3: subRow.nc3ntt || 0,
        db3: subRow.db3ntt || 0,
      }));

      return {
        cdGroup: {
          id: `TỔ CD${idx + 1}`,
          bgColor: color.bgColor,
          textColor: color.textColor,
          rowBg: color.rowBg,
          subRowText: color.subRowText,
          parentRowBg: color.bgColor,
          borderColor: color.borderColor,
          rows: [parentRow, ...subRows],
        },
        supplyChainGroup: {
          id: `CD${idx + 1}`,
          rows: [parentSupplyRow, ...supplyChainRows],
        },
      };
    });

    // Extract separated groups for display
    const finalCdGroups = cdGroups.map((g: any) => g.cdGroup);
    const finalSupplyChain = cdGroups.map((g: any) => g.supplyChainGroup);

    return {
      factory,
      monthlyPlan,
      cdGroups: finalCdGroups,
      supplyChain: finalSupplyChain,
    };
  }, [data]); // ✅ MUST depend on data to trigger on updates

  // ⭐ FLASHING LOGIC
  const [flashingCells, setFlashingCells] = useState<Set<string>>(new Set());
  const prevDisplayDataRef = useRef<any>(null);

  useEffect(() => {
    if (!displayData) return;

    if (!prevDisplayDataRef.current) {
      prevDisplayDataRef.current = displayData;
      return;
    }

    const prev = prevDisplayDataRef.current;
    const curr = displayData;
    const newFlashing = new Set<string>();

    const check = (key: string, val1: any, val2: any) => {
      if (val1 !== val2) {
        newFlashing.add(key);
      }
    };

    // ✅ FIXED: Section 1 keys match JSX (s1-${idx}-fieldName)
    if (curr.monthlyPlan && prev.monthlyPlan) {
      curr.monthlyPlan.forEach((plan: any, idx: number) => {
        const prevPlan = prev.monthlyPlan?.[idx];
        if (!prevPlan || !plan) return;

        check(`s1-${idx}-khGiaoThang`, prevPlan.khGiaoThang, plan.khGiaoThang);
        check(`s1-${idx}-khBqNgay`, prevPlan.khBqNgay, plan.khBqNgay);
        check(`s1-${idx}-slkhBq`, prevPlan.slkhBq, plan.slkhBq);
        check(`s1-${idx}-slthThang`, prevPlan.slthThang, plan.slthThang);
        check(
          `s1-${idx}-phanTramThang`,
          prevPlan.phanTramThang,
          plan.phanTramThang
        );
        check(`s1-${idx}-clThang`, prevPlan.clThang, plan.clThang);
        check(`s1-${idx}-bqCanSxNgay`, prevPlan.bqCanSxNgay, plan.bqCanSxNgay);
      });
    }

    // ✅ FIXED: Section 2 keys match JSX (s2-${cdIdx}-${rowIdx}-fieldName)
    if (curr.cdGroups && prev.cdGroups) {
      curr.cdGroups.forEach((group: any, cdIdx: number) => {
        const prevGroup = prev.cdGroups?.[cdIdx];
        if (!prevGroup || !group) return;

        if (group.rows && prevGroup.rows) {
          group.rows.forEach((row: any, rowIdx: number) => {
            const prevRow = prevGroup.rows?.[rowIdx];
            if (!prevRow || !row) return;

            check(`s2-${cdIdx}-${rowIdx}-to`, prevRow.to, row.to);
            check(`s2-${cdIdx}-${rowIdx}-maHang`, prevRow.maHang, row.maHang);
            check(`s2-${cdIdx}-${rowIdx}-mau`, prevRow.mau, row.mau);
            check(`s2-${cdIdx}-${rowIdx}-tglv`, prevRow.tglv, row.tglv);
            check(
              `s2-${cdIdx}-${rowIdx}-ld`,
              `${prevRow.ldHienCo}/${prevRow.ldCoMat}`,
              `${row.ldHienCo}/${row.ldCoMat}`
            );
            check(
              `s2-${cdIdx}-${rowIdx}-targetNgay`,
              prevRow.targetNgay,
              row.targetNgay
            );
            check(`s2-${cdIdx}-${rowIdx}-lkkh`, prevRow.lkkh, row.lkkh);
            check(`s2-${cdIdx}-${rowIdx}-lkth`, prevRow.lkth, row.lkth);
          });
        }
      });
    }

    // ✅ FIXED: Section 3 keys match JSX (s3-${cdIdx}-${rowIdx}-fieldName)
    if (curr.supplyChain && prev.supplyChain) {
      curr.supplyChain.forEach((group: any, cdIdx: number) => {
        const prevGroup = prev.supplyChain?.[cdIdx];
        if (!prevGroup || !group) return;

        if (group.rows && prevGroup.rows) {
          group.rows.forEach((row: any, rowIdx: number) => {
            const prevRow = prevGroup.rows?.[rowIdx];
            if (!prevRow || !row) return;

            // Get corresponding displayData row for slTon and dbNgay
            const displayRow = curr.cdGroups?.[cdIdx]?.rows?.[rowIdx];
            const prevDisplayRow = prev.cdGroups?.[cdIdx]?.rows?.[rowIdx];

            if (displayRow && prevDisplayRow) {
              check(
                `s3-${cdIdx}-${rowIdx}-slTon`,
                prevDisplayRow.slTon,
                displayRow.slTon
              );
              check(
                `s3-${cdIdx}-${rowIdx}-dbNgay`,
                prevDisplayRow.dbNgay,
                displayRow.dbNgay
              );
            }

            check(`s3-${cdIdx}-${rowIdx}-ncDv`, prevRow.ncDv, row.ncDv);
            check(`s3-${cdIdx}-${rowIdx}-dbCu`, prevRow.dbCu, row.dbCu);
            check(`s3-${cdIdx}-${rowIdx}-nc1`, prevRow.nc1, row.nc1);
            check(`s3-${cdIdx}-${rowIdx}-db1`, prevRow.db1, row.db1);
            check(`s3-${cdIdx}-${rowIdx}-nc2`, prevRow.nc2, row.nc2);
            check(`s3-${cdIdx}-${rowIdx}-db2`, prevRow.db2, row.db2);
            check(`s3-${cdIdx}-${rowIdx}-nc3`, prevRow.nc3, row.nc3);
            check(`s3-${cdIdx}-${rowIdx}-db3`, prevRow.db3, row.db3);
          });
        }
      });
    }

    if (newFlashing.size > 0) {
      setFlashingCells(newFlashing);

      // Remove flashing after animation (2 seconds)
      setTimeout(() => {
        setFlashingCells(new Set());
      }, 2000);
    } else {
    }

    // Update reference
    prevDisplayDataRef.current = displayData;
  }, [displayData]); // ✅ MUST trigger on displayData changes

  // Helper to get flash class
  const getFlashClass = (key: string, baseClass: string = "") => {
    const isFlashing = flashingCells.has(key);

    return isFlashing
      ? `animate-flash-yellow ${baseClass}`
      : `transition-colors duration-500 ${baseClass}`;
  };

  // Calculate total rows for dynamic sizing
  const totalRows = useMemo(() => {
    if (!displayData) return 12;
    const count = displayData.cdGroups.reduce(
      (sum: number, cd: any) => sum + cd.rows.length,
      0
    );
    return Math.max(count, 12); // Ensure at least 12 for calculation base
  }, [displayData]);

  // Dynamic font size based on number of rows
  const getDynamicFontSize = (scale: number = 1) => {
    // Calculate base font size based on available height and total rows
    // Available height for rows is approx 79vh
    const rowHeight = 79 / totalRows;

    // Reduced multiplier from 0.45 to 0.35 to prevent text from being too large
    // This helps on smaller screens like 15.6" laptops
    const size = rowHeight * 0.35 * scale;

    // Clamp max size significantly (max 2.5vh) to ensure it doesn't look huge
    // 2.5vh on 1080p is ~27px, which is readable but not overwhelming
    const clampedSize = Math.min(Math.max(size, 1.0), 2.5);
    return `${clampedSize}vh`;
  };

  // Dynamic row height for sections 2 & 3
  const getRowHeight = () => {
    // Use percentage height to fill the container exactly
    return `${100 / totalRows}%`;
  };

  const getNextThreeDays = () => {
    const today = new Date();
    const nextDays: string[] = [];
    let daysAdded = 0;
    let offset = 1;

    while (daysAdded < 3) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      if (date.getDay() !== 0) {
        nextDays.push(
          `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`
        );
        daysAdded++;
      }
      offset++;
    }
    return nextDays;
  };

  const nextDays = getNextThreeDays();

  const formatNumber = (num: number | string): string => {
    if (num === "" || num === null || num === undefined) return "";
    return Number(num).toLocaleString("vi-VN");
  };

  // ✅ FIX: Add getClColor helper
  const getClColor = (value: number): string => {
    if (value >= 0) return "text-green-600";
    return "text-red-600";
  };

  // ✅ FIX: Add missing getNgayTonColor function
  const getNgayTonColor = (value: number): string => {
    if (value < 2.5) return "bg-red-500 text-white";
    if (value < 3.0) return "bg-yellow-500 text-slate-900";
    return "bg-green-500 text-white";
  };

  // ✅ FIX: Add missing getDbColor function
  const getDbColor = (db: number, nc: number): string => {
    if (nc === 0) return "";
    const ratio = db / nc;
    if (ratio > 1.0) return "bg-fuchsia-500 text-white";
    if (ratio >= 0.95) return "bg-green-500 text-white";
    if (ratio >= 0.9) return "bg-yellow-400 text-slate-900";
    if (ratio >= 0.85) return "bg-orange-400 text-white";
    // if (ratio < 0.85 && ratio >0) return "bg-red-500";
    return "";
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl">Đang tải dữ liệu...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl text-red-500">Lỗi: {error}</div>
      </div>
    );
  }

  // Show no data state
  if (!displayData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl">Không có dữ liệu</div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-white"
      style={{
        fontFamily: "Verdana, Tahoma, 'Segoe UI', Geneva, sans-serif",
        // WebkitFontSmoothing: "antialiased", // Removed to improve sharpness on low-res screens
        // MozOsxFontSmoothing: "grayscale",   // Removed to improve sharpness on low-res screens
      }}
    >
      {/* Header */}
      <div
        className="w-full flex flex-row items-center gap-3 px-4 flex-shrink-0 border-b-2 border-green-800 tv-header"
        style={{ height: "6vh" }}
      >
        <div
          className="relative bg-white rounded flex items-center justify-center flex-shrink-0 border border-gray-300"
          style={{ width: "5vh", height: "5vh" }}
        >
          <img
            src="/logo.png"
            alt="TBS"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="font-black text-green-500 text-center text-[1.6rem] leading-tight">
            THTXTS - ĐHSX CHẶT DÁN & TIẾN ĐỘ ĐỒNG BỘ CUNG ỨNG ĐẦU VÀO CHO MAY -{" "}
            {displayData.factory}
          </div>
        </div>
        <div
          className="w-24 text-right font-bold text-[1.6rem] text-green-500"
          suppressHydrationWarning={true}
        >
          {formattedTime}
        </div>
      </div>

      {/* Main - 3 Sections */}
      <div className="flex-1 overflow-hidden flex flex-row gap-0.5 bg-slate-950">
        {/* SECTION 1: KẾ HOẠCH GIAO & SẢN LƯỢNG - 30% */}
        <div
          className="flex flex-col border-2 border-[#004d26] overflow-hidden rounded bg-slate-900 gap-1 text-white"
          style={{ width: "30%" }}
        >
          {/* Header */}
          <div
            className="bg-[#004d26] border-b-2 border-slate-500 text-center flex items-center justify-center flex-shrink-0 text-white"
            style={{
               height: "5vh",
              letterSpacing: "0.1em"
             }}
          >
            <h2
              className="font-black leading-tight"
              style={{ fontSize: getDynamicFontSize(1) }}
            >
              KẾ HOẠCH GIAO & SẢN LƯỢNG THỰC HIỆN THÁNG
            </h2>
          </div>

          {/* Table Headers */}
          <div
            className="w-full flex border-b-2 border-slate-500 bg-[#006833] flex-shrink-0 text-white"
            style={{ height: "6vh" }}
          >
            <div
              className="border-r border-slate-500 font-bold text-center flex items-center justify-center leading-tight "
              // style={{ width: "24.25%", fontSize: getDynamicFontSize(0.95) }}
              style={{ width: "28%", fontSize: getDynamicFontSize(0.95) }}
            >
              KH GIAO
              <br />
              THÁNG
            </div>
            <div
              className="border-r border-slate-500 font-bold text-center flex items-center justify-center leading-tight "
              // style={{ width: "12.25%", fontSize: getDynamicFontSize(0.9) }}
              style={{ width: "15%", fontSize: getDynamicFontSize(0.9) }}
            >
              KH BQ
              <br />
              NGÀY
            </div>
            <div
              className="border-r border-slate-500 font-bold text-center flex items-center justify-center leading-tight "
              // style={{ width: "14.1%", fontSize: getDynamicFontSize(0.95) }}
              style={{ width: "18%", fontSize: getDynamicFontSize(0.95) }}
            >
              SLKH
              <br />
              BQ
            </div>
            <div
              className="border-r border-slate-500 font-bold text-center flex items-center justify-center leading-tight "
              // style={{ width: "14%", fontSize: getDynamicFontSize(0.95) }}
              style={{ width: "18%", fontSize: getDynamicFontSize(0.95) }}
            >
              SLTH
              <br />
              THÁNG
            </div>
            <div
              className="border-r border-slate-500 font-bold text-center flex items-center justify-center leading-tight "
              // style={{ width: "11.25%", fontSize: getDynamicFontSize(0.95) }}
              style={{ width: "13%", fontSize: getDynamicFontSize(0.95) }}
            >
              % HT
              <br />
              {/* THÁNG */}
            </div>
            {/* <div
              className="border-r border-slate-500 font-bold text-center flex items-center justify-center leading-tight text-white"
              style={{ width: "12.25%", fontSize: getDynamicFontSize(0.95) }}
            >
              +/- CL
            </div> */}
            <div
              className="font-bold text-center flex items-center justify-center leading-tight "
              style={{ width: "13%", fontSize: getDynamicFontSize(0.7) }}
            >
              BQ CẦN
              <br />
              SX NGÀY
            </div>
          </div>

          {/* ⭐ NEW: Table Body - One merged row per CD */}
          <div className="flex-1 overflow-hidden">
            <div className="w-full h-full flex flex-col">
              {displayData.monthlyPlan.map((plan: any, idx: number) => {
                const cdGroup = displayData.cdGroups[idx];
                // ⭐ Section 1: Use Dark Slate background to reduce glare and highlight white text
                // const rowBg = "bg-[#004d26]";
                const textColor = "text-white";
                const borderColor = "border-slate-500";

                // ⭐ Calculate height based on Section 2 rows for this CD
                const cdRowCount = cdGroup?.rows?.length || 1;
                // Use percentage height to match Section 2
                const rowHeight = `${(cdRowCount / totalRows) * 100}%`;
                // Calculate gap height (e.g. 0.5vh)
                const gapHeight = 0.5; // vh
                const blockHeight = `calc(100% - ${gapHeight}vh)`;

                const diffSLTH = plan.slthThang - plan.khGiaoThang;

                return (
                  <div
                    key={`cd-plan-${idx}`}
                    className="flex flex-col w-full"
                    style={{ height: rowHeight }}
                  >
                    <div
                      // className={`flex flex-row w-full border ${borderColor} ${rowBg} ${textColor}`}
                      className={`flex flex-row w-full border ${borderColor} bg-[#3a5a4a] ${textColor}`}
                      // className={`flex flex-row w-full border ${borderColor} bg-[#45745c] ${textColor}`}
                      style={{ height: blockHeight, marginBottom: `${gapHeight}vh` }}
                    >
                      {/* ⭐ Cột CD - Show CD name + canBoQuanLy */}
                      <div
                        className={`border-r ${borderColor} flex flex-col justify-center items-center text-center ${cdGroup?.bgColor} ${cdGroup?.textColor} overflow-hidden h-full`}
                        style={{ width: "11%" }}
                      >
                        <div
                          className="font-black whitespace-nowrap"
                          style={{ fontSize: getDynamicFontSize(1.2) }}
                        >
                          {plan.cd}
                        </div>
                        {plan.canBoQuanLy && (
                          <div
                            className="font-semibold opacity-95 mt-0.5 whitespace-nowrap text-slate-900"
                            style={{ fontSize: getDynamicFontSize(0.85) }}
                          >
                            {plan.canBoQuanLy}
                          </div>
                        )}
                      </div>

                      {/* Data columns */}
                      <div
                        className={`border-r ${borderColor} flex items-center justify-center font-semibold text-center  h-full ${getFlashClass(
                          `s1-${idx}-khGiaoThang`
                        )}`}
                        style={{
                          fontSize: getDynamicFontSize(1.2),
                          width: "17%",
                        }}
                      >
                        {formatNumber(plan.khGiaoThang)}
                      </div>
                      <div
                        className={`border-r ${borderColor} flex items-center justify-center font-semibold text-center  h-full ${getFlashClass(
                          `s1-${idx}-khBqNgay`
                        )}`}
                        style={{
                          fontSize: getDynamicFontSize(1.2),
                          width: "15%",
                        }}
                      >
                        {formatNumber(plan.khBqNgay)}
                      </div>
                      <div
                        className={`border-r ${borderColor} flex items-center justify-center font-semibold text-center  h-full ${getFlashClass(
                          `s1-${idx}-slkhBq`
                        )}`}
                        style={{
                          fontSize: getDynamicFontSize(1.2),
                          width: "18%",
                        }}
                      >
                        {formatNumber(plan.slkhBq)}
                      </div>
                      {/* ⭐ FIXED: SLTH column with vertical layout */}
                      <div
                        className={`border-r ${borderColor} flex items-center justify-center font-semibold text-center  h-full ${getFlashClass(
                          `s1-${idx}-slthThang`
                        )}`}
                        style={{ width: "18%", position: "relative" }}
                      >
                        <div style={{ fontSize: getDynamicFontSize(1.2) }}>
                          {formatNumber(plan.slthThang)}
                        </div>
                        {diffSLTH !== 0 && (
                          <div
                            className={`font-bold ${
                              diffSLTH > 0 ? "text-green-500" : "text-red-500"
                            }`}
                            style={{
                              fontSize: getDynamicFontSize(0.9),
                              position: "absolute",
                              bottom: "25%",
                              left: "50%",
                              transform: "translateX(-50%)",
                            }}
                          >
                            ({diffSLTH > 0 ? "+" : ""}
                            {formatNumber(diffSLTH)})
                          </div>
                        )}
                      </div>
                      <div
                        className={`border-r ${borderColor} flex items-center justify-center text-center h-full ${getPercentageColorClass(
                          plan.phanTramThang
                        )} ${getFlashClass(`s1-${idx}-phanTramThang`)}`}
                        style={{
                          fontSize: getDynamicFontSize(1.2),
                          width: "13%",
                        }}
                      >
                        {plan.phanTramThang}%
                      </div>
                      <div
                        className={`flex items-center justify-center font-semibold text-center  h-full ${getFlashClass(
                          `s1-${idx}-bqCanSxNgay`
                        )}`}
                        style={{
                          fontSize: getDynamicFontSize(1.2),
                          width: "13%",
                        }}
                      >
                        {formatNumber(plan.bqCanSxNgay)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: THEO DÕI & ĐIỀU HÀNH SẢN XUẤT - 35% */}
        <div
          className="flex flex-col border-2 border-[#004d26] overflow-hidden rounded bg-slate-900 gap-1 text-white"
          style={{ width: "32%" }}
        >
          <div
            className="bg-[#004d26] border-b-2 border-slate-500 text-center flex items-center justify-center flex-shrink-0"
            style={{ height: "5vh" }}
          >
            <h2
              className="font-black leading-tight text-white"
              style={{ fontSize: getDynamicFontSize(1.1) }}
            >
              TD TĐSX & KQSX NGÀY
            </h2>
          </div>

          <table
            className="w-full border-collapse flex-shrink-0"
            style={{ tableLayout: "fixed" }}
          >
            <thead>
              <tr
                className="bg-[#006833] border-b-2 border-slate-500"
                style={{ height: "6vh" }}
              >
                <th
                  className="border-r border-slate-500 font-bold text-center text-white px-1"
                  style={{ width: "12%", fontSize: getDynamicFontSize(1) }}
                >
                  TỔ
                </th>
                <th
                  className="border-r border-slate-500 font-bold text-center text-white"
                  style={{ width: "20%", fontSize: getDynamicFontSize(1) }}
                >
                  MÃ
                </th>
                <th
                  className="border-r border-slate-500 font-bold text-center text-white"
                  style={{ width: "11%", fontSize: getDynamicFontSize(1) }}
                >
                  MÀU
                </th>
                <th
                  className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                  style={{
                    width: "8%",
                    fontSize: getDynamicFontSize(0.85),
                  }}
                >
                  TGLV
                </th>
                {/* ⭐ MERGED COLUMN: NHÂN SỰ */}
                <th
                  className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                  style={{
                    width: "13%",
                    fontSize: getDynamicFontSize(0.85),
                  }}
                >
                  L.ĐỘNG
                  <br />
                  ĐB/CM
                </th>
                <th
                  className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                  style={{
                    width: "12%",
                    fontSize: getDynamicFontSize(0.9),
                  }}
                >
                  TARGET
                  <br />
                  NGÀY
                </th>
                {/* <th
                  className="border-r border-slate-600 font-bold text-center text-white"
                  style={{ width: "12%", fontSize: getDynamicFontSize(1) }}
                >
                  LKKH
                </th> */}
                <th
                  className="font-bold text-center text-white"
                  style={{ width: "12%", fontSize: getDynamicFontSize(1) }}
                >
                  LKTH
                </th>
              </tr>
            </thead>
          </table>

          <div className="flex-1 overflow-hidden">
            <table
              className="w-full border-collapse h-full"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                {/* <col style={{ width: "12%" }} /> */}
                <col style={{ width: "12%" }} />
              </colgroup>
              <tbody>
                {displayData.cdGroups.map((cd: any) =>
                  cd.rows.map((row: any, rowIdx: number) => {
                    // Calculate difference for parent rows
                    const dinhBien = parseInt(row.ldHienCo || "0");
                    const coMat = parseInt(row.ldCoMat || "0");
                    const diff = coMat - dinhBien;
                    const showLabor =
                      row.canBoQuanLy && (coMat > 0 || dinhBien > 0);

                    // ⭐ Determine row background: Darker/Solid for parent (rowIdx === 0), lighter/transparent for subrows
                    // const currentRowBg = rowIdx === 0 ? cd.parentRowBg : cd.rowBg;
                    const currentRowBg =
                      rowIdx === 0 ? cd.bgColor : cd.rowBg;

                    // ⭐ Determine text color: White for parent, Dark for subrows
                    const currentTextColor =
                      rowIdx === 0 ? cd.textColor : cd.subRowText;
                    // ⭐ Determine border color: White for all rows
                    const currentBorderColor = "border-slate-500";

                    // Calculate percentage for LKTH color
                    const percentage =
                      row.lkkh > 0 ? (row.lkth / row.lkkh) * 100 : 0;

                    return (
                      <tr
                        key={`${cd.id}-${rowIdx}`}
                        // className={`${currentRowBg} border-b ${cd.borderColor}`}
                        className={`${currentRowBg} border-b ${currentBorderColor} ${currentTextColor}`}
                        style={{ height: getRowHeight() }}
                      >
                        {/* ⭐ CRITICAL: Cột TỔ - Hiển thị canBoQuanLy cho parent row */}
                        <td
                          // className={`border-r border-b ${cd.borderColor} text-center ${cd.bgColor} ${cd.textColor} px-1 overflow-hidden`}
                          className={`border-r border-b text-center  px-1 overflow-hidden ${currentBorderColor} ${getFlashClass(
                            `s2-${displayData.cdGroups.indexOf(
                              cd
                            )}-${rowIdx}-to`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1) }}
                        >
                          {row.to}
                        </td>
                        <td
                          className={`border-r border-b  ${currentBorderColor} font-semibold text-center overflow-hidden whitespace-nowrap ${getFlashClass(
                            `s2-${displayData.cdGroups.indexOf(
                              cd
                            )}-${rowIdx}-maHang`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1) }}
                        >
                          {row.maHang}
                        </td>
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center  overflow-hidden whitespace-nowrap ${getFlashClass(
                            `s2-${displayData.cdGroups.indexOf(
                              cd
                            )}-${rowIdx}-mau`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(0.9) }}
                        >
                          {row.mau}
                        </td>
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center overflow-hidden ${getFlashClass(
                            `s2-${displayData.cdGroups.indexOf(
                              cd
                            )}-${rowIdx}-tglv`
                          )}`}
                          style={{
                            fontSize: getDynamicFontSize(1.2),
                            letterSpacing: "0.08em",
                          }}
                        >
                          {row.tglv}
                        </td>
                        {/* ⭐ MERGED COLUMN DATA */}
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center overflow-hidden ${getFlashClass(
                            `s2-${displayData.cdGroups.indexOf(
                              cd
                            )}-${rowIdx}-ld`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(0.95) }}
                        >
                          {showLabor ? (
                            <div className="flex flex-col items-center justify-center leading-tight overflow-hidden">
                              <span className="whitespace-nowrap">
                                {dinhBien}/{coMat}
                              </span>
                              <span
                                className={`whitespace-nowrap ${
                                  diff < 0 ? "text-red-400" : "text-green-400"
                                }`}
                                style={{ fontSize: "1em" }}
                              >
                                {diff !== 0
                                  ? `(${diff > 0 ? `+${diff}` : diff})`
                                  : ""}
                              </span>
                            </div>
                          ) : (
                            ""
                          )}
                        </td>
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center overflow-hidden ${getFlashClass(
                            `s2-${displayData.cdGroups.indexOf(
                              cd
                            )}-${rowIdx}-targetNgay`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1.2) }}
                        >
                          {formatNumber(row.targetNgay)}
                        </td>
                        {/* <td
                          className={`border-r border-b border-slate-400 font-semibold text-center text-white overflow-hidden ${getFlashClass(`s2-${displayData.cdGroups.indexOf(cd)}-${rowIdx}-lkkh`)}`}
                          style={{ fontSize: getDynamicFontSize(1.2) }}
                        >
                          {formatNumber(row.lkkh)}
                        </td> */}
                        <td
                          className={`border-b ${currentBorderColor} font-bold text-center overflow-hidden ${getPercentageColorClass(
                            percentage
                          )} ${getFlashClass(
                            `s2-${displayData.cdGroups.indexOf(
                              cd
                            )}-${rowIdx}-lkth`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1.2) }}
                        >
                          {formatNumber(row.lkth)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: TRUNG TÂM ĐỒNG BỘ - 35% */}
        <div
          className="flex flex-col border-2 border-[#004d26] overflow-hidden rounded bg-slate-900 gap-1 text-white"
          style={{ width: "38%" }}
        >
          <div
            className="bg-[#004d26] border-b-2 border-slate-500 text-center flex items-center justify-center flex-shrink-0"
            style={{ height: "5vh" }}
          >
            <h2
              className="font-black leading-tight text-white"
              style={{ fontSize: getDynamicFontSize(1.1) }}
            >
              TRUNG TÂM ĐỒNG BỘ & ĐÁP ỨNG ĐẦU VÀO CHO MAY
            </h2>
          </div>
          <div className="flex flex-row overflow-hidden gap-0.25">
            <table
              className="w-[38.5%] border-collapse flex-shrink-0"
              style={{ tableLayout: "fixed", height: "7vh" }}
            >
              <thead>
                <tr
                  className="bg-[#006833] border-b-2 border-slate-500"
                  style={{ height: "7vh" }}
                >
                  <th
                    className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                    style={{
                      width: "10%",
                      fontSize: getDynamicFontSize(0.95),
                    }}
                  >
                    SL
                    <br />
                    TỒN
                  </th>
                  <th
                    className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                    style={{
                      width: "10%",
                      fontSize: getDynamicFontSize(0.95),
                    }}
                  >
                    NGÀY
                    <br />
                    TỒN
                  </th>
                  <th
                    className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                    style={{
                      width: "10%",
                      fontSize: getDynamicFontSize(0.95),
                    }}
                  >
                    NCĐV
                  </th>
                  <th
                    className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                    style={{
                      width: "10%",
                      fontSize: getDynamicFontSize(0.95),
                    }}
                  >
                    ĐBCỨ
                  </th>
                </tr>
              </thead>
            </table>
            <table
              className="w-[20%] border-collapse flex-shrink-0"
              style={{ tableLayout: "fixed", height: "7vh" }}
            >
              <thead>
                <tr
                  className="bg-[#006833] border-b-2 border-slate-500"
                  style={{ height: "6vh" }}
                >
                  
                  <th
                    className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                    style={{ width: "20%", fontSize: getDynamicFontSize(0.9) }}
                  >
                    {nextDays[0]}
                    <br />
                    <div className="flex flex-row items-center justify-center gap-2">
                      <span>NCĐV</span>
                      <span>ĐBCỨ</span>
                    </div>
                  </th>
                </tr>
              </thead>
            </table>

            <table
              className="w-[20%] border-collapse flex-shrink-0"
              style={{ tableLayout: "fixed", height: "7vh" }}
            >
              <thead>
                <tr
                  className="bg-[#006833] border-b-2 border-slate-500"
                  style={{ height: "6vh" }}
                >
                  <th
                    className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                    style={{ width: "20%", fontSize: getDynamicFontSize(0.9) }}
                  >
                    {nextDays[1]}
                    <br />
                    <div className="flex flex-row items-center justify-center gap-2">
                      <span>NCĐV</span>
                      <span>ĐBCỨ</span>
                    </div>
                  </th>
                </tr>
              </thead>
            </table>

            <table
              className="w-[20%] border-collapse flex-shrink-0"
              style={{ tableLayout: "fixed", height: "7vh" }}
            >
              <thead>
                <tr
                  className="bg-[#006833] border-b-2 border-slate-500"
                  style={{ height: "6vh" }}
                >
                  <th
                    className="border-r border-slate-500 font-bold text-center leading-tight text-white"
                    style={{ width: "20%", fontSize: getDynamicFontSize(0.9) }}
                  >
                    {nextDays[2]}
                    <br />
                    <div className="flex flex-row items-center justify-center gap-2">
                      <span>NCĐV</span>
                      <span>ĐBCỨ</span>
                    </div>
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="flex flex-row overflow-hidden gap-0.25 h-full">
            <table
              className="w-[38.5%] border-collapse h-full flex-shrink-0"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <col key={i} style={{ width: "10%" }} />
                  ))}
              </colgroup>
              <tbody>
                {displayData.cdGroups.map((cd: any, cdIdx: number) =>
                  cd.rows.map((row: any, rowIdx: number) => {
                    const supplyRow =
                      displayData.supplyChain[cdIdx]?.rows[rowIdx] || {};

                    // ⭐ Determine row background: Darker/Solid for parent (rowIdx === 0)
                    // const currentRowBg = rowIdx === 0 ? cd.parentRowBg : cd.rowBg;
                    const currentRowBg =
                      rowIdx === 0 ? cd.bgColor : cd.rowBg;

                    // ⭐ Determine text color: White for parent, Dark for subrows
                    const currentTextColor =
                      rowIdx === 0 ? cd.textColor : cd.subRowText;
                    // ⭐ Determine border color: White for all rows
                    const currentBorderColor = "border-slate-500";

                    return (
                      <tr
                        key={`${cdIdx}-${rowIdx}`}
                        className={`${currentRowBg} border-b ${currentBorderColor} ${currentTextColor}`}
                        style={{ height: getRowHeight() }}
                      >
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center overflow-hidden ${getFlashClass(
                            `s3-${cdIdx}-${rowIdx}-slTon`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(row.slTon)}
                        </td>
                        <td
                          className={`border-r border-b ${currentBorderColor} font-bold text-center overflow-hidden ${
                            row.dbNgay
                              ? getNgayTonColor(Number(row.dbNgay))
                              : ""
                          } ${getFlashClass(`s3-${cdIdx}-${rowIdx}-dbNgay`)}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {row.dbNgay}
                        </td>
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center overflow-hidden ${getFlashClass(
                            `s3-${cdIdx}-${rowIdx}-ncDv`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(supplyRow.ncDv) !== "0"
                            ? formatNumber(supplyRow.ncDv)
                            : ""}
                        </td>
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center 
                            ${getDbColor(supplyRow.dbCu, supplyRow.ncDv)}
                            overflow-hidden ${getFlashClass(
                              `s3-${cdIdx}-${rowIdx}-dbCu`
                            )}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(supplyRow.dbCu) !== "0"
                            ? formatNumber(supplyRow.dbCu)
                            : ""}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <table
              className="w-[20%] border-collapse h-full flex-shrink-0"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                {Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <col key={i} style={{ width: "10%" }} />
                  ))}
              </colgroup>
              <tbody>
                {displayData.cdGroups.map((cd: any, cdIdx: number) =>
                  cd.rows.map((row: any, rowIdx: number) => {
                    const supplyRow =
                      displayData.supplyChain[cdIdx]?.rows[rowIdx] || {};

                    // ⭐ Determine row background: Darker/Solid for parent (rowIdx === 0)
                    // const currentRowBg = rowIdx === 0 ? cd.parentRowBg : cd.rowBg;
                    const currentRowBg =
                      rowIdx === 0 ? cd.bgColor : cd.rowBg;

                    // ⭐ Determine text color: White for parent, Dark for subrows
                    const currentTextColor =
                      rowIdx === 0 ? cd.textColor : cd.subRowText;
                    // ⭐ Determine border color: White for all rows
                    const currentBorderColor = "border-slate-500";

                    return (
                      <tr
                        key={`${cdIdx}-${rowIdx}`}
                        className={`${currentRowBg} border-b ${currentBorderColor} ${currentTextColor}`}
                        style={{ height: getRowHeight() }}
                      >
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center overflow-hidden ${getFlashClass(
                            `s3-${cdIdx}-${rowIdx}-nc1`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(supplyRow.nc1) !== "0"
                            ? formatNumber(supplyRow.nc1)
                            : ""}
                        </td>
                        <td
                          className={`border-r border-b ${currentBorderColor} font-bold text-center  overflow-hidden ${getDbColor(
                            supplyRow.db1,
                            supplyRow.nc1
                          )} ${getFlashClass(`s3-${cdIdx}-${rowIdx}-db1`)}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(supplyRow.db1) !== "0"
                            ? formatNumber(supplyRow.db1)
                            : ""}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <table
              className="w-[20%] border-collapse h-full flex-shrink-0"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                {Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <col key={i} style={{ width: "10%" }} />
                  ))}
              </colgroup>
              <tbody>
                {displayData.cdGroups.map((cd: any, cdIdx: number) =>
                  cd.rows.map((row: any, rowIdx: number) => {
                    const supplyRow =
                      displayData.supplyChain[cdIdx]?.rows[rowIdx] || {};

                    // ⭐ Determine row background: Darker/Solid for parent (rowIdx === 0)
                    // const currentRowBg = rowIdx === 0 ? cd.parentRowBg : cd.rowBg;
                    const currentRowBg =
                      rowIdx === 0 ? cd.bgColor : cd.rowBg;

                    // ⭐ Determine text color: White for parent, Dark for subrows
                    const currentTextColor =
                      rowIdx === 0 ? cd.textColor : cd.subRowText;
                    // ⭐ Determine border color: White for all rows
                    const currentBorderColor = "border-slate-500";

                    return (
                      <tr
                        key={`${cdIdx}-${rowIdx}`}
                        className={`${currentRowBg} border-b ${currentBorderColor} ${currentTextColor}`}
                        style={{ height: getRowHeight() }}
                      >
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center overflow-hidden ${getFlashClass(
                            `s3-${cdIdx}-${rowIdx}-nc2`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(supplyRow.nc2) !== "0"
                            ? formatNumber(supplyRow.nc2)
                            : ""}
                        </td>
                        <td
                          className={`border-r border-b ${currentBorderColor} font-bold text-center  overflow-hidden ${getDbColor(
                            supplyRow.db2,
                            supplyRow.nc2
                          )} ${getFlashClass(`s3-${cdIdx}-${rowIdx}-db2`)}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(supplyRow.db2) !== "0"
                            ? formatNumber(supplyRow.db2)
                            : ""}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <table
              className="w-[20%] border-collapse h-full flex-shrink-0"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                {Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <col key={i} style={{ width: "10%" }} />
                  ))}
              </colgroup>
              <tbody>
                {displayData.cdGroups.map((cd: any, cdIdx: number) =>
                  cd.rows.map((row: any, rowIdx: number) => {
                    const supplyRow =
                      displayData.supplyChain[cdIdx]?.rows[rowIdx] || {};

                    // ⭐ Determine row background: Darker/Solid for parent (rowIdx === 0)
                    // const currentRowBg = rowIdx === 0 ? cd.parentRowBg : cd.rowBg;
                    const currentRowBg =
                      rowIdx === 0 ? cd.bgColor : cd.rowBg;

                    // ⭐ Determine text color: White for parent, Dark for subrows
                    const currentTextColor =
                      rowIdx === 0 ? cd.textColor : cd.subRowText;
                    // ⭐ Determine border color: White for parent, Slate-300 for subrows
                      const currentBorderColor = "border-slate-500";

                    return (
                      <tr
                        key={`${cdIdx}-${rowIdx}`}
                        className={`${currentRowBg} border-b ${currentBorderColor} ${currentTextColor}`}
                        style={{ height: getRowHeight() }}
                      >
                        <td
                          className={`border-r border-b ${currentBorderColor} font-semibold text-center overflow-hidden ${getFlashClass(
                            `s3-${cdIdx}-${rowIdx}-nc3`
                          )}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(supplyRow.nc3) !== "0"
                            ? formatNumber(supplyRow.nc3)
                            : ""}
                        </td>
                        <td
                          className={`border-b ${currentBorderColor} font-bold text-center overflow-hidden ${getDbColor(
                            supplyRow.db3,
                            supplyRow.nc3
                          )} ${getFlashClass(`s3-${cdIdx}-${rowIdx}-db3`)}`}
                          style={{ fontSize: getDynamicFontSize(1.1) }}
                        >
                          {formatNumber(supplyRow.db3) !== "0"
                            ? formatNumber(supplyRow.db3)
                            : ""}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
