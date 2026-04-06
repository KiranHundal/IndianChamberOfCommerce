import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export default function SectionTitle({
  children,
  dark = false,
  className = "",
}: SectionTitleProps) {
  return (
    <h2
      className={`font-display text-h2 md:text-h1 font-light ${
        dark ? "text-white" : "text-brand"
      } ${className}`}
    >
      {children}
    </h2>
  );
}
