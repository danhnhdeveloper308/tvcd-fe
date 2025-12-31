"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TVDisplayCDProduct from "@/components/tv-cd/TVDisplayCDProduct";
import LazyLoader from "@/components/common/LazyLoader";

function TVDisplayCDProductContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "cd1"; // Default to cd1

  // Normalize code to lowercase
  const normalizedCode = code.toLowerCase();

  // Validate code (cd1, cd2, cd3, cd4)
  const validCodes = ["cd1", "cd2", "cd3", "cd4"];
  if (!validCodes.includes(normalizedCode)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Invalid Code</h1>
          <p className="text-xl">Valid codes: cd1, cd2, cd3, cd4</p>
          <p className="text-lg mt-2">Current code: {code}</p>
        </div>
      </div>
    );
  }

  return (
    <TVDisplayCDProduct
      key={`tv-cd-product-${normalizedCode}`}
      code={normalizedCode}
      autoSlideInterval={20000} // 20 seconds per slide
      refreshInterval={30000}
      tvMode={true}
    />
  );
}

export default function TVDisplayCDProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
          <LazyLoader message="Đang tải CD Product Display..." size="lg" />
        </div>
      }
    >
      <TVDisplayCDProductContent />
    </Suspense>
  );
}
