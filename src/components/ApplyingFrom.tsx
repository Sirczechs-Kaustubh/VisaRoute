"use client";

import { useState, useEffect } from "react";
import { SCHENGEN_APPLYING_FROM_OPTIONS } from "@/lib/applying-from-options";

export function ApplyingFrom() {
  const [applyingFrom, setApplyingFrom] = useState("gb");
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    // Simulate auto-detect - in production would use geo API
    const t = setTimeout(() => setDetecting(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {detecting ? (
        <span className="text-sm text-slate-500">Detecting location…</span>
      ) : (
        <>
          <span className="text-sm text-slate-500">Applying from</span>
          <select
            value={applyingFrom}
            onChange={(e) => setApplyingFrom(e.target.value)}
            className="rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-sm font-medium text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            aria-label="Applying from country"
          >
            {SCHENGEN_APPLYING_FROM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
