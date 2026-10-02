"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRigStore } from "@/store/useRigStore";
import { generateCsvManifest, generateMarkdownManifest } from "@/lib/export";
import {
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  Copy,
  Check,
  Download,
  Share2,
} from "lucide-react";

export function ExportModal() {
  const isOpen = useRigStore((s) => s.isExportModalOpen);
  const setOpen = useRigStore((s) => s.setExportModalOpen);
  const currentBike = useRigStore((s) => s.currentBike);
  const selectedSizeKey = useRigStore((s) => s.selectedSizeKey);
  const mountedBags = useRigStore((s) => s.mountedBags);
  const metrics = useRigStore((s) => s.metrics);
  const getShareableUrl = useRigStore((s) => s.getShareableUrl);

  const [activeTab, setActiveTab] = useState<"summary" | "markdown" | "csv">("summary");
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]'));
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const manifestData = {
    bike: currentBike,
    sizeKey: selectedSizeKey,
    mountedBags,
    metrics,
  };

  const mdContent = generateMarkdownManifest(manifestData);
  const csvContent = generateCsvManifest(manifestData);
  const shareUrl = getShareableUrl();

  function handleDownloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bikepack3d-${currentBike.id}-${selectedSizeKey}-manifest.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleCopyMarkdown() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(mdContent);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  }

  function handleCopyUrl() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  }

  return (
    <div className="export-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="export-title" tabIndex={-1} className="export-dialog bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <h2 id="export-title" className="text-base font-bold text-white">Export Gear Manifest & Share</h2>
            <p className="text-xs text-slate-400">
              {currentBike.brand} {currentBike.name} ({selectedSizeKey}) • {(metrics.totalRigWeightGrams / 1000).toFixed(2)} kg total
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close export dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="export-tabs flex border-b border-slate-800 bg-slate-950/40 px-4">
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "summary"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printable Summary</span>
          </button>
          <button
            onClick={() => setActiveTab("markdown")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "markdown"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown Table</span>
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "csv"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Spreadsheet</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="export-body flex-1 min-h-0 overflow-y-auto p-5">
          {/* TAB: SUMMARY / PRINT */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              {/* Shareable URL banner */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Shareable Rig Link
                  </div>
                  <div className="text-xs font-mono text-sky-400 truncate mt-0.5">
                    {shareUrl}
                  </div>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-1 shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? "Copied" : "Copy Link"}</span>
                </button>
              </div>

              {/* Manifest Table */}
              <div className="manifest-table border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/60">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Component</th>
                      <th className="p-2.5">Brand / Model</th>
                      <th className="p-2.5">Capacity</th>
                      <th className="p-2.5 text-right">Dry Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-2.5 font-bold text-white">Frame ({selectedSizeKey})</td>
                      <td className="p-2.5">{currentBike.brand} {currentBike.name}</td>
                      <td className="p-2.5">-</td>
                      <td className="p-2.5 text-right font-mono">{(currentBike.baseWeightGrams / 1000).toFixed(2)} kg</td>
                    </tr>
                    {Object.entries(mountedBags).map(([socketId, bag]) => (
                      <tr key={socketId}>
                        <td className="p-2.5 capitalize text-sky-300">{socketId}</td>
                        <td className="p-2.5">{bag.brand} {bag.name}</td>
                        <td className="p-2.5">{bag.volumeLiters} L</td>
                        <td className="p-2.5 text-right font-mono">{bag.dryWeightGrams} g</td>
                      </tr>
                    ))}
                    {metrics.payloadEstimateGrams > 0 && (
                      <tr>
                        <td className="p-2.5 font-semibold text-amber-300">Payload</td>
                        <td className="p-2.5">Estimated Sleep, Water & Food</td>
                        <td className="p-2.5">-</td>
                        <td className="p-2.5 text-right font-mono">{(metrics.payloadEstimateGrams / 1000).toFixed(2)} kg</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-900 border-t border-slate-700 font-bold text-white">
                    <tr>
                      <td className="p-2.5" colSpan={2}>
                        Total Capacity & Rig Weight
                      </td>
                      <td className="p-2.5 text-emerald-400">{metrics.totalCapacityLiters} L</td>
                      <td className="p-2.5 text-right text-emerald-400 font-mono">
                        {(metrics.totalRigWeightGrams / 1000).toFixed(2)} kg
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB: MARKDOWN */}
          {activeTab === "markdown" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Ready to paste into GitHub issues, forums, Reddit or packing lists:
                </span>
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  {copiedMd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMd ? "Copied Markdown" : "Copy Markdown"}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-72">
                {mdContent}
              </pre>
            </div>
          )}

          {/* TAB: CSV */}
          {activeTab === "csv" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Export gear list for spreadsheet budgeting and tracking:
                </span>
                <button
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV File</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre max-h-72">
                {csvContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center">
          <button
            onClick={() => { setActiveTab("summary"); requestAnimationFrame(() => window.print()); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <button
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
