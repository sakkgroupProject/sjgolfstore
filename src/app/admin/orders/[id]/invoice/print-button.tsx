"use client";
import React from "react";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button 
      onClick={() => window.print()}
      className="mt-8 px-6 py-2 bg-black text-white rounded font-medium text-sm hover:bg-gray-800 print:hidden transition-colors shadow"
    >
      {label}
    </button>
  );
}
