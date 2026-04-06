import React from "react";

type BadgeVariant = "navy" | "gold" | "dark" | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  navy: "bg-navy-100 text-brand",
  gold: "bg-gold-100 text-accent",
  dark: "bg-brand text-white",
  outline: "border border-ivory-200 text-mid",
};

export default function Badge({
  variant = "navy",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-block font-label text-micro tracking-label uppercase rounded-full px-3 py-1 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
