"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";

interface SuccessToastProps {
  message: string;
  title?: string;
  onClose: () => void;
  duration?: number;
}

export default function SuccessToast({
  message,
  title = "ดำเนินการสำเร็จ",
  onClose,
  duration = 3000,
}: SuccessToastProps) {
  // Auto-dismiss logic
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center space-x-4 bg-[#EAFDF5] border-l-[6.5px] border-[#10B981] p-5 rounded-2xl shadow-xl w-full max-w-[440px] select-none font-sans border border-slate-100/50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-350">
      {/* Success circular checkmark (with subtle drop shadow) */}
      <div className="w-12 h-12 bg-[#10B981] text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
        <Check className="w-6 h-6 stroke-[3]" />
      </div>

      {/* Content Text labels */}
      <div className="flex flex-col flex-1 leading-tight">
        <span className="text-[15px] font-extrabold text-slate-800">
          {title}
        </span>
        <span className="text-[12.5px] text-slate-500 font-bold mt-1.5 leading-snug">
          {message}
        </span>
      </div>
    </div>
  );
}
