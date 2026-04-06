import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  dark?: boolean;
}

export default function SectionLabel({
  children,
  dark = false,
}: SectionLabelProps) {
  return (
    <p
      className={`font-label text-label tracking-widest uppercase ${
        dark ? "text-gold-600" : "text-accent"
      }`}
    >
      {children}
    </p>
  );
}
