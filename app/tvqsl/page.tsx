"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import TVDisplayQSL from "@/components/tv-qsl/TVDisplayQSL";
import LazyLoader from "@/components/common/LazyLoader";

function QSLDisplay() {
  const searchParams = useSearchParams();
  const lineParam = searchParams.get("line");
  const line = lineParam ? parseInt(lineParam, 10) : 1;

  // Validate line number
  if (isNaN(line) || line < 1 || line > 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">⚠️ Line không hợp lệ</h2>
          <p className="text-red-300 mb-4">
            Vui lòng chọn line từ 1 đến 4. Ví dụ: ?line=1
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            ← Quay về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return <TVDisplayQSL line={line} tvMode={true} />;
}

export default function QSLPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <LazyLoader message="Đang tải..." size="lg" />
        </div>
      }
    >
      <QSLDisplay />
    </Suspense>
  );
}
