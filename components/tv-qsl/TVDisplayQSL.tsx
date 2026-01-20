"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useQSLData } from "@/hooks/useQSLData";
import { useTime } from "@/hooks/useTime";
import LazyLoader from "@/components/common/LazyLoader";
import type { QSLTeam, QSLGroup } from "@/types/qsl.types";
import { getPercentageColor } from "@/lib/utils";

interface TVDisplayQSLProps {
  line: number; // 1, 2, 3, 4...
  refreshInterval?: number;
  tvMode?: boolean;
}

export default function TVDisplayQSL({
  line,
  refreshInterval = 30000,
  tvMode = false,
}: TVDisplayQSLProps) {
  const { minutes, hours } = useTime({});
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  // Get current date and time
  const now = new Date();
  const day = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const formattedDate = `${day}/${month}`;

  // Current time for checking hourly data display
  const currentHour = hours;
  const currentMinute = minutes;

  // Slide show state for multiple teams
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [countdown, setCountdown] = useState(30);

  // TV mode detection: URL param ?tvmode=1 or CSS media query
  const [isTVMode, setIsTVMode] = useState(false);

  useEffect(() => {
    // Check URL parameter
    const params = new URLSearchParams(window.location.search);
    const tvParam = params.get('tvmode');
    if (tvParam === '1') {
      setIsTVMode(true);
    } else {
      // Auto-detect via media query for small screens (TV scaled mode)
      const mediaQuery = window.matchMedia('(max-width: 1000px)');
      setIsTVMode(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setIsTVMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Helper function to check if time slot should be displayed
  const shouldShowTimeSlot = (timeSlot: string): boolean => {
    // After 7:00 AM, show ALL time slots (don't check if time has passed)
    // Before 7:00 AM, hide all time slots
    return currentHour >= 7;
  };

  const { data, loading, error, connected } = useQSLData({
    line,
    enableRealtime: true,
    tvMode,
  });

  // ✅ FLASH DETECTION LOGIC
  const [flashingCells, setFlashingCells] = useState<Set<string>>(new Set());
  const prevDataRef = useRef<any>(null);

  // Slide structure: each slide contains team info and groups to display
  interface TeamSlide {
    teams: Array<{ team: QSLTeam; groups: QSLGroup[] }>; // Support multiple teams per slide
    slideLabel: string; // e.g., "TỔ 7 & TỔ 8", "TỔ 7 - TÚI NHỎ (1/2)"
  }

  // Create slides array - one slide per team (display all rows together)
  const slides = useMemo((): TeamSlide[] => {
    if (!data || !data.teams) return [];

    // Helper function to check if a team has all zero values
    const isTeamEmpty = (team: QSLTeam): boolean => {
      const allGroups = [...team.fixedGroups, ...team.tuiNhoGroups];
      
      // Check if all groups have all values as 0
      return allGroups.every(group => {
        // Check basic fields
        const basicFieldsZero = group.ldLayout === 0 && 
                                group.thucTe === 0 && 
                                group.keHoach === 0 &&
                                group.luyKeThucHien === 0 &&
                                group.luyKeKeHoach === 0 &&
                                group.percentHT === 0;
        
        // Check all hourly values
        const hourlyValuesZero = Object.values(group.hourly).every(val => val === 0);
        
        return basicFieldsZero && hourlyValuesZero;
      });
    };

    // Filter out teams with all zero values
    const activeTeams = data.teams.filter(team => !isTeamEmpty(team));

    if (activeTeams.length === 0) return [];

    const allSlides: TeamSlide[] = [];

    // Check if we can display all teams together (no tuiNho and reasonable row count)
    const canDisplayAllTogether = activeTeams.every(team => {
      return team.tuiNhoGroups.length === 0 && team.fixedGroups.length <= 9;
    }) && activeTeams.length <= 2;

    if (canDisplayAllTogether) {
      // Display all teams together in one slide
      allSlides.push({
        teams: activeTeams.map(team => ({
          team,
          groups: [...team.fixedGroups, ...team.tuiNhoGroups],
        })),
        slideLabel: activeTeams.map(t => t.tenTo).join(' & '),
      });
      return allSlides;
    }

    // Create one slide per team - display fixedGroups + tuiNhoGroups together
    activeTeams.forEach((team) => {
      const hasTuiNho = team.tuiNhoGroups.length > 0;
      
      // Combine all groups (9 fixed + 8 tuiNho = 17 rows if has tuiNho)
      const allGroups = [...team.fixedGroups, ...team.tuiNhoGroups];
      
      // const label = hasTuiNho 
      //   ? `${team.tenTo} (${team.fixedGroups.length} + ${team.tuiNhoGroups.length} TÚI NHỎ)` 
      //   : team.tenTo;
      const label = team.tenTo;
      
      allSlides.push({
        teams: [{ team, groups: allGroups }],
        slideLabel: label,
      });
    });

    return allSlides;
  }, [data]);

  // Current slide to display
  const currentSlide = useMemo(() => {
    if (slides.length === 0) return null;
    return slides[currentSlideIndex % slides.length];
  }, [slides, currentSlideIndex]);

  // Calculate total LĐ Layout and LĐ Thực tế for current slide (MUST be before conditional returns)
  const totalStats = useMemo(() => {
    if (!currentSlide || currentSlide.teams.length === 0) {
      return { totalLdLayout: 0, totalLdThucTe: 0, tglv: 0 };
    }

    let totalLdLayout = 0;
    let totalLdThucTe = 0;
    const tglv = currentSlide.teams[0].team.tglv; // Use first team's TGLV

    currentSlide.teams.forEach(({ groups }) => {
      totalLdLayout += groups.reduce((sum, group) => sum + group.ldLayout, 0);
      totalLdThucTe += groups.reduce((sum, group) => sum + group.thucTe, 0);
    });

    return { totalLdLayout, totalLdThucTe, tglv };
  }, [currentSlide]);

  // Auto slide rotation
  useEffect(() => {
    if (slides.length <= 1) {
      // No slideshow needed if only 1 or 0 slides
      return;
    }

    // Reset countdown when changing slides
    setCountdown(30);

    // Countdown timer (updates every second)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    // Rotate slides every 30 seconds
    const slideInterval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      setCountdown(30);
    }, 30000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(slideInterval);
    };
  }, [slides.length, currentSlideIndex]);

  // Flash detection effect
  useEffect(() => {
    if (!data || !prevDataRef.current) {
      prevDataRef.current = data;
      return;
    }

    const newFlashingCells = new Set<string>();
    const currentTeams = data.teams;
    const prevTeams = prevDataRef.current.teams;

    currentTeams.forEach((team: QSLTeam, teamIdx: number) => {
      const prevTeam = prevTeams[teamIdx];
      if (!prevTeam) return;

      // Check fixed groups
      team.fixedGroups.forEach((group: QSLGroup, groupIdx: number) => {
        const prevGroup = prevTeam.fixedGroups[groupIdx];
        if (!prevGroup) return;

        // Check hourly data
        const hourKeys = [
          "h8h30",
          "h9h30",
          "h10h30",
          "h11h30",
          "h13h30",
          "h14h30",
          "h15h30",
          "h16h30",
          "h18h",
          "h19h",
          "h20h",
        ];

        hourKeys.forEach((hourKey) => {
          const key = hourKey as keyof typeof group.hourly;
          if (group.hourly[key] !== prevGroup.hourly[key]) {
            newFlashingCells.add(`${team.tenTo}-${group.nhom}-${hourKey}`);
          }
        });

        // Check summary fields
        if (group.luyKeThucHien !== prevGroup.luyKeThucHien) {
          newFlashingCells.add(`${team.tenTo}-${group.nhom}-luyKeThucHien`);
        }
        if (group.percentHT !== prevGroup.percentHT) {
          newFlashingCells.add(`${team.tenTo}-${group.nhom}-percentHT`);
        }
      });

      // Check tuiNhoGroups
      team.tuiNhoGroups.forEach((group: QSLGroup, groupIdx: number) => {
        const prevGroup = prevTeam.tuiNhoGroups[groupIdx];
        if (!prevGroup) return;

        const hourKeys = [
          "h8h30",
          "h9h30",
          "h10h30",
          "h11h30",
          "h13h30",
          "h14h30",
          "h15h30",
          "h16h30",
          "h18h",
          "h19h",
          "h20h",
        ];

        hourKeys.forEach((hourKey) => {
          const key = hourKey as keyof typeof group.hourly;
          if (group.hourly[key] !== prevGroup.hourly[key]) {
            newFlashingCells.add(`${team.tenTo}-${group.nhom}-${hourKey}`);
          }
        });

        if (group.luyKeThucHien !== prevGroup.luyKeThucHien) {
          newFlashingCells.add(`${team.tenTo}-${group.nhom}-luyKeThucHien`);
        }
        if (group.percentHT !== prevGroup.percentHT) {
          newFlashingCells.add(`${team.tenTo}-${group.nhom}-percentHT`);
        }
      });
    });

    setFlashingCells(newFlashingCells);
    prevDataRef.current = data;

    // Remove flash after 2 seconds
    if (newFlashingCells.size > 0) {
      const timer = setTimeout(() => {
        setFlashingCells(new Set());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Helper function to get flash class
  const getFlashClass = (key: string, baseClass: string = "") => {
    return flashingCells.has(key)
      ? `${baseClass} animate-flash bg-green-400/30`
      : baseClass;
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <LazyLoader message={`Đang tải dữ liệu LINE ${line}...`} size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">❌ Lỗi kết nối</h2>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.teams || data.teams.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">⚠️ Không có dữ liệu</h2>
          <p className="text-slate-300">Chưa có dữ liệu cho LINE {line}</p>
        </div>
      </div>
    );
  }

  // Render team table for current slide
  const renderTeamTable = (teamData: { team: QSLTeam; groups: QSLGroup[] }) => {
    const { team, groups } = teamData;

    // Calculate SUM for this team's groups only
    const teamLdLayout = groups.reduce((sum, group) => sum + group.ldLayout, 0);
    const teamLdThucTe = groups.reduce((sum, group) => sum + group.thucTe, 0);
    const teamLdDiff = teamLdThucTe - teamLdLayout;

    return (
      <>
        {/* Table */}
        <div className={`w-full flex-1 overflow-hidden qsl-display ${isTVMode ? 'tv-dense' : ''}`}>
          <table className="w-full border-collapse table-fixed">
            {/* Team Header Row - aligned with table columns, no borders */}
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-0 text-left w-[10%] h-full">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
                    <span className={`font-black text-cyan-300 ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>{team.tenTo}</span>
                  </div>
                </th>
                <th className="px-0 text-center w-[7%]">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-1 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
                    <span className={`font-black text-cyan-300 ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>{teamLdLayout}</span>
                  </div>
                </th>
                <th className="px-0 text-center w-[7%]">
                  <div className="flex items-center justify-center gap-1 bg-cyan-500/10 border-1 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
                    <span className={`font-black text-cyan-300 ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>
                      {teamLdThucTe}
                    </span>
                    {teamLdDiff !== 0 && (
                      <span className={`inline-flex items-center justify-center px-1 py-0.5 rounded-md font-bold ${isTVMode ? 'text-[clamp(0.55rem,1.1vw,0.95rem)]' : 'text-[clamp(0.65rem,1.3vw,1.1rem)]'} ${teamLdDiff > 0 ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>
                        {teamLdDiff > 0 ? '+' : ''}{teamLdDiff}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-0 py-1 w-[5%]">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
                    <span className={`font-black text-cyan-300 ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>TGLV</span>
                  </div>
                </th>
                <th className="px-0 w-[4.5%]">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-1 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
                    <span className={`font-black text-cyan-300 ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>{team.tglv}</span>
                  </div>
                </th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[4.5%]"></th>
                <th className="px-0.5 py-0 w-[7%]"></th>
                <th className="px-0.5 py-0 w-[7%]"></th>
                <th className="px-0.5 py-0 w-[4%]"></th>
                <th className="px-0.5 py-0 text-center w-[7.5%]">
                 {/* <span className={`font-semibold text-slate-300 ${isTVMode ? 'text-[clamp(0.7rem,1.5vw,1.3rem)]' : 'text-[clamp(0.875rem,1.8vw,1.5rem)]'}`}>TGLV: </span> */}
                  {/* <span className={`font-bold text-white ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.875rem,2vw,1.75rem)]'}`}>{team.tglv}</span> */}
                </th>
              </tr>
            </thead>
            {/* Header */}
            <thead>
              <tr className="bg-yellow-500">
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[10%] leading-[1] ${isTVMode ? 'text-[clamp(0.6rem,1.15vw,0.95rem)]' : 'text-[clamp(0.8rem,1.7vw,1.4rem)]'}`}>
                  NHÓM
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[7%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  LĐ LAYOUT
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[7%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  THỰC TẾ
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[5.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  K.HOẠCH
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  8H30
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  9H30
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  10H30
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  11H30
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  13H30
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  14H30
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  15H30
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  16H30
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  18H
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  19H
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[4.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  20H
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[7%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  LKKH
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[7%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  LKTH
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[3.5%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  +/- LK
                </th>
                <th className={`border border-slate-600 px-0.5 py-0 text-center font-black text-slate-900 w-[3%] leading-[1] ${isTVMode ? 'text-[clamp(0.55rem,1.05vw,0.85rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                  %HT
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {groups.map((group, groupIdx) => {
                // Skip row if LĐ Layout, Thực tế, and Kế hoạch are all 0
                // OR if LKTH, LKKH, and %HT are all 0
                if (
                  (group.ldLayout === 0 && group.thucTe === 0 && group.keHoach === 0) ||
                  (group.luyKeThucHien === 0 && group.luyKeKeHoach === 0 && group.percentHT === 0)
                ) {
                  return null;
                }

                // Check if this is the first tuiNho group (add separator before it)
                const isFirstTuiNhoGroup = team.tuiNhoGroups.length > 0 && groupIdx === team.fixedGroups.length;

                // Calculate differences
                const ldDiff = group.thucTe - group.ldLayout;
                const luyKeDiff = group.luyKeThucHien - group.luyKeKeHoach;

                // Get color for %HT
                const percentColor = getPercentageColor(group.percentHT);

                // Helper function to get hourly color based on percentage vs plan
                const getHourlyColor = (hourlyValue: number) => {
                  if (group.keHoach === 0) return { bgColor: 'bg-slate-700/30', textColor: 'text-white' };
                  const percentage = (hourlyValue / group.keHoach) * 100;
                  return getPercentageColor(percentage);
                };

                // Check if this is a QC group that needs highlighting
                const isQCGroup = group.nhom === 'QC KIỂM TÚI' || group.nhom === 'QC KIỂM QUAI';
                
                // Check if this row belongs to tuiNhoGroups
                const isTuiNhoRow = groupIdx >= team.fixedGroups.length;

                return (
                  <React.Fragment key={groupIdx}>
                    {/* Separator row before first TÚI NHỎ group */}
                    {isFirstTuiNhoGroup && (
                      <tr className="bg-gradient-to-r from-purple-900/40 via-purple-800/80 to-purple-900/60 border-y-2 border-purple-500">
                        <td colSpan={19} className="py-0 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-black text-purple-300 tracking-wider ${isTVMode ? 'text-[clamp(0.6rem,1.2vw,1rem)]' : 'text-[clamp(0.75rem,1.4vw,1.2rem)]'}`}>
                              ━━━━━ TÚI NHỎ ━━━━━
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    <tr
                      className={`${isQCGroup ? 'bg-cyan-900/10' : (isTuiNhoRow ? 'bg-purple-900/10' : (groupIdx % 2 === 0 ? 'bg-slate-700/20' : 'bg-slate-800/20'))}`}
                    >
                      <td className={`qsl-nhom-cell border border-slate-600 px-0.5 py-0 text-center font-black leading-[1] shadow-md ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300 shadow-cyan-900/50' : (isTuiNhoRow ? 'bg-purple-500/20 text-purple-300 shadow-purple-900/50' : 'text-cyan-300 shadow-blue-900/50')} ${isTVMode ? 'text-[clamp(0.6rem,1.25vw,1.05rem)]' : 'text-[clamp(0.7rem,1.4vw,1.15rem)]'}`}>
                        {group.nhom}
                      </td>
                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-semibold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : (isTuiNhoRow ? 'bg-purple-500/20 text-purple-300' : 'text-white')} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {group.ldLayout !== 0 ? group.ldLayout : ''}
                    </td>
                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-semibold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : (isTuiNhoRow ? 'bg-purple-500/20 text-purple-300' : 'text-white')} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {group.thucTe !== 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <span>{group.thucTe}</span>
                          {ldDiff !== 0 && (
                            <span className={`inline-flex items-center justify-center px-1 py-0.5 rounded font-extrabold ${isTVMode ? 'text-[clamp(0.5rem,1vw,0.85rem)]' : 'text-[clamp(0.6rem,1.15vw,0.95rem)]'} ${ldDiff > 0 ? 'bg-green-500/25 text-green-200 border border-green-400/50 shadow-sm shadow-green-500/30' : 'bg-red-500/25 text-red-200 border border-red-400/50 shadow-sm shadow-red-500/30'}`}>
                              {ldDiff > 0 ? '+' : ''}{ldDiff}
                            </span>
                          )}
                        </div>
                      ) : ''}
                    </td>
                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-semibold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : (isTuiNhoRow ? 'bg-purple-500/20 text-purple-300' : 'text-white')} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {group.keHoach !== 0 ? group.keHoach : ''}
                    </td>
                    {/* Hourly data with color based on performance */}
                    {Object.entries(group.hourly).map(([key, value]) => {
                      const shouldShow = shouldShowTimeSlot(key);

                      if (!shouldShow) {
                        return (
                          <td
                            key={key}
                            className={`border border-slate-600 px-0.5 py-0 text-center font-bold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : (isTuiNhoRow ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700/30 text-white')} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}
                          >
                          </td>
                        );
                      }

                      // Show empty cell if no value, but still show the cell (don't hide it)
                      if (!value || value === 0) {
                        return (
                          <td
                            key={key}
                            className={`border border-slate-600 px-0.5 py-0 text-center font-bold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : (isTuiNhoRow ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700/30 text-white')} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}
                          >
                          </td>
                        );
                      }

                      const hourColor = getHourlyColor(value);
                      return (
                        <td
                          key={key}
                          className={getFlashClass(
                            `${team.tenTo}-${group.nhom}-${key}`,
                            // `border border-slate-600 px-0.5 py-0 text-center font-bold ${isQCGroup ? 'ring-2 ring-inset ring-cyan-400/40' : ''} ${hourColor.bgColor} ${hourColor.textColor} transition-colors duration-300 leading-[1] ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`
                            `border border-slate-600 px-0.5 py-0 text-center font-bold ${isQCGroup ? 'ring-inset ring-cyan-400/40' : ''} ${hourColor.bgColor} ${hourColor.textColor} transition-colors duration-300 leading-[1] ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`
                          )}
                        >
                          {value}
                        </td>
                      );
                    })}
                    {/* Summary */}

                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-semibold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : (isTuiNhoRow ? 'bg-purple-500/20 text-purple-300' : 'text-white')} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {group.luyKeKeHoach !== 0 ? group.luyKeKeHoach : ''}
                    </td>
                    <td
                      className={getFlashClass(
                        `${team.tenTo}-${group.nhom}-luyKeThucHien`,
                        `border border-slate-600 px-0.5 py-0 text-center font-bold transition-colors duration-300 leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : (isTuiNhoRow ? 'bg-purple-500/20 text-purple-300' : 'text-white')} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`
                      )}
                    >
                      {group.luyKeThucHien !== 0 ? group.luyKeThucHien : ''}
                    </td>
                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-bold leading-[1] ${isQCGroup ? 'bg-cyan-500/20' : (isTuiNhoRow ? 'bg-purple-500/20' : '')} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {luyKeDiff !== 0 && (
                        <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md font-extrabold ${isTVMode ? 'text-[clamp(0.6rem,1.2vw,1rem)]' : 'text-[clamp(0.75rem,1.4vw,1.15rem)]'} ${luyKeDiff > 0 ? 'bg-green-500/30 text-green-100 border border-green-400/60 shadow-md shadow-green-500/40' : 'bg-red-500/30 text-red-100 border border-red-400/60 shadow-md shadow-red-500/40'}`}>
                          {luyKeDiff > 0 ? '+' : ''}{luyKeDiff}
                        </span>
                      )}
                    </td>
                    <td
                      className={getFlashClass(
                        `${team.tenTo}-${group.nhom}-percentHT`,
                        `qsl-percent-cell border border-slate-600 px-0.5 py-0 text-center font-black ${percentColor.bgColor} ${percentColor.textColor} transition-colors duration-300 leading-[1] ${isTVMode ? 'text-[clamp(0.75rem,1.5vw,1.3rem)]' : 'text-[clamp(0.95rem,1.7vw,1.4rem)]'}`
                      )}
                    >
                      {group.percentHT}%
                    </td>
                  </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // Don't render if no slide available
  if (!currentSlide) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">⚠️ Không có dữ liệu</h2>
          <p className="text-slate-300">Chưa có dữ liệu cho LINE {line}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden relative ${isTVMode ? 'tv-dense p-0.5' : 'p-2'}`}>
      {/* TV Mode Indicator */}
      {isTVMode && new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tvmode') === '1' && (
        <div className="absolute top-2 right-2 bg-purple-900/90 text-white px-3 py-1 rounded-full text-xs z-50 font-bold border border-purple-400/50">
          📺 TV Mode
        </div>
      )}
      {/* Header */}
      <div className="mb-0 shrink-0">
        <div className="flex items-center justify-between mb-0">
          {/* Logo */}
          <div
            className="relative bg-white/95 rounded backdrop-blur-sm shadow-lg flex items-center justify-center flex-shrink-0"
            style={{
              width: isTVMode ? 'clamp(1rem,2.5vw,2rem)' : 'clamp(1.5rem,3.5vw,3rem)',
              height: isTVMode ? 'clamp(1rem,2.5vw,2rem)' : 'clamp(1.5rem,3.5vw,3rem)',
              aspectRatio: "1",
            }}
          >
          <Image
            src="/logo.png"
            alt="Logo"
            // width={isTVMode ? 80 : 100}
            // height={isTVMode ? 48 : 60}
            width={80}
            height={80}
            className={`w-auto object-contain ${isTVMode ? 'h-[clamp(1rem,2.5vw,2rem)]' : 'h-[clamp(1.5rem,3.5vw,3rem)]'}`}
            priority
          />
        </div>
        {/* Title */}
        <h1 className={`font-black text-white text-center flex-1 leading-tight px-1 ${isTVMode ? 'text-[clamp(0.75rem,1.8vw,1.5rem)]' : 'text-[clamp(1.25rem,2.5vw,2.25rem)]'}`}>
          BÁO CÁO SẢN LƯỢNG NHÓM LINE {line} - {currentSlide.slideLabel}
        </h1>

        {/* Time */}
        <div className="text-right flex flex-col items-end gap-0">
          <div className={`font-black text-white leading-tight ${isTVMode ? 'text-[clamp(1rem,2.2vw,2rem)]' : 'text-[clamp(1.5rem,3vw,2.75rem)]'}`}>{formattedTime}</div>
        </div>
      </div>

      {/* Slide indicator for slideshow mode */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1 mt-0">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlideIndex
                ? 'w-6 bg-yellow-500'
                : 'w-1 bg-slate-600'
                }`}
            />
          ))}
        </div>
      )}
    </div>

      {/* Teams Grid - No scroll, fit to screen with max height */ }
  <div className="flex-1 flex flex-col gap-0.5 min-h-0 overflow-hidden">
    {currentSlide.teams.map((teamData, idx) => (
      <div key={idx} className="flex-1 overflow-hidden flex flex-col">
        {renderTeamTable(teamData)}
      </div>
    ))}
  </div>

  {/* Slide transition notification - show in last 5 seconds */ }
  {
    slides.length > 1 && countdown <= 5 && (
      <div className="absolute bottom-4 right-4 bg-linear-to-r from-yellow-400 to-orange-500 text-slate-900 px-6 py-3 rounded-lg shadow-2xl border-2 border-yellow-300">
        <div className="text-[clamp(1rem,1.8vw,1.5rem)] font-black flex items-center gap-2">
          <span>Chuyển sang</span>
          <span className="text-red-600 bg-white px-3 py-1 rounded-md shadow-inner">
            {slides[(currentSlideIndex + 1) % slides.length].slideLabel}
          </span>
          <span>sau {countdown}s</span>
        </div>
      </div>
    )
  }
    </div >
  );
}
