"use client";

import { useEffect } from "react";
import { Trash2 } from "lucide-react";

interface DeleteToastProps {
  message?: string;
  title?: string;
  onClose: () => void;
  duration?: number;
}

export default function DeleteToast({
  message = "ระบบได้ทำการลบข้อมูลที่เลือกเรียบร้อยแล้ว",
  title = "ลบข้อมูลสำเร็จ",
  onClose,
  duration = 3000,
}: DeleteToastProps) {
  // Auto-dismiss logic
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center space-x-4 bg-[#FFF1F1] border-l-[6.5px] border-[#C21A1A] p-5 rounded-2xl shadow-xl w-full max-w-[440px] select-none font-sans border border-slate-100/50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-350">
      {/* Red circular/rounded icon container with trash (with subtle drop shadow) */}
      <div className="w-12 h-12 bg-[#C21A1A] text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
        <Trash2 className="w-5.5 h-5.5 stroke-[2.5]" />
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
