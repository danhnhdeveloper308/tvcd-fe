"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
    const timeMap: { [key: string]: { hour: number; minute: number } } = {
      h8h30: { hour: 8, minute: 30 },
      h9h30: { hour: 9, minute: 30 },
      h10h30: { hour: 10, minute: 30 },
      h11h30: { hour: 11, minute: 30 },
      h13h30: { hour: 13, minute: 30 },
      h14h30: { hour: 14, minute: 30 },
      h15h30: { hour: 15, minute: 30 },
      h16h30: { hour: 16, minute: 30 },
      h18h: { hour: 18, minute: 0 },
      h19h: { hour: 19, minute: 0 },
      h20h: { hour: 20, minute: 0 },
    };

    const slotTime = timeMap[timeSlot];
    if (!slotTime) return false;

    // Check if current time has passed the slot time
    if (currentHour > slotTime.hour) return true;
    if (currentHour === slotTime.hour && currentMinute >= slotTime.minute) return true;
    return false;
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

  // Create slides array with pagination (max 9 rows per slide)
  const slides = useMemo((): TeamSlide[] => {
    if (!data || !data.teams) return [];

    const MAX_ROWS_PER_SLIDE = 9;
    const allSlides: TeamSlide[] = [];

    // Check if we can display all teams together (each team ≤9 rows and no tuiNho)
    const canDisplayAllTogether = data.teams.every(team => {
      const totalRows = team.fixedGroups.length + team.tuiNhoGroups.length;
      return totalRows <= MAX_ROWS_PER_SLIDE && team.tuiNhoGroups.length === 0;
    });

    if (canDisplayAllTogether && data.teams.length <= 2) {
      // Display all teams together in one slide
      allSlides.push({
        teams: data.teams.map(team => ({
          team,
          groups: [...team.fixedGroups, ...team.tuiNhoGroups],
        })),
        slideLabel: data.teams.map(t => t.tenTo).join(' & '),
      });
      return allSlides;
    }

    // Need to split into separate slides per team
    data.teams.forEach((team) => {
      const totalGroups = [...team.fixedGroups, ...team.tuiNhoGroups];
      const hasTuiNho = team.tuiNhoGroups.length > 0;

      // If total rows ≤ 9 and no tuiNho, display all in one slide
      if (totalGroups.length <= MAX_ROWS_PER_SLIDE && !hasTuiNho) {
        allSlides.push({
          teams: [{ team, groups: totalGroups }],
          slideLabel: team.tenTo,
        });
        return;
      }

      // Need to split into multiple slides
      // First, display fixedGroups (may need pagination if > 9)
      const fixedGroupChunks: QSLGroup[][] = [];
      for (let i = 0; i < team.fixedGroups.length; i += MAX_ROWS_PER_SLIDE) {
        fixedGroupChunks.push(team.fixedGroups.slice(i, i + MAX_ROWS_PER_SLIDE));
      }

      fixedGroupChunks.forEach((chunk, index) => {
        const label = fixedGroupChunks.length > 1
          ? `${team.tenTo} (${index + 1}/${fixedGroupChunks.length})`
          : team.tenTo;
        allSlides.push({
          teams: [{ team, groups: chunk }],
          slideLabel: label,
        });
      });

      // Then, display tuiNhoGroups if exists (may need pagination if > 9)
      if (hasTuiNho) {
        const tuiNhoChunks: QSLGroup[][] = [];
        for (let i = 0; i < team.tuiNhoGroups.length; i += MAX_ROWS_PER_SLIDE) {
          tuiNhoChunks.push(team.tuiNhoGroups.slice(i, i + MAX_ROWS_PER_SLIDE));
        }

        tuiNhoChunks.forEach((chunk, index) => {
          const label = tuiNhoChunks.length > 1
            ? `${team.tenTo} - TÚI NHỎ (${index + 1}/${tuiNhoChunks.length})`
            : `${team.tenTo} - TÚI NHỎ`;
          allSlides.push({
            teams: [{ team, groups: chunk }],
            slideLabel: label,
          });
        });
      }
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
                <th className="px-0 py-1 text-left w-[10%]">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-2 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full overflow-hidden">
                    <span className={`font-black text-cyan-300 truncate ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>{team.tenTo}</span>
                  </div>
                </th>
                <th className="px-0 py-1 text-center w-[7%]">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-2 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
                    <span className={`font-black text-cyan-300 ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>{teamLdLayout}</span>
                  </div>
                </th>
                <th className="px-0 py-1 text-center w-[7%]">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-2 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
                    <span className={`font-black text-cyan-300 ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>
                      {teamLdThucTe}
                      {teamLdDiff !== 0 && (
                        <span className={`ml-0.5 ${isTVMode ? 'text-[clamp(0.6rem,1.3vw,1.1rem)]' : 'text-[clamp(0.7rem,1.5vw,1.3rem)]'} font-bold ${teamLdDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({teamLdDiff > 0 ? '+' : ''}{teamLdDiff})
                        </span>
                      )}
                    </span>
                  </div>
                </th>
                <th className="px-0 py-1 w-[5%]">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-2 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
                    <span className={`font-black text-cyan-300 ${isTVMode ? 'text-[clamp(0.75rem,1.6vw,1.4rem)]' : 'text-[clamp(0.85rem,1.9vw,1.7rem)]'}`}>TGLV</span>
                  </div>
                </th>
                <th className="px-0 py-1 w-[4.5%]">
                  <div className="flex items-center justify-center bg-cyan-500/10 border-2 border-cyan-400/60 px-2 py-1 rounded shadow-lg shadow-cyan-500/20 h-full">
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
                if (group.ldLayout === 0 && group.thucTe === 0 && group.keHoach === 0) {
                  return null;
                }

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

                return (
                  <tr
                    key={groupIdx}
                    className={groupIdx % 2 === 0 ? "bg-slate-700/20" : "bg-slate-800/20"}
                  >
                    <td className={`qsl-nhom-cell border border-slate-600 px-0.5 py-0 text-center font-black leading-[1] shadow-md ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300 shadow-cyan-900/50' : 'text-cyan-300 shadow-blue-900/50'} ${isTVMode ? 'text-[clamp(0.6rem,1.25vw,1.05rem)]' : 'text-[clamp(0.7rem,1.4vw,1.15rem)]'}`}>
                      {group.nhom}
                    </td>
                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-semibold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : 'text-white'} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {group.ldLayout !== 0 ? group.ldLayout : ''}
                    </td>
                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-semibold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : 'text-white'} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {group.thucTe !== 0 ? (
                        <>
                          {group.thucTe}
                          {ldDiff !== 0 && (
                            <span className={`ml-1 ${isTVMode ? 'text-[clamp(0.55rem,1.15vw,0.95rem)]' : 'text-[clamp(0.7rem,1.3vw,1.05rem)]'} font-bold ${ldDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ({ldDiff > 0 ? '+' : ''}{ldDiff})
                            </span>
                          )}
                        </>
                      ) : ''}
                    </td>
                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-semibold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : 'text-white'} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {group.keHoach !== 0 ? group.keHoach : ''}
                    </td>
                    {/* Hourly data with color based on performance */}
                    {Object.entries(group.hourly).map(([key, value]) => {
                      const shouldShow = shouldShowTimeSlot(key);

                      if (!shouldShow || value === 0) {
                        return (
                          <td
                            key={key}
                            className={`border border-slate-600 px-0.5 py-0 text-center font-bold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700/30 text-white'} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}
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

                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-semibold leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : 'text-white'} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {group.luyKeKeHoach !== 0 ? group.luyKeKeHoach : ''}
                    </td>
                    <td
                      className={getFlashClass(
                        `${team.tenTo}-${group.nhom}-luyKeThucHien`,
                        `border border-slate-600 px-0.5 py-0 text-center font-bold transition-colors duration-300 leading-[1] ${isQCGroup ? 'bg-cyan-500/20 text-cyan-300' : 'text-white'} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`
                      )}
                    >
                      {group.luyKeThucHien !== 0 ? group.luyKeThucHien : ''}
                    </td>
                    <td className={`border border-slate-600 px-0.5 py-0 text-center font-bold leading-[1] ${isQCGroup ? 'bg-cyan-500/20' : ''} ${isTVMode ? 'text-[clamp(0.65rem,1.3vw,1.1rem)]' : 'text-[clamp(0.8rem,1.5vw,1.25rem)]'}`}>
                      {luyKeDiff !== 0 && (
                        <span className={luyKeDiff > 0 ? 'text-green-500' : 'text-red-500'}>
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
