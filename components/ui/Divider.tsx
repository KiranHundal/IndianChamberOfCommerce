import React from "react";

interface DividerProps {
  className?: string;
}

export default function Divider({ className = "mx-auto" }: DividerProps) {
  return <div className={`w-16 h-px bg-accent ${className}`} />;
}
