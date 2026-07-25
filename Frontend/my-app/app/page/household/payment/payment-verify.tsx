"use client";

import { useMemo } from "react";
import { ArrowRight, User, Home, FileText, CheckCircle2, ChevronLeft } from "lucide-react";

interface BillItem {
  id: string;
  type: "normal" | "warning";
  serviceName: string;
  subtext?: string;
  billingCycle: string;
  amount: number;
  prevReading?: number;
  currReading?: number;
  unitConsumed?: number;
}

interface PaymentVerifyProps {
  household?: any;
  bills: BillItem[];
  selectedIds: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PaymentVerify({
  household,
  bills,
  selectedIds,
  onConfirm,
  onCancel,
}: PaymentVerifyProps) {
  const selectedBills = useMemo(() => {
    return bills.filter((b) => selectedIds.includes(b.id));
  }, [bills, selectedIds]);

  const selectedCount = selectedBills.length;
  const totalAmount = useMemo(() => {
    return selectedBills.reduce((sum, b) => sum + b.amount, 0);
  }, [selectedBills]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start select-none font-sans">
      
      {/* Left Column: Verification details (Takes 2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* 1. ข้อมูลผู้ชำระเงิน Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center space-x-2">
            <User className="w-5 h-5 text-[#0B409C]" />
            <h3 className="text-[16px] font-extrabold text-slate-800 tracking-tight">ข้อมูลผู้ชำระเงิน</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13.5px] font-semibold text-slate-700">
            {/* Name */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">ชื่อ-นามสกุล</span>
              <p className="text-slate-800 font-extrabold">{household ? `${household.title_name || 'คุณ'}${household.first_name} ${household.last_name}` : "-"}</p>
            </div>

            {/* ID */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">เลขผู้ใช้น้ำ / ผู้เสียภาษี</span>
              <p className="text-slate-800 font-extrabold">{household ? household.water_user_id : "-"}</p>
            </div>

            {/* Address full span */}
            <div className="space-y-1 md:col-span-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">ที่อยู่</span>
              <p className="text-slate-850 font-extrabold leading-relaxed">
                {household ? `บ้านเลขที่ ${household.house_number} หมู่ที่ ${household.village_id} ตำบลทุ่งหลวง อำเภอปากท่อ จังหวัดราชบุรี` : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* 2. สรุปรายการที่เลือก Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#0B409C]" />
            <h3 className="text-[16px] font-extrabold text-slate-800 tracking-tight">สรุปรายการที่เลือก</h3>
          </div>

          <div className="space-y-3.5">
            {selectedBills.map((bill) => (
              <div 
                key={bill.id}
                className="flex items-center justify-between p-4 border border-slate-100 bg-[#F8FAFC]/40 rounded-2xl"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    bill.type === "normal" 
                      ? "bg-blue-50 text-blue-500" 
                      : "bg-rose-50 text-rose-500"
                  }`}>
                    {bill.type === "normal" ? (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    ) : (
                      <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                    )}
                  </div>
                  <div>
                    <p className="whitespace-pre-line text-[13.5px] font-extrabold text-slate-700 leading-tight">
                      {bill.serviceName}
                    </p>
                    <span className="text-[11px] text-slate-400 font-bold block mt-1">
                      รอบบิล: {bill.billingCycle}
                    </span>
                    {bill.unitConsumed !== undefined && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-400 mt-2">
                        <span>มาตรวัดเดิม <span className="font-extrabold text-slate-600">{bill.prevReading}</span></span>
                        <span className="text-slate-300">|</span>
                        <span>มาตรวัดใหม่ <span className="font-extrabold text-slate-600">{bill.currReading}</span></span>
                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-extrabold ml-1">
                          ใช้ไป {bill.unitConsumed} หน่วย
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[14.5px] font-extrabold text-slate-800">
                  ฿ {bill.amount.toFixed(2)}
                </div>
              </div>
            ))}

            {selectedBills.length === 0 && (
              <div className="text-center py-6 text-slate-400 font-bold text-[13.5px]">
                ไม่มีรายการที่เลือก
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Summary & Confirm checkout panel */}
      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
          <h3 className="text-[16px] font-extrabold text-slate-800 border-b border-slate-100 pb-3.5 tracking-tight">
            สรุปยอดชำระ
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-[13px] text-slate-400 font-bold">
              <span>ยอดรวม ({selectedCount} รายการ)</span>
              <span className="text-slate-700 font-extrabold">
                {totalAmount.toFixed(2)} ฿
              </span>
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

          {/* Confirm Proceed Button */}
          <button 
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-extrabold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95 cursor-pointer text-[14px]"
          >
            <span>ยืนยันและไปที่การชำระเงิน</span>
            <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Back Button */}
        <button 
          onClick={onCancel}
          className="w-full py-3.5 border border-slate-200 hover:border-slate-350 rounded-2xl bg-white text-slate-500 hover:bg-slate-50 text-[14px] font-extrabold transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>ย้อนกลับแก้ไข</span>
        </button>
      </div>

    </div>
  );
}
