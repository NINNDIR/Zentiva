"use client";

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "light" | "dark" | "navy";
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  variant = "navy",
  className = "",
}) => {
  const dimensions = {
    sm: { iconWidth: 28, iconHeight: 28, text: "text-lg", gap: "gap-2" },
    md: { iconWidth: 36, iconHeight: 36, text: "text-xl", gap: "gap-2.5" },
    lg: { iconWidth: 48, iconHeight: 48, text: "text-2xl", gap: "gap-3" },
    xl: { iconWidth: 64, iconHeight: 64, text: "text-3xl", gap: "gap-4" },
  }[size];

  const textColor = variant === "light" ? "text-slate-900" : "text-white";

  return (
    <div className={`flex items-center ${dimensions.gap} ${className}`}>
      {/* Official Zentiva Logo Image from public/resources */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        <img
          src="/resources/solologo.png"
          alt="Zentiva Logo"
          width={dimensions.iconWidth}
          height={dimensions.iconHeight}
          className="object-contain transform transition-transform hover:scale-105 duration-200"
          onError={(e) => {
            // Fallback to logo.png if solologo.png fails
            (e.currentTarget as HTMLImageElement).src = "/resources/logo.png";
          }}
        />
      </div>

      {/* Clean Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold tracking-tight font-sans ${dimensions.text} leading-none ${textColor} flex items-center`}>
            <span>ZENT</span>
            <span className="text-cyan-400 font-black">IVA</span>
            <span className="ml-1 inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
          </div>
          <span className="text-[9px] tracking-[0.2em] text-cyan-400 font-mono uppercase mt-1 font-semibold">
            Trabajo Social Escolar
          </span>
        </div>
      )}
    </div>
  );
};
