"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TVDisplayHTM from "@/components/tv-htm/TVDisplayHTM_Optimized";

function normalizeCodeFormat(code: string): string | undefined {
  if (!code) return undefined;
  return code.trim().toLocaleUpperCase();
}

function TVDisplayV3Content() {
  const searchParams = useSearchParams();
  const rawCode = searchParams.get("code");
  const factory = searchParams.get("factory") || undefined;
  const line = searchParams.get("line") || undefined;
  const team = searchParams.get("team") || undefined;
  const index = searchParams.get("index") || undefined; // NEW: Team index for ENDLINE filtering

  const maChuyenLine = rawCode ? normalizeCodeFormat(rawCode) : undefined;

  // CD lines: Backend returns 4 lines per factory automatically
  // HTM lines: Need factory, line, team params
  return (
    // <>
    //   {maChuyenLine?.includes("CD") ? (
    //     <TVDisplayCD
    //       key={`tv-cd-${maChuyenLine}`}
    //       maChuyenLine={maChuyenLine}
    //       refreshInterval={30000}
    //       tvMode={true}
    //     />
    //   ) : (
    <TVDisplayHTM
      key={`tv-htm-${maChuyenLine || factory}-${index || 'all'}`}
      maChuyenLine={maChuyenLine}
      factory={factory}
      line={line}
      team={team}
      index={index}
      refreshInterval={30000}
      tvMode={true}
    />
    //   )}
    // </>
  );
}

export default function TVDisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
          <div className="text-white text-2xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            Loading Modern Dashboard...
          </div>
        </div>
      }
    >
      <TVDisplayV3Content />
    </Suspense>
  );
}
