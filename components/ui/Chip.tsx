"use client";
import React from "react";

export default function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 ring-1 ring-gray-200">
      {children}
    </span>
  );
}