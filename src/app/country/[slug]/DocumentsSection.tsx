"use client";

import { useState } from "react";
import type { VisaType } from "@/data/documents";
import type { DocumentRequirement } from "@/data/documents";

interface DocumentsSectionProps {
  documentsByType: Record<VisaType, DocumentRequirement[]>;
  visaTypeLabels: Record<VisaType, string>;
}

export function DocumentsSection({
  documentsByType,
  visaTypeLabels,
}: DocumentsSectionProps) {
  const [visaType, setVisaType] = useState<VisaType>("short-stay-tourism");

  const documents = documentsByType[visaType] ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm mb-10">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Documents needed</h2>
      <p className="text-sm text-slate-600 mb-4">
        Checklists are for <span className="font-medium text-slate-900">Indian passport holders</span>{" "}
        (visa required). Choose a visa type to see documents.
      </p>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Visa type</label>
          <select
            value={visaType}
            onChange={(e) => setVisaType(e.target.value as VisaType)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {(Object.keys(visaTypeLabels) as VisaType[]).map((type) => (
              <option key={type} value={type}>
                {visaTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="space-y-3">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
          >
            <span
              className={
                doc.required
                  ? "text-amber-600 font-medium"
                  : "text-slate-500"
              }
            >
              {doc.required ? "Required" : "Optional"}
            </span>
            <div>
              <p className="font-medium text-slate-900">{doc.name}</p>
              <p className="text-sm text-slate-600">{doc.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
