import React from "react";
import { cn } from "@/lib/utils";

export type LogoSize = "small" | "medium" | "large";

interface ShareAByteLogoProps {
  size?: LogoSize;
  className?: string;
}

export const ShareAByteLogo: React.FC<ShareAByteLogoProps> = ({ 
  size = "medium", 
  className 
}) => {
  const sizeClasses = {
    small: "h-8",
    medium: "h-12",
    large: "h-16"
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-2 group cursor-pointer",
        sizeClasses[size],
        className
      )}
    >
      {/* Simple fork with circular border icon */}
      <div className="relative transition-transform duration-300 ease-in-out group-hover:scale-110">
        <svg 
          viewBox="0 0 24 24" 
          className={cn(
            "transition-colors duration-300",
            size === "small" ? "w-7" : size === "medium" ? "w-9" : "w-12"
          )}
        >
          <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="1.5" fill="none" /> {/* Circle border */}
          <path 
            d="M8,5 L8,9 M12,5 L12,9 M16,5 L16,9 M12,9 L12,19" 
            stroke="#16a34a" 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none"
            className="group-hover:stroke-green-500" 
          /> {/* Fork */}
        </svg>
      </div>
      
      {/* Logo text */}
      <div className="flex flex-col">
        <span 
          className={cn(
            "font-bold tracking-tight text-green-600 group-hover:text-green-500 transition-colors duration-300",
            size === "small" ? "text-xl" : size === "medium" ? "text-2xl" : "text-4xl"
          )}
        >
          Share<span className="text-green-400 group-hover:text-green-300 transition-colors duration-300">A</span>Byte
        </span>
        {size !== "small" && (
          <span 
            className={cn(
              "text-green-500 font-medium translate-y-[-2px] transition-colors duration-300 group-hover:text-green-400",
              size === "medium" ? "text-xs" : "text-sm"
            )}
          >
            Share food, reduce waste
          </span>
        )}
      </div>
    </div>
  );
};

export default ShareAByteLogo;