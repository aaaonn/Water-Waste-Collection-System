"use client";

import { useMemo } from "react";
import { Check, Droplet, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

interface BillItem {
  id: string;
  type: "normal" | "warning";
  serviceName: string;
  subtext?: string;
  billingCycle: string;
  amount: number;
}

interface PaymentSelectProps {
  bills: BillItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onProceed: () => void;
}

export default function PaymentSelect({
  bills,
  selectedIds,
  onToggleSelect,
  onProceed,
}: PaymentSelectProps) {
  const selectedCount = selectedIds.length;
  const totalAmount = useMemo(() => {
    return bills
      .filter((b) => selectedIds.includes(b.id))
      .reduce((sum, b) => sum + b.amount, 0);
  }, [bills, selectedIds]);

  const handleProceedClick = () => {
    if (selectedCount === 0) {
      alert("กรุณาเลือกอย่างน้อย 1 รายการเพื่อดำเนินการชำระเงิน!");
      return;
    }
    onProceed();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start select-none font-sans">
      
      {/* Left Column: Bills Checklist (Takes 2 cols) */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Header Block with Badge Count */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <h3 className="text-[16px] font-extrabold text-slate-800 tracking-tight">ยอดค้างชำระ</h3>
            <span className="bg-rose-50 text-rose-500 font-extrabold text-[11px] px-2.5 py-1 rounded-full border border-rose-100">
              {bills.length} รายการ
            </span>
          </div>

          {/* Note: Single selection enforced */}
          <span className="text-[12px] text-slate-400 font-bold">เลือกชำระได้ทีละ 1 รายการ</span>
        </div>

        {/* Custom Table Header */}
        <div className="grid grid-cols-12 px-4 py-2 text-slate-400 font-bold text-[11.5px] uppercase tracking-wider">
          <div className="col-span-1"></div>
          <div className="col-span-6 pl-4">ประเภทบริการ</div>
          <div className="col-span-2 text-center">รอบบิล</div>
          <div className="col-span-3 text-right">จำนวนเงิน (บาท)</div>
        </div>

        {/* Bills List Items */}
        <div className="space-y-3.5">
          {bills.map((bill) => {
            const isChecked = selectedIds.includes(bill.id);
            return (
              <div 
                key={bill.id}
                onClick={() => onToggleSelect(bill.id)}
                className={`grid grid-cols-12 items-center p-5 border rounded-2xl cursor-pointer transition-all duration-200 ${
                  isChecked 
                    ? "border-blue-200 bg-blue-50/10 shadow-sm" 
                    : "border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/30"
                }`}
              >
                
                {/* 1. Custom radio button */}
                <div className="col-span-1 flex justify-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isChecked 
                      ? "border-[#0B409C] bg-[#0B409C]" 
                      : "border-slate-300 bg-white"
                  }`}>
                    {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                {/* 2. Icon + Title text */}
                <div className="col-span-6 flex items-center space-x-4 pl-4">
                  {/* Icon matching bill state */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    bill.type === "normal" 
                      ? "bg-blue-50 text-blue-500" 
                      : "bg-rose-50 text-rose-500"
                  }`}>
                    {bill.type === "normal" ? (
                      <div className="flex space-x-0.5">
                        <Droplet className="w-4 h-4 fill-current text-blue-500" />
                        <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>

                  {/* Bill Title & Details */}
                  <div>
                    <p className={`whitespace-pre-line text-[14px] font-extrabold leading-tight ${bill.type === "normal" ? "text-slate-700" : "text-rose-600"}`}>
                      {bill.serviceName}
                    </p>
                    {bill.subtext && (
                      <span className="text-[11px] font-extrabold text-rose-500 mt-1 block">
                        {bill.subtext}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Billing cycle */}
                <div className="col-span-2 text-center text-[13px] font-bold text-slate-400">
                  {bill.billingCycle}
                </div>

                {/* 4. Billing Amount */}
                <div className={`col-span-3 text-right text-[15px] font-extrabold w-full ${bill.type === "normal" ? "text-slate-800" : "text-rose-600"}`}>
                  {bill.amount.toFixed(2)}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Right Column: Checkout Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
        <h3 className="text-[16px] font-extrabold text-slate-800 border-b border-slate-100 pb-3.5 tracking-tight">
          สรุปยอดชำระ
        </h3>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[13px] text-slate-400 font-bold">
            <span>ยอดรวม ({selectedCount} รายการ)</span>
            <span className="text-slate-700 font-extrabold">{totalAmount.toFixed(2)} ฿</span>
          </div>
          
          <div className="flex items-center justify-between text-[13px] text-slate-400 font-bold">
            <span>ค่าธรรมเนียม</span>
            <span className="text-emerald-500 font-extrabold">ฟรี</span>
          </div>

          <hr className="border-slate-100" />

          {/* Total Highlight */}
          <div className="flex items-center justify-between py-2">
            <span className="text-[13.5px] font-bold text-slate-700">ยอดรวมทั้งสิ้น</span>
            <span className="text-2xl font-black text-[#0B409C] tracking-tight">
              {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
            </span>
          </div>
        </div>

        {/* Black Checkout Button */}
        <button 
          onClick={handleProceedClick}
          className="w-full flex items-center justify-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-extrabold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95 cursor-pointer text-[14px]"
        >
          <span>ดำเนินการชำระเงิน</span>
          <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>

        {/* Checkout Info Terms */}
        <div className="flex space-x-2 text-[10.5px] text-slate-400 leading-relaxed font-medium">
          <ShieldCheck className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
          <p>
            เมื่อดำเนินการต่อ ถือว่าคุณยอมรับ{" "}
            <span className="underline hover:text-slate-500 cursor-pointer">ข้อกำหนดการให้บริการ</span>{" "}
            และ{" "}
            <span className="underline hover:text-slate-500 cursor-pointer">นโยบายการเรียกเก็บเงิน</span>{" "}
            ของเรา
          </p>
        </div>

      </div>

    </div>
  );
}
