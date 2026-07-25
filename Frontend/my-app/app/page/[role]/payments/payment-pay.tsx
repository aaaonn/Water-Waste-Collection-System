"use client";

import { useState, useEffect } from "react";
import { Check, Download, ShieldCheck, HelpCircle, CheckCircle } from "lucide-react";
import { getPaymentStatus } from "../../../service/payment";

interface PaymentPayProps {
  qrCodeUrl: string;
  amount: number;
  invoiceId: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PaymentPay({ qrCodeUrl, amount, invoiceId, onConfirm, onCancel }: PaymentPayProps) {
  const [timeLeft, setTimeLeft] = useState(899); // 14 minutes 59 seconds in seconds

  // Live countdown timer matching "QR Code จะหมดอายุใน 14:59"
  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // Listen for real-time payment status updates via Server-Sent Events (SSE)
  // Fallback to short polling if SSE is blocked or unsupported by the browser.
  useEffect(() => {
    if (!invoiceId) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let eventSource: EventSource | null = null;

    const startPolling = () => {
      if (pollInterval) return;
      console.log("Fallback: Starting short polling for payment status (Staff)...");
      pollInterval = setInterval(async () => {
        try {
          const res = await getPaymentStatus(invoiceId);
          if (res.status === "success") {
            if (pollInterval) clearInterval(pollInterval);
            onConfirm();
          }
        } catch (err) {
          console.error("Error polling payment status fallback (Staff):", err);
        }
      }, 4000); // Poll every 4 seconds in fallback mode
    };

    // Check if EventSource is supported by browser
    if (typeof window !== "undefined" && !!window.EventSource) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const token = localStorage.getItem("token");
      const streamUrl = `${baseUrl}/payments/stream/${invoiceId}${token ? `?token=${token}` : ""}`;

      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener("payment_status", (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === "success") {
            eventSource?.close();
            if (pollInterval) clearInterval(pollInterval);
            onConfirm();
          }
        } catch (err) {
          console.error("Error parsing SSE payment status (Staff):", err);
        }
      });

      eventSource.onerror = (err) => {
        console.warn("EventSource connection failed, falling back to polling (Staff).", err);
        eventSource?.close();
        startPolling(); // Switch to short polling immediately
      };
    } else {
      // Browser doesn't support SSE, fallback to polling directly
      startPolling();
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [invoiceId, onConfirm]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8 font-sans select-none">

      {/* 2-Step Progress Indicator bar */}
      <div className="max-w-xs mx-auto py-4 font-sans select-none">

        {/* Row of Circles and Connector Line */}
        <div className="flex items-center relative">

          {/* Step 1 Circle (Completed Checkmark) */}
          <div className="w-9 h-9 rounded-full bg-[#0B409C] text-white flex items-center justify-center font-extrabold text-[13px] shadow-md z-10 relative">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>

          {/* Active Connector Line */}
          <div className="flex-1 h-[3px] bg-[#0B409C] z-0" />

          {/* Step 2 Circle (Active) */}
          <div className="w-9 h-9 rounded-full bg-[#0B409C] text-white flex items-center justify-center font-extrabold text-[13px] shadow-md ring-4 ring-blue-100/35 z-10 relative">
            2
          </div>

        </div>

        {/* Row of Labels */}
        <div className="flex justify-between mt-2.5 text-center text-[12px] font-extrabold">
          <span className="text-[#0B409C] w-24 -ml-7.5 bg-white text-left">ตรวจสอบข้อมูล</span>
          <span className="text-[#0B409C] w-24 -mr-7.5 bg-white text-right">ชำระเงิน</span>
        </div>

      </div>

      {/* Main Multi-Column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left 2 Columns: PromptPay QR Code container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">

            {/* Card Header Title */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                {/* QR Symbol logo */}
                <div className="w-6 h-6 rounded-md bg-[#0B409C] flex items-center justify-center text-white">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-2 2h2v2h-2v-2zm2 2h3v2h-3v-2zm-4 0h2v2h-2v-2zm2-4h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
                  </svg>
                </div>
                <h4 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wide">PromptPay QR</h4>
              </div>

              {/* PromptPay sub-logo mock */}
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                พร้อมเพย์
              </span>
            </div>

            {/* Content scanning body */}
            <div className="p-8 flex flex-col items-center text-center space-y-6">

              <div className="relative w-80 h-80 overflow-hidden rounded-2xl shadow-md border border-slate-100">
                {/* Dynamic QR Code Drawing loaded from Omise */}
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="PromptPay QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[12.5px] text-slate-400 font-bold bg-white border border-slate-200 rounded-2xl">
                    กำลังสร้างรหัสชำระเงิน...
                  </div>
                )}
                {/* Laser green scanning line indicator */}
                <style>{`
                  @keyframes scanLine {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                  }
                `}</style>
                <div className="absolute left-0 w-full h-[3px] bg-emerald-500 shadow-[0_0_10px_#10B981]" style={{ animation: "scanLine 2.5s ease-in-out infinite", top: "0%" }}></div>
              </div>

