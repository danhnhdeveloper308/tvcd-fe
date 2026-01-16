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

  // Determine which teams to display based on slideshow logic (MUST be before conditional returns)
  const teamsToDisplay = useMemo(() => {
    if (!data || !data.teams) return [];

    // Check if we need slideshow (more than 2 teams OR any team has tuiNhoGroups)
    const needsSlideshow = data.teams.length > 2 || data.teams.some(team => team.tuiNhoGroups.length > 0);

    if (!needsSlideshow) {
      // Display all teams if 2 or fewer and no tuiNho
      return data.teams;
    }

    // Slideshow mode: display only one team at a time
    return [data.teams[currentSlideIndex]];
  }, [data, currentSlideIndex]);

  // Calculate total LĐ Layout and LĐ Thực tế for all displayed teams (MUST be before conditional returns)
  const totalStats = useMemo(() => {
    if (!teamsToDisplay || teamsToDisplay.length === 0) {
      return { totalLdLayout: 0, totalLdThucTe: 0, tglv: 0 };
    }
    
    let totalLdLayout = 0;
    let totalLdThucTe = 0;
    let tglv = 0;
    
    teamsToDisplay.forEach(team => {
      const allGroups = [...team.fixedGroups, ...team.tuiNhoGroups];
      totalLdLayout += allGroups.reduce((sum, group) => sum + group.ldLayout, 0);
      totalLdThucTe += allGroups.reduce((sum, group) => sum + group.thucTe, 0);
      if (!tglv) tglv = team.tglv;
    });
    
    return { totalLdLayout, totalLdThucTe, tglv };
  }, [teamsToDisplay]);

  // Auto slide rotation for multiple teams
  useEffect(() => {
    if (!data || !data.teams || data.teams.length <= 2) {
      // No rotation needed if 2 or fewer teams
      return;
    }

    // Rotate slides every 30 seconds
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % data.teams.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [data]);

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

  // Render team table
  const renderTeamTable = (team: QSLTeam, teamIndex: number) => {
    const allGroups = [...team.fixedGroups, ...team.tuiNhoGroups];
    
    // Calculate SUM for this team only
    const teamLdLayout = allGroups.reduce((sum, group) => sum + group.ldLayout, 0);
    const teamLdThucTe = allGroups.reduce((sum, group) => sum + group.thucTe, 0);

    return (
      <div key={teamIndex} className="mb-1">
        {/* Table */}
        <div className="w-full">
          <table className="w-full border-collapse table-fixed">
            {/* Team Header Row - aligned with table columns, no borders */}
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-0.5 text-left font-black text-white text-[clamp(1rem,2.5vw,2rem)] w-[7%]">
                  {team.tenTo}
                </th>
                <th className="px-0.5 text-center w-[4%]">
                  <div className="flex items-center justify-center bg-blue-600/80 px-2 rounded">
                    <span className="text-[clamp(1rem,2.5vw,2rem)] font-black text-yellow-300">{teamLdLayout}</span>
                  </div>
                </th>
                <th className="px-0.5 text-center w-[4.5%]">
                  <div className="flex items-center justify-center bg-green-600/80 px-2 rounded">
                    <span className="text-[clamp(1rem,2.5vw,2rem)] font-black text-yellow-300">{teamLdThucTe}</span>
                  </div>
                </th>
                <th className="px-0.5 w-[4%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[3.5%]"></th>
                <th className="px-0.5 w-[5.5%]"></th>
                <th className="px-0.5 text-center w-[5.5%]">
                  <span className="text-[clamp(1rem,2.5vw,2rem)] font-semibold text-slate-300">TGLV</span>
                </th>
                <th className="px-0.5 text-center w-[4.5%]">
                  <span className="text-[clamp(1rem,2.5vw,2rem)] font-bold text-white">{team.tglv}</span>
                </th>
              </tr>
            </thead>
            {/* Header */}
            <thead>
              <tr className="bg-yellow-500">
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.875rem,1.6vw,1.375rem)] w-[7%]">
                  NHÓM
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[4%]">
                  LĐ LAYOUT
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[4.5%]">
                  THỰC TẾ
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[4%]">
                  KẾ HOẠCH
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  8H30
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  9H30
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  10H30
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  11H30
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  13H30
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  14H30
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  15H30
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  16H30
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  18H
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  19H
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[3.5%]">
                  20H
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[5.5%]">
                  LK KẾ HOẠCH
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[5.5%]">
                  LK THỰC HIỆN
                </th>
                <th className="border border-slate-600 px-0.5 py-0.5 text-center font-black text-slate-900 text-[clamp(0.75rem,1.4vw,1.25rem)] w-[4.5%]">
                  %HT
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {allGroups.map((group, groupIdx) => {
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

                return (
                  <tr
                    key={groupIdx}
                    className={groupIdx % 2 === 0 ? "bg-slate-700/20" : "bg-slate-800/20"}
                  >
                    <td className="border border-slate-600 px-0.5 py-0.5 text-center font-bold  text-cyan-300 text-[clamp(0.625rem,1.4vw,1.125rem)] shadow-md shadow-blue-900/50">
                      {group.nhom}
                    </td>
                    <td className="border border-slate-600 px-0.5 py-0.5 text-center font-semibold text-white text-[clamp(0.75rem,1.5vw,1.25rem)]">
                      {group.ldLayout !== 0 ? group.ldLayout : ''}
                    </td>
                    <td className="border border-slate-600 px-0.5 py-0.5 text-center font-semibold text-white text-[clamp(0.75rem,1.5vw,1.25rem)] relative">
                      <span>{group.thucTe !== 0 ? group.thucTe : ''}</span>
                      {ldDiff !== 0 && (
                        <span className={`absolute left-[calc(50%+1.5ch)] text-[clamp(0.75rem,1.5vw,1.25rem)] font-bold ${ldDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ({ldDiff > 0 ? '+' : ''}{ldDiff})
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-600 px-0.5 py-0.5 text-center font-semibold text-white text-[clamp(0.75rem,1.5vw,1.25rem)]">
                      {group.keHoach !== 0 ? group.keHoach : ''}
                    </td>
                    {/* Hourly data with color based on performance */}
                    {Object.entries(group.hourly).map(([key, value]) => {
                      const shouldShow = shouldShowTimeSlot(key);

                      if (!shouldShow || value === 0) {
                        return (
                          <td
                            key={key}
                            className="border border-slate-600 px-0.5 py-0.5 text-center font-bold bg-slate-700/30 text-white text-[clamp(0.75rem,1.5vw,1.25rem)]"
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
                            `border border-slate-600 px-0.5 py-0.5 text-center font-bold ${hourColor.bgColor} ${hourColor.textColor} transition-colors duration-300 text-[clamp(0.75rem,1.5vw,1.25rem)]`
                          )}
                        >
                          {value}
                        </td>
                      );
                    })}
                    {/* Summary */}

                    <td className="border border-slate-600 px-0.5 py-0.5 text-center font-semibold text-white text-[clamp(0.75rem,1.5vw,1.25rem)]">
                      {group.luyKeKeHoach !== 0 ? group.luyKeKeHoach : ''}
                    </td>
                    <td
                      className={getFlashClass(
                        `${team.tenTo}-${group.nhom}-luyKeThucHien`,
                        "border border-slate-600 px-0.5 py-0.5 text-center font-bold text-white transition-colors duration-300 text-[clamp(0.75rem,1.5vw,1.25rem)] relative"
                      )}
                    >
                      <span>{group.luyKeThucHien !== 0 ? group.luyKeThucHien : ''}</span>
                      {luyKeDiff !== 0 && (
                        <span className={`absolute left-[calc(50%+1.5ch)] text-[clamp(0.75rem,1.5vw,1.25rem)] font-bold ${luyKeDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ({luyKeDiff > 0 ? '+' : ''}{luyKeDiff})
                        </span>
                      )}
                    </td>
                    <td
                      className={getFlashClass(
                        `${team.tenTo}-${group.nhom}-percentHT`,
                        `border border-slate-600 px-0.5 py-0.5 text-center font-black ${percentColor.bgColor} ${percentColor.textColor} transition-colors duration-300 text-[clamp(0.875rem,1.6vw,1.5rem)]`
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
      </div>
    );
  };

  return (
    <div className="h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-0.5 shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          {/* Logo */}
          <Image src="/logo.png" alt="Logo" width={100} height={60} className="h-[clamp(1.5rem,4vw,3rem)] w-auto object-contain" priority />

          {/* Title */}
          <h1 className="text-[clamp(1rem,2.5vw,2rem)] font-black text-white text-center flex-1 leading-tight px-2">
            TIVI SẢN LƯỢNG NHÓM LINE {line}
            {data.teams.length > 0 &&
              ` - ${data.teams.map((t) => t.tenTo).join(" & ")}`}
          </h1>

          {/* Time & Date & TGLV */}
          <div className="text-right flex flex-col items-end gap-1">
            <div className="text-[clamp(1.25rem,3vw,2.5rem)] font-black text-white leading-tight">{formattedTime}</div>
            {/* <div className="text-[clamp(0.75rem,1.5vw,1.25rem)] font-semibold text-slate-300">{formattedDate}</div> */}
          </div>
        </div>

        {/* Slide indicator for slideshow mode */}
        {data && data.teams.length > 2 && (
          <div className="flex justify-center gap-1.5">
            {data.teams.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlideIndex
                  ? 'w-8 bg-yellow-500'
                  : 'w-1.5 bg-slate-600'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Teams Grid - No scroll, fit to screen */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {teamsToDisplay.map((team, idx) => renderTeamTable(team, idx))}
      </div>
    </div>
  );
}
