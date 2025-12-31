"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Wifi, WifiOff } from "lucide-react";
import { useCDProductData } from "@/hooks/useCDProductData";
import { useTime } from "@/hooks/useTime";
import type { CDProduct } from "@/types/cd-product.types";
import LazyLoader from "@/components/common/LazyLoader";

interface TVDisplayCDProductProps {
  code: string; // cd1, cd2, cd3, cd4
  autoSlideInterval?: number; // Auto slide interval in ms (default 10s)
  refreshInterval?: number;
  tvMode?: boolean;
}

export default function TVDisplayCDProduct({
  code,
  autoSlideInterval = 10000, // 10 seconds per slide
  refreshInterval = 30000,
  tvMode = false,
}: TVDisplayCDProductProps) {
  const { minutes, hours } = useTime({});
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  const { data, loading, error, connected } = useCDProductData({
    code: code.toLowerCase(),
    enableRealtime: true,
    tvMode,
  });

  // Slide management
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ✅ FLASH DETECTION LOGIC (like TVDisplayHTM)
  const [flashingCells, setFlashingCells] = useState<Set<string>>(new Set());
  const prevDataRef = useRef<any>(null);

  // Get products from data
  const products = useMemo(() => data?.products || [], [data?.products]);
  const currentProduct = useMemo(
    () => (products.length > 0 ? products[currentSlide] : null),
    [products, currentSlide]
  );

  // ✅ Flash detection effect
  useEffect(() => {
    if (!data) return;

    if (!prevDataRef.current) {
      prevDataRef.current = data;
      return;
    }

    const prev = prevDataRef.current;
    const curr = data;
    const newFlashing = new Set<string>();

    const check = (key: string, val1: any, val2: any) => {
      if (val1 !== val2) {
        newFlashing.add(key);
      }
    };

    // Check metadata changes
    check("maChuyenLine", prev.maChuyenLine, curr.maChuyenLine);
    check("factory", prev.factory, curr.factory);
    check("line", prev.line, curr.line);
    check("to", prev.to, curr.to);
    check("totalProducts", prev.totalProducts, curr.totalProducts);

    // Check current product changes
    if (currentProduct && prev.products && prev.products[currentSlide]) {
      const prevProduct = prev.products[currentSlide];

      check("product-ma", prevProduct.ma, currentProduct.ma);
      check("product-mau", prevProduct.mau, currentProduct.mau);
      check("product-slkh", prevProduct.slkh, currentProduct.slkh);
      check(
        "product-nhuCauLuyKe",
        prevProduct.nhuCauLuyKe,
        currentProduct.nhuCauLuyKe
      );
      check(
        "product-tenChiTiet",
        prevProduct.tenChiTiet,
        currentProduct.tenChiTiet
      );
      check(
        "product-keHoachGiao",
        prevProduct.keHoachGiao,
        currentProduct.keHoachGiao
      );
      check(
        "product-luyKeGiao",
        prevProduct.luyKeGiao,
        currentProduct.luyKeGiao
      );
      check("product-conLai", prevProduct.conLai, currentProduct.conLai);
      check("product-ttdb", prevProduct.ttdb, currentProduct.ttdb);
      check("product-canXuLy", prevProduct.canXuLy, currentProduct.canXuLy);

      // Check details changes
      if (prevProduct.details && currentProduct.details) {
        currentProduct.details.forEach((detail, idx) => {
          const prevDetail = prevProduct.details[idx];
          if (prevDetail) {
            check(
              `detail-${idx}-nhuCauLuyKe`,
              prevDetail.nhuCauLuyKe,
              detail.nhuCauLuyKe
            );
            check(
              `detail-${idx}-tenChiTiet`,
              prevDetail.tenChiTiet,
              detail.tenChiTiet
            );
            check(
              `detail-${idx}-keHoachGiao`,
              prevDetail.keHoachGiao,
              detail.keHoachGiao
            );
            check(
              `detail-${idx}-luyKeGiao`,
              prevDetail.luyKeGiao,
              detail.luyKeGiao
            );
            check(`detail-${idx}-conLai`, prevDetail.conLai, detail.conLai);
            check(`detail-${idx}-ttdb`, prevDetail.ttdb, detail.ttdb);
            check(`detail-${idx}-canXuLy`, prevDetail.canXuLy, detail.canXuLy);
          }
        });
      }
    }

    if (newFlashing.size > 0) {
      console.log("🔄 Flash animation triggered for:", Array.from(newFlashing));
      setFlashingCells(newFlashing);
      setTimeout(() => setFlashingCells(new Set()), 2000); // Clear after 2s
    }

    prevDataRef.current = curr;
  }, [data, currentProduct, currentSlide]);

  // ✅ HELPER FUNCTIONS
  const getFlashClass = (key: string, baseClass: string = "") => {
    return flashingCells.has(key)
      ? `animate-flash-yellow ${baseClass}`
      : `transition-colors duration-500 ${baseClass}`;
  };

  // Auto-slide effect
  useEffect(() => {
    if (!tvMode || isPaused || products.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, autoSlideInterval);

    return () => clearInterval(intervalId);
  }, [tvMode, isPaused, products.length, autoSlideInterval]);

  // Reset slide when products change
  useEffect(() => {
    setCurrentSlide(0);
  }, [data?.lastUpdate]);

  // Navigation handlers
  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000); // Resume after 5s
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000); // Resume after 5s
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <LazyLoader message="Đang tải dữ liệu CD Product..." size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center bg-red-900/50 p-8 rounded-xl backdrop-blur-sm border border-red-500/50">
          <h1 className="text-4xl font-bold mb-4">Lỗi tải dữ liệu</h1>
          <p className="text-xl text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  // No products state
  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center bg-slate-800/50 p-8 rounded-xl backdrop-blur-sm border border-slate-600/50">
          <h1 className="text-4xl font-bold mb-4">Không có dữ liệu</h1>
          <p className="text-xl text-slate-300">Sheet {data?.sheet}</p>
        </div>
      </div>
    );
  }

  // Combine main product row with details for display
  const rawRows = [
    {
      type: "main",
      index: 0,
      tenChiTiet: currentProduct.tenChiTiet,
      keHoachGiao: currentProduct.keHoachGiao,
      luyKeGiao: currentProduct.luyKeGiao,
      conLai: currentProduct.conLai,
      ttdb: currentProduct.ttdb,
      canXuLy: currentProduct.canXuLy,
    },
    ...currentProduct.details.map((detail, idx) => ({
      type: "detail",
      index: idx,
      tenChiTiet: detail.tenChiTiet,
      keHoachGiao: detail.keHoachGiao,
      luyKeGiao: detail.luyKeGiao,
      conLai: detail.conLai,
      ttdb: detail.ttdb,
      canXuLy: detail.canXuLy,
    })),
  ];

  // Filter out rows with empty tenChiTiet and re-index
  const allRows = rawRows
    .filter((row) => row.tenChiTiet && row.tenChiTiet.trim() !== "")
    .map((row, idx) => ({
      stt: idx + 1,
      ...row,
    }));

  // ✅ Split into 2 tables if more than 15 rows
  const shouldSplit = allRows.length > 15;
  const splitIndex = shouldSplit
    ? Math.ceil(allRows.length / 2)
    : allRows.length;
  const leftRows = allRows.slice(0, splitIndex);
  const rightRows = shouldSplit ? allRows.slice(splitIndex) : [];

  // ✅ Compact mode for high density (13-15 rows per table)
  const rowsPerTable = shouldSplit ? Math.ceil(allRows.length / 2) : allRows.length;
  const isCompact = rowsPerTable > 12;

  const headerFontSize = isCompact 
    ? "clamp(0.65rem, 1.1vw, 1.3rem)" 
    : shouldSplit 
      ? "clamp(0.75rem, 1.3vw, 1.6rem)" 
      : "clamp(1rem, 1.8vw, 2.2rem)";

  const rowFontSize = isCompact
    ? "clamp(0.85rem, 1.4vw, 1.7rem)"
    : shouldSplit
      ? "clamp(1rem, 1.7vw, 2.1rem)"
      : "clamp(1.2rem, 2vw, 2.5rem)";

  return (
    <div
      className="h-screen w-screen text-white font-bold overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{
        display: "grid",
        gridTemplateRows: "clamp(100px, 15vh, 140px) 1fr",
        gap: "0",
        margin: 0,
        padding: "0",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div
        className="glass-header flex-shrink-0 z-20 rounded-none border-b border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        style={{ height: "100%" }}
      >
        <div
          className="grid gap-1 h-full items-center px-2 grid-cols-12"
          style={{ width: "100%", minWidth: 0, overflow: "hidden" }}
        >
          {/* Logo & Title */}
          <div className="col-span-6 h-full flex items-center gap-4">
            <div
              className="relative bg-white/95 rounded backdrop-blur-sm shadow-lg flex items-center justify-center flex-shrink-0"
              style={{
                width: "clamp(3rem, 5vw, 5rem)",
                height: "clamp(3rem, 5vw, 5rem)",
                aspectRatio: "1",
              }}
            >
              <Image
                src="/logo.png"
                alt="TBS GROUP Logo"
                width={80}
                height={80}
                priority
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>
            
            <h1
              className="font-black text-white leading-tight text-left"
              style={{ fontSize: "clamp(1.5rem, 2.5vw, 3rem)" }}
            >
              BẢNG THEO DÕI CHI TIẾT BTP TỔ {data?.sheet?.replace("CD", "CD")}{" "}
              {data?.factory}
            </h1>
          </div>

          {/* Metrics Card */}
          <div className="col-span-6 h-full flex items-center justify-end pr-2">
            <div className="metric-card-violet flex items-center justify-between px-4 py-1 w-full h-[90%] gap-2 shadow-lg">
              {/* Style */}
              <div className="flex flex-col items-center justify-center flex-1 min-w-0">
                <span className="text-purple-300 font-bold mb-0.5 tracking-wider" style={{ fontSize: "clamp(1.2rem, 1.6vw, 2rem)" }}>STYLE</span>
                <span className={getFlashClass("product-ma", "font-black text-white leading-none truncate w-full text-center")} style={{ fontSize: "clamp(1.5rem, 2.5vw, 3rem)" }}>
                  {currentProduct.ma}
                </span>
              </div>

              {/* Màu */}
              <div className="flex flex-col items-center justify-center border-l border-purple-500/30 pl-2 flex-1 min-w-0">
                <span className="text-purple-300 font-bold mb-0.5 tracking-wider" style={{ fontSize: "clamp(1.2rem, 1.6vw, 2rem)" }}>MÀU</span>
                <span className={getFlashClass("product-mau", "font-black text-white leading-none truncate w-full text-center")} style={{ fontSize: "clamp(1.5rem, 2.5vw, 3rem)" }}>
                  {currentProduct.mau}
                </span>
              </div>

              {/* SLKH */}
              <div className="flex flex-col items-center justify-center border-l border-purple-500/30 pl-2 flex-1 min-w-0">
                <span className="text-purple-300 font-bold mb-0.5 tracking-wider" style={{ fontSize: "clamp(1.2rem, 1.6vw, 2rem)" }}>SLKH</span>
                <span className={getFlashClass("product-slkh", "font-black text-white leading-none")} style={{ fontSize: "clamp(1.8rem, 3vw, 3.5rem)" }}>
                  {currentProduct.slkh.toLocaleString("de-DE")}
                </span>
              </div>

              {/* Nhu cầu lũy kế */}
              <div className="flex flex-col items-center justify-center border-l border-purple-500/30 pl-2 flex-1 min-w-0">
                <span className="text-purple-300 font-bold mb-0.5 text-center leading-tight tracking-wider" style={{ fontSize: "clamp(1.2rem, 1.6vw, 2rem)" }}>NC LŨY KẾ</span>
                <span className={getFlashClass("product-nhuCauLuyKe", "font-black text-white leading-none")} style={{ fontSize: "clamp(1.8rem, 3vw, 3.5rem)" }}>
                  {currentProduct.nhuCauLuyKe.toLocaleString("de-DE")}
                </span>
              </div>

              {/* Connection Status & Slide Info */}
              <div className="flex flex-col items-center justify-center border-l border-purple-500/30 pl-2 gap-1" style={{ minWidth: "clamp(3rem, 5vw, 5rem)" }}>
                <div className="flex items-center">
                  {connected ? (
                    <Wifi className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" style={{ width: "clamp(1.5rem, 2.5vw, 2.5rem)", height: "clamp(1.5rem, 2.5vw, 2.5rem)" }} />
                  ) : (
                    <WifiOff className="text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]" style={{ width: "clamp(1.5rem, 2.5vw, 2.5rem)", height: "clamp(1.5rem, 2.5vw, 2.5rem)" }} />
                  )}
                </div>
                {products.length > 1 && (
                  <div className="text-white/90 font-black tracking-widest" style={{ fontSize: "clamp(0.8rem, 1.2vw, 1.2rem)" }}>
                    {currentSlide + 1}/{products.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table(s) */}
      <div
        className={`flex-grow flex ${
          shouldSplit ? "gap-1" : ""
        } overflow-hidden`}
      >
        {/* Left/Single Table */}
        <div className={`${shouldSplit ? "flex-1" : "w-full"} overflow-hidden`}>
          <div className="metric-card-violet overflow-auto h-full shadow-2xl rounded-none border-t-0">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800 text-white backdrop-blur-md border-b border-slate-500">
                  <th
                    className="border border-slate-500 px-0.5 py-1 text-center font-black tracking-wider"
                    style={{
                      fontSize: headerFontSize,
                      width: "clamp(30px, 3.5vw, 50px)",
                    }}
                  >
                    STT
                  </th>
                  <th
                    className="border border-slate-500 px-0.5 py-1 text-center font-black tracking-wider"
                    style={{ 
                      fontSize: headerFontSize,
                      width: shouldSplit ? "clamp(140px, 26vw, 300px)" : "28%" 
                    }}
                  >
                    TÊN CT
                  </th>
                  <th
                    className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                    style={{
                      fontSize: headerFontSize,
                      width: shouldSplit ? "clamp(42px, 5.5vw, 70px)" : "clamp(50px, 7vw, 85px)",
                    }}
                  >
                    GIAO
                  </th>
                  <th
                    className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                    style={{
                      fontSize: headerFontSize,
                      width: shouldSplit ? "clamp(50px, 6.5vw, 80px)" : "clamp(60px, 8vw, 100px)",
                    }}
                  >
                    LK GIAO
                  </th>
                  <th
                    className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                    style={{
                      fontSize: headerFontSize,
                      width: shouldSplit ? "clamp(42px, 5.5vw, 70px)" : "clamp(50px, 7vw, 85px)",
                    }}
                  >
                    +/- CL
                  </th>
                  <th
                    className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                    style={{
                      fontSize: headerFontSize,
                      width: shouldSplit ? "clamp(42px, 5.5vw, 70px)" : "clamp(50px, 7vw, 85px)",
                    }}
                  >
                    TỒN
                  </th>
                  <th
                    className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                    style={{
                      fontSize: headerFontSize,
                      width: shouldSplit ? "clamp(55px, 7vw, 90px)" : "clamp(60px, 8vw, 100px)",
                    }}
                  >
                    CẦN XỬ LÝ
                  </th>
                </tr>
              </thead>
              <tbody>
                {leftRows.map((row, idx) => {
                  const isNegative = row.conLai < 0;
                  // Dark Theme for TV: Reduces glare, high contrast
                  const rowBgColor = isNegative
                    ? "bg-red-950/50" // Dark red for negative
                    : idx % 2 === 0
                    ? "bg-slate-900/80" // Very dark slate
                    : "bg-slate-800/80"; // Slightly lighter slate
                  const rowKey =
                    row.type === "main" ? "product" : `detail-${row.index}`;
                  
                  // Subtle borders for dark theme
                  const borderColor = "border-slate-700";

                  return (
                    <tr
                      key={idx}
                      className={`${rowBgColor} hover:bg-slate-700 transition-colors`}
                    >
                      <td
                        className={`border ${borderColor} px-0.5 py-0.5 text-center font-bold text-slate-300`}
                        style={{ fontSize: rowFontSize }}
                      >
                        {row.stt}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-tenChiTiet`,
                          `border ${borderColor} px-0.5 py-0.5 font-semibold text-white`
                        )}
                        style={{ fontSize: rowFontSize }}
                      >
                        {row.tenChiTiet}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-keHoachGiao`,
                          `border ${borderColor} px-0.5 py-0.5 text-center font-semibold text-slate-200`
                        )}
                        style={{ fontSize: rowFontSize }}
                      >
                        {row.keHoachGiao > 0
                          ? row.keHoachGiao.toLocaleString("de-DE")
                          : "-"}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-luyKeGiao`,
                          `border ${borderColor} px-0.5 py-0.5 text-center font-semibold text-cyan-400`
                        )}
                        style={{ fontSize: rowFontSize }}
                      >
                        {row.luyKeGiao > 0
                          ? row.luyKeGiao.toLocaleString("de-DE")
                          : "-"}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-conLai`,
                          `border ${borderColor} px-0.5 py-0.5 text-center font-bold ${
                            isNegative ? "text-red-400" : "text-white"
                          }`
                        )}
                        style={{ fontSize: rowFontSize }}
                      >
                        {row.conLai !== 0 ? row.conLai.toLocaleString("de-DE") : "-"}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-ttdb`,
                          `border ${borderColor} px-0.5 py-0.5 text-center font-semibold text-yellow-400`
                        )}
                        style={{ fontSize: rowFontSize }}
                      >
                        {row.ttdb > 0 ? row.ttdb.toLocaleString("de-DE") : ""}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-canXuLy`,
                          `border ${borderColor} px-0.5 py-0.5 text-center font-bold ${
                            row.canXuLy < 0 ? "text-red-400" : "text-white"
                          }`
                        )}
                        style={{ fontSize: rowFontSize }}
                      >
                        {row.canXuLy !== 0 ? row.canXuLy.toLocaleString("de-DE") : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table (if split) */}
        {shouldSplit && (
          <div className="flex-1 overflow-hidden">
            <div className="metric-card-violet overflow-auto h-full shadow-2xl rounded-none border-t-0">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-800 text-white backdrop-blur-md border-b border-slate-500">
                    <th
                      className="border border-slate-500 px-0.5 py-1 text-center font-black tracking-wider"
                      style={{
                        fontSize: headerFontSize,
                        width: "clamp(30px, 3.5vw, 50px)",
                      }}
                    >
                      STT
                    </th>
                    <th
                      className="border border-slate-500 px-0.5 py-1 text-center font-black tracking-wider"
                      style={{ 
                        fontSize: headerFontSize,
                        width: "clamp(140px, 26vw, 300px)"
                      }}
                    >
                      TÊN CT
                    </th>
                    <th
                      className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                      style={{
                        fontSize: headerFontSize,
                        width: "clamp(42px, 5.5vw, 70px)",
                      }}
                    >
                      GIAO
                    </th>
                    <th
                      className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                      style={{
                        fontSize: headerFontSize,
                        width: "clamp(50px, 6.5vw, 80px)",
                      }}
                    >
                      LK GIAO
                    </th>
                    <th
                      className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                      style={{
                        fontSize: headerFontSize,
                        width: "clamp(42px, 5.5vw, 70px)",
                      }}
                    >
                      +/- CL
                    </th>
                    <th
                      className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                      style={{
                        fontSize: headerFontSize,
                        width: "clamp(42px, 5.5vw, 70px)",
                      }}
                    >
                      TỒN
                    </th>
                    <th
                      className="border border-slate-500 px-0.5 py-0.5 text-center font-black tracking-wider"
                      style={{
                        fontSize: headerFontSize,
                        width: "clamp(55px, 7vw, 90px)",
                      }}
                    >
                      CẦN XỬ LÝ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rightRows.map((row, idx) => {
                    const isNegative = row.conLai < 0;
                    // Dark Theme for TV: Reduces glare, high contrast
                    const rowBgColor = isNegative
                      ? "bg-red-950/50" // Dark red for negative
                      : idx % 2 === 0
                      ? "bg-slate-900/80" // Very dark slate
                      : "bg-slate-800/80"; // Slightly lighter slate
                    const rowKey =
                      row.stt === 1 ? "product" : `detail-${row.stt - 2}`;
                    
                    // Subtle borders for dark theme
                    const borderColor = "border-slate-700";

                    return (
                      <tr
                        key={idx}
                        className={`${rowBgColor} hover:bg-slate-700 transition-colors`}
                      >
                        <td
                          className={`border ${borderColor} px-0.5 py-0.5 text-center font-bold text-slate-300`}
                          style={{ fontSize: rowFontSize }}
                        >
                          {row.stt}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-tenChiTiet`,
                            `border ${borderColor} px-0.5 py-0.5 font-semibold text-white`
                          )}
                          style={{ fontSize: rowFontSize }}
                        >
                          {row.tenChiTiet}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-keHoachGiao`,
                            `border ${borderColor} px-0.5 py-0.5 text-center font-semibold text-slate-200`
                          )}
                          style={{ fontSize: rowFontSize }}
                        >
                          {row.keHoachGiao > 0
                            ? row.keHoachGiao.toLocaleString("de-DE")
                            : "-"}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-luyKeGiao`,
                            `border ${borderColor} px-0.5 py-0.5 text-center font-semibold text-cyan-400`
                          )}
                          style={{ fontSize: rowFontSize }}
                        >
                          {row.luyKeGiao > 0
                            ? row.luyKeGiao.toLocaleString("de-DE")
                            : "-"}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-conLai`,
                            `border ${borderColor} px-0.5 py-0.5 text-center font-bold ${
                              isNegative ? "text-red-400" : "text-white"
                            }`
                          )}
                          style={{ fontSize: rowFontSize }}
                        >
                          {row.conLai !== 0 ? row.conLai.toLocaleString("de-DE") : "-"}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-ttdb`,
                            `border ${borderColor} px-0.5 py-0.5 text-center font-semibold text-yellow-400`
                          )}
                          style={{ fontSize: rowFontSize }}
                        >
                          {row.ttdb > 0 ? row.ttdb.toLocaleString("de-DE") : ""}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-canXuLy`,
                            `border ${borderColor} px-0.5 py-0.5 text-center font-bold ${
                              row.canXuLy < 0 ? "text-red-400" : "text-white"
                            }`
                          )}
                          style={{ fontSize: rowFontSize }}
                        >
                          {row.canXuLy !== 0
                            ? row.canXuLy.toLocaleString("de-DE")
                            : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons (show on hover) */}
      {products.length > 1 && isHovered && (
        <>
          <button
            onClick={goToPrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-800/80 hover:bg-cyan-500/20 text-cyan-400 p-4 rounded-full shadow-2xl transition-all duration-300 z-10 border border-cyan-500/30 backdrop-blur-sm"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goToNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-800/80 hover:bg-cyan-500/20 text-cyan-400 p-4 rounded-full shadow-2xl transition-all duration-300 z-10 border border-cyan-500/30 backdrop-blur-sm"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {products.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlide(idx);
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 5000);
              }}
              className={`rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? "bg-cyan-400 scale-125 shadow-lg shadow-cyan-400/50"
                  : "bg-slate-600/60 hover:bg-cyan-300/75"
              }`}
              style={{
                width: "clamp(10px, 1.2vw, 14px)",
                height: "clamp(10px, 1.2vw, 14px)",
              }}
            />
          ))}
        </div>
      )}

      {/* Pause Indicator */}
      {isPaused && products.length > 1 && (
        <div
          className="absolute top-24 right-6 bg-slate-700/80 backdrop-blur-sm text-cyan-300 px-4 py-2 rounded-lg shadow-lg border border-cyan-500/50"
          style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.2rem)" }}
        >
          ⏸️ Tạm dừng
        </div>
      )}
    </div>
  );
}
