import React from "react";

interface LogoPlaceholderProps {
  dark?: boolean;
}

export default function LogoPlaceholder({ dark = false }: LogoPlaceholderProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-14 h-14 rounded-full border-2 border-accent ${
          dark ? "bg-white/10" : "bg-brand"
        }`}
      />
      <div>
        <p
          className={`font-display italic text-lg leading-tight ${
            dark ? "text-white" : "text-brand"
          }`}
        >
          Central Valley
        </p>
        <p
          className={`font-label text-micro tracking-widest uppercase ${
            dark ? "text-white" : "text-accent"
          }`}
        >
          Indian Chamber of Commerce
        </p>
      </div>
    </div>
  );
}
