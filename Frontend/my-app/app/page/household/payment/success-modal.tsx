"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocalSuccessModal({ isOpen, onClose }: SuccessModalProps) {
  // Auto-dismiss and trigger the redirect (onClose) after 3 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Animated Green Checkmark Container */}
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-inner animate-bounce">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-800">
            ชำระเงินเรียบร้อยแล้ว
          </h3>
          <p className="text-[14px] text-slate-500 font-bold leading-relaxed">
            ระบบตรวจสอบการชำระเงินสำเร็จ<br />
            กำลังกลับไปที่หน้าเลือกรายการ...
          </p>
        </div>

        {/* 3-Second Loading Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <style>{`
            @keyframes shrinkWidth {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
          <div 
            className="bg-[#0B409C] h-full rounded-full" 
            style={{ animation: "shrinkWidth 3s linear forwards" }}
          />
        </div>

      </div>
    </div>
  );
}
