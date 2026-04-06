import React from "react";

type ButtonVariant = "primary" | "gold" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: React.ReactNode;
  className?: string;
  fullWidthMobile?: boolean;
  [key: string]: unknown;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-mid",
  gold: "bg-accent text-white hover:bg-gold-900",
  outline:
    "border border-ivory-200 text-brand hover:bg-brand hover:text-white",
  ghost:
    "text-white/70 hover:text-white border border-white/20 hover:border-white/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  children,
  className = "",
  fullWidthMobile = false,
  ...rest
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center",
    "font-label text-label tracking-label uppercase",
    "rounded-sm transition-all duration-normal",
    variantClasses[variant],
    sizeClasses[size],
    fullWidthMobile ? "w-full sm:w-auto" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
