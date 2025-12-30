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
  const allRows = [
    {
      stt: 1,
      tenChiTiet: currentProduct.tenChiTiet || "-",
      keHoachGiao: currentProduct.keHoachGiao,
      luyKeGiao: currentProduct.luyKeGiao,
      conLai: currentProduct.conLai,
      ttdb: currentProduct.ttdb,
      canXuLy: currentProduct.canXuLy,
    },
    ...currentProduct.details.map((detail, idx) => ({
      stt: idx + 2,
      tenChiTiet: detail.tenChiTiet,
      keHoachGiao: detail.keHoachGiao,
      luyKeGiao: detail.luyKeGiao,
      conLai: detail.conLai,
      ttdb: detail.ttdb,
      canXuLy: detail.canXuLy,
    })),
  ];

  // ✅ Split into 2 tables if more than 15 rows
  const shouldSplit = allRows.length > 15;
  const splitIndex = shouldSplit
    ? Math.ceil(allRows.length / 2)
    : allRows.length;
  const leftRows = allRows.slice(0, splitIndex);
  const rightRows = shouldSplit ? allRows.slice(splitIndex) : [];

  return (
    <div
      className="h-screen w-screen text-white font-bold overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{
        display: "grid",
        gridTemplateRows: "clamp(100px, 15vh, 140px) 1fr",
        gap: "0.5rem",
        margin: 0,
        padding: "0.5rem",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div
        className="glass-header flex-shrink-0 z-20 rounded-xl"
        style={{ height: "100%" }}
      >
        <div
          className="grid gap-1 h-full items-center px-2 grid-cols-12"
          style={{ width: "100%", minWidth: 0, overflow: "hidden" }}
        >
          {/* Logo */}
          <div className="col-span-1 h-full flex flex-col items-center justify-between py-2">
            <div
              className="relative bg-white/95 rounded backdrop-blur-sm shadow-lg flex items-center justify-center"
              style={{
                width: "clamp(2.2rem, 4vw, 4.4rem)",
                height: "clamp(2.2rem, 4vw, 4.4rem)",
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
            <div className="text-center px-2 py-1">
              <div
                style={{ fontSize: "clamp(1.4rem, 2.5vw, 2.5rem)" }}
                className="font-black text-white leading-none"
                suppressHydrationWarning={true}
              >
                {formattedTime}
              </div>
            </div>
          </div>

          {/* Title & Info */}
          <div className="col-span-10 flex flex-col justify-center items-center gap-1 min-w-0">
            <h1
              className="font-black text-white text-center leading-tight"
              style={{ fontSize: "clamp(1.5rem, 3vw, 3.5rem)" }}
            >
              BẢNG THEO DÕI CHI TIẾT BTP TỔ {data?.sheet?.replace("CD", "CD")}{" "}
              {data?.factory}
            </h1>
            <div
              className="flex items-center justify-center gap-4 flex-wrap"
              style={{ fontSize: "clamp(1rem, 2vw, 2rem)" }}
            >
              <div className="font-semibold">
                <span className="text-red-400">STYLE</span>{" "}
                <span className={getFlashClass("product-ma", "text-cyan-300")}>
                  {currentProduct.ma}
                </span>
              </div>
              <div className="font-semibold">
                <span className="text-red-400">MÀU</span>{" "}
                <span className={getFlashClass("product-mau", "text-cyan-300")}>
                  {currentProduct.mau}
                </span>
              </div>
              <div className="font-semibold">
                <span className="text-red-400">SLKH</span>{" "}
                <span
                  className={getFlashClass("product-slkh", "text-cyan-300")}
                >
                  {currentProduct.slkh.toLocaleString()}
                </span>
              </div>
              <div className="font-semibold">
                <span className="text-red-400">NHU CẦU LŨY KẾ</span>{" "}
                <span
                  className={getFlashClass(
                    "product-nhuCauLuyKe",
                    "text-cyan-300"
                  )}
                >
                  {currentProduct.nhuCauLuyKe.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="col-span-1 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1">
              {connected ? (
                <Wifi
                  className="text-green-400"
                  style={{
                    width: "clamp(1.2rem, 2vw, 2rem)",
                    height: "clamp(1.2rem, 2vw, 2rem)",
                  }}
                />
              ) : (
                <WifiOff
                  className="text-red-400"
                  style={{
                    width: "clamp(1.2rem, 2vw, 2rem)",
                    height: "clamp(1.2rem, 2vw, 2rem)",
                  }}
                />
              )}
            </div>
            {products.length > 1 && (
              <div
                className="text-white/80 font-semibold text-center"
                style={{ fontSize: "clamp(0.7rem, 1.2vw, 1.2rem)" }}
              >
                {currentSlide + 1}/{products.length}
              </div>
            )}
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
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-2xl overflow-auto h-full border border-slate-700/50">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
                  <th
                    className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                    style={{
                      fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                      width: "clamp(40px, 5vw, 60px)",
                    }}
                  >
                    STT
                  </th>
                  <th
                    className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                    style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)" }}
                  >
                    TÊN CT
                  </th>
                  <th
                    className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                    style={{
                      fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                      width: "clamp(60px, 8vw, 100px)",
                    }}
                  >
                    GIAO
                  </th>
                  <th
                    className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                    style={{
                      fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                      width: "clamp(70px, 10vw, 120px)",
                    }}
                  >
                    LK GIAO
                  </th>
                  <th
                    className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                    style={{
                      fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                      width: "clamp(60px, 8vw, 100px)",
                    }}
                  >
                    +/- CL
                  </th>
                  <th
                    className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                    style={{
                      fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                      width: "clamp(60px, 8vw, 100px)",
                    }}
                  >
                    TỒN
                  </th>
                  <th
                    className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                    style={{
                      fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                      width: "clamp(70px, 10vw, 120px)",
                    }}
                  >
                    CẦN XỬ LÝ
                  </th>
                </tr>
              </thead>
              <tbody>
                {leftRows.map((row, idx) => {
                  const isNegative = row.conLai < 0;
                  const rowBgColor = isNegative
                    ? "bg-red-900/40"
                    : idx % 2 === 0
                    ? "bg-slate-700/30"
                    : "bg-slate-800/30";
                  const rowKey =
                    row.stt === 1 ? "product" : `detail-${row.stt - 2}`;

                  return (
                    <tr
                      key={idx}
                      className={`${rowBgColor} hover:bg-slate-600/40 transition-colors`}
                    >
                      <td
                        className="border border-slate-700 px-1 py-1 text-center font-bold text-white"
                        style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                      >
                        {row.stt}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-tenChiTiet`,
                          "border border-slate-700 px-1 py-1 font-semibold text-white"
                        )}
                        style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                      >
                        {row.tenChiTiet}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-keHoachGiao`,
                          "border border-slate-700 px-1 py-1 text-center font-semibold text-white"
                        )}
                        style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                      >
                        {row.keHoachGiao > 0
                          ? row.keHoachGiao.toLocaleString()
                          : "-"}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-luyKeGiao`,
                          "border border-slate-700 px-1 py-1 text-center font-semibold text-cyan-300"
                        )}
                        style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                      >
                        {row.luyKeGiao > 0
                          ? row.luyKeGiao.toLocaleString()
                          : "-"}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-conLai`,
                          `border border-slate-700 px-1 py-1 text-center font-bold ${
                            isNegative ? "text-red-400" : "text-white"
                          }`
                        )}
                        style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                      >
                        {row.conLai !== 0 ? row.conLai.toLocaleString() : "-"}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-ttdb`,
                          "border border-slate-700 px-1 py-1 text-center font-semibold text-amber-300"
                        )}
                        style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                      >
                        {row.ttdb > 0 ? row.ttdb.toLocaleString() : ""}
                      </td>
                      <td
                        className={getFlashClass(
                          `${rowKey}-canXuLy`,
                          `border border-slate-700 px-1 py-1 text-center font-bold ${
                            row.canXuLy < 0 ? "text-red-400" : "text-white"
                          }`
                        )}
                        style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                      >
                        {row.canXuLy !== 0 ? row.canXuLy.toLocaleString() : ""}
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
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-2xl overflow-auto h-full border border-slate-700/50">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
                    <th
                      className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                      style={{
                        fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                        width: "clamp(40px, 5vw, 60px)",
                      }}
                    >
                      STT
                    </th>
                    <th
                      className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                      style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)" }}
                    >
                      TÊN CT
                    </th>
                    <th
                      className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                      style={{
                        fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                        width: "clamp(60px, 8vw, 100px)",
                      }}
                    >
                      GIAO
                    </th>
                    <th
                      className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                      style={{
                        fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                        width: "clamp(70px, 10vw, 120px)",
                      }}
                    >
                      LK GIAO
                    </th>
                    <th
                      className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                      style={{
                        fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                        width: "clamp(60px, 8vw, 100px)",
                      }}
                    >
                      +/- CL
                    </th>
                    <th
                      className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                      style={{
                        fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                        width: "clamp(60px, 8vw, 100px)",
                      }}
                    >
                      TỒN
                    </th>
                    <th
                      className="border-2 border-slate-700 px-1 py-1 text-center font-black"
                      style={{
                        fontSize: "clamp(0.9rem, 1.5vw, 1.8rem)",
                        width: "clamp(70px, 10vw, 120px)",
                      }}
                    >
                      CẦN XỬ LÝ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rightRows.map((row, idx) => {
                    const isNegative = row.conLai < 0;
                    const rowBgColor = isNegative
                      ? "bg-red-900/40"
                      : idx % 2 === 0
                      ? "bg-slate-700/30"
                      : "bg-slate-800/30";
                    const rowKey =
                      row.stt === 1 ? "product" : `detail-${row.stt - 2}`;

                    return (
                      <tr
                        key={idx}
                        className={`${rowBgColor} hover:bg-slate-600/40 transition-colors`}
                      >
                        <td
                          className="border border-slate-700 px-1 py-1 text-center font-bold text-white"
                          style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                        >
                          {row.stt}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-tenChiTiet`,
                            "border border-slate-700 px-1 py-1 font-semibold text-white"
                          )}
                          style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                        >
                          {row.tenChiTiet}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-keHoachGiao`,
                            "border border-slate-700 px-1 py-1 text-center font-semibold text-white"
                          )}
                          style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                        >
                          {row.keHoachGiao > 0
                            ? row.keHoachGiao.toLocaleString()
                            : "-"}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-luyKeGiao`,
                            "border border-slate-700 px-1 py-1 text-center font-semibold text-cyan-300"
                          )}
                          style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                        >
                          {row.luyKeGiao > 0
                            ? row.luyKeGiao.toLocaleString()
                            : "-"}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-conLai`,
                            `border border-slate-700 px-1 py-1 text-center font-bold ${
                              isNegative ? "text-red-400" : "text-white"
                            }`
                          )}
                          style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                        >
                          {row.conLai !== 0 ? row.conLai.toLocaleString() : "-"}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-ttdb`,
                            "border border-slate-700 px-1 py-1 text-center font-semibold text-amber-300"
                          )}
                          style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                        >
                          {row.ttdb > 0 ? row.ttdb.toLocaleString() : ""}
                        </td>
                        <td
                          className={getFlashClass(
                            `${rowKey}-canXuLy`,
                            `border border-slate-700 px-1 py-1 text-center font-bold ${
                              row.canXuLy < 0 ? "text-red-400" : "text-white"
                            }`
                          )}
                          style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.6rem)" }}
                        >
                          {row.canXuLy !== 0
                            ? row.canXuLy.toLocaleString()
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