              {/* Download QR Code button */}
              {qrCodeUrl && (
                <a
                  href={qrCodeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-[#38BDF8] hover:bg-[#32abdf] text-[#0B132B] font-bold px-6 py-3 rounded-2xl shadow-md transition transform active:scale-95 cursor-pointer text-[14px]"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด QR Code</span>
                </a>
              )}

              {/* Guide Wording */}
              <div className="space-y-2">
                <p className="text-[13.5px] font-bold text-slate-700 leading-normal">
                  สแกน QR Code ด้วยแอปพลิเคชันธนาคารของคุณ
                </p>
                <p className="text-[12.5px] font-extrabold text-red-500 bg-red-50 px-3.5 py-1.5 rounded-full inline-block">
                  QR Code จะหมดอายุใน {formatTime(timeLeft)}
                </p>
              </div>

            </div>

            {/* Bottom secure lock bar */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-center space-x-2 text-[12px] text-slate-400 font-bold select-none">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>การชำระเงินมีความปลอดภัยสูง เข้ารหัสข้อมูลด้วย Omise Gateway</span>
            </div>

          </div>
        </div>

        {/* Right 1 Column: Summary details */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-6">
            <h4 className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-3">สรุปยอดชำระ</h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[13px] font-semibold text-slate-400">
                <span>ยอดชำระของบิล</span>
                <span className="text-slate-700 font-bold">฿ {amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] font-semibold text-slate-400 pb-4 border-b border-slate-100">
                <span>ค่าธรรมเนียม</span>
                <span className="text-slate-700 font-bold">ฟรี</span>
              </div>

              {/* Grand Total Price */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] font-bold text-slate-800">ยอดรวมทั้งสิ้น</span>
                <span className="text-2xl font-extrabold text-[#0B409C]">฿ {amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Confirm button */}
            <button
              onClick={onConfirm}
              className="w-full flex items-center justify-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold py-4 px-6 rounded-2xl shadow-md transition duration-150 transform active:scale-95 cursor-pointer text-[14px]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>กลับไปที่หน้าเลือกรายการ</span>
            </button>

            <p className="text-[11px] text-center text-slate-400 font-medium leading-normal mt-2">
              *ระบบจะทำการเปลี่ยนหน้าจอเมื่อระบบตรวจพบลายเซ็นชำระเงินสำเร็จ
            </p>
          </div>

          {/* Cancel & Back button */}
          <button
            onClick={onCancel}
            className="w-full py-3 border border-slate-200 rounded-2xl bg-white text-slate-500 hover:bg-slate-50 text-[14px] font-bold transition shadow-sm cursor-pointer"
          >
            ย้อนกลับ
          </button>
        </div>

      </div>

    </div>
  );
}
