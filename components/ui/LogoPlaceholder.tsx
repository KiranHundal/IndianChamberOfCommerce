import React from "react";
import Image from "next/image";

interface LogoPlaceholderProps {
  dark?: boolean;
}

export default function LogoPlaceholder({ dark = false }: LogoPlaceholderProps) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="CVICC"
        width={48}
        height={48}
        className="rounded-full"
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
