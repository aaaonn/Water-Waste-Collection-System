"use client";

import { User, ClipboardList, Droplet, Trash2, AlertTriangle, QrCode, Banknote } from "lucide-react";
import { InvoiceResponse } from "../../../interface/invoice";

interface HouseholdPayment {
  id: number;
  houseNo: string;
  village: string;
  owner: string;
  waterBill: number;
  garbageBill: number;
  status: "ค้างชำระ" | "ค้างชำระ 2 เดือน" | "ชำระแล้ว";
  invoices: InvoiceResponse[];
  water_user_id?: string;
}

interface PaymentVerifyProps {
  household: HouseholdPayment | null;
  onConfirm: (method: "qr" | "cash") => void;
  onCancel: () => void;
}

export default function PaymentVerify({ household, onConfirm, onCancel }: PaymentVerifyProps) {
  const displayOwner = household?.owner || "-";
  const displayHouseNo = household?.houseNo || "-";
  const displayVillage = household?.village || "-";
  const displayWaterUserId = household?.water_user_id || `WAT-2023-${String(household?.id || 1).padStart(4, "0")}`;

  // Calculate actual total amounts from pending invoices array
  const grandTotal = household?.invoices.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
  const invoicesCount = household?.invoices.length || 0;

  return (
    <div className="space-y-8 font-sans select-none">
      
      {/* 2-Step Progress Indicator bar */}
      <div className="max-w-xs mx-auto py-4 font-sans select-none">
        
        {/* Row of Circles and Connector Line */}
        <div className="flex items-center relative">
          
          {/* Step 1 Circle */}
          <div className="w-9 h-9 rounded-full bg-[#0B409C] text-white flex items-center justify-center font-extrabold text-[13px] shadow-md ring-4 ring-blue-100/35 z-10 relative">
            1
          </div>

          {/* Connector Line */}
          <div className="flex-1 h-[3px] bg-slate-200 z-0">
            <div className="h-full bg-[#0B409C] w-0 transition-all duration-300" />
          </div>

          {/* Step 2 Circle */}
          <div className="w-9 h-9 rounded-full bg-white border-[2.5px] border-slate-200 text-slate-400 flex items-center justify-center font-bold text-[13px] z-10 relative">
            2
          </div>

        </div>

        {/* Row of Labels */}
        <div className="flex justify-between mt-2.5 text-center text-[12px] font-extrabold">
          <span className="text-[#0B409C] w-24 -ml-7.5 bg-white text-left">ตรวจสอบข้อมูล</span>
          <span className="text-slate-400 w-24 -mr-7.5 bg-white text-right font-bold">ชำระเงิน</span>
        </div>

      </div>

      {/* Main Multi-Column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Information panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Panel 1: ข้อมูลผู้ชำระเงิน */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-[#0B409C]" />
              <h4 className="text-[15px] font-bold text-slate-800">ข้อมูลผู้ชำระเงิน</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] font-bold text-slate-400">ชื่อ-นามสกุล</p>
                <p className="text-[14px] font-bold text-slate-700 mt-1">{displayOwner}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400">รหัสผู้ใช้น้ำ/บริการ</p>
                <p className="text-[14px] font-mono font-bold text-slate-800 mt-1">{displayWaterUserId}</p>
              </div>
            </div>

            <div>
              <p className="text-[12px] font-bold text-slate-400">ที่อยู่</p>
              <p className="text-[14px] font-semibold text-slate-600 mt-1 leading-relaxed">
                บ้านเลขที่ {displayHouseNo} {displayVillage}
              </p>
            </div>
          </div>

          {/* Panel 2: สรุปรายการที่เลือก */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <ClipboardList className="w-5 h-5 text-[#0B409C]" />
              <h4 className="text-[15px] font-bold text-slate-800">สรุปรายการที่เลือก</h4>
            </div>

            <div className="space-y-3">
              {household?.invoices && household.invoices.map((inv) => {
                const waterAmount = inv.water_reading_amount || 0;
                const garbageAmount = inv.total_amount - waterAmount;
                const isOverdue = inv.status === "overdue";
                
                // Formulate month name in Thai
                const dateObj = new Date(inv.issue_date);
                const thaiMonths = [
                  "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
                ];
                const monthName = thaiMonths[dateObj.getMonth() + 1] || "ไม่มีระบุ";
                const yearThai = dateObj.getFullYear() + 543;
                const billMonthText = `${monthName} ${yearThai}`;

                return (
                  <div 
                    key={inv.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border ${
                      isOverdue 
                        ? "bg-rose-50/30 border-red-100/50" 
                        : "bg-slate-50/50 border-slate-100/50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-1.5 p-2 rounded-xl flex-shrink-0 ${
                        isOverdue 
                          ? "bg-rose-50 text-rose-500 border border-rose-100" 
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}>
                        <Droplet className="w-4 h-4 text-blue-500" />
                        <Trash2 className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <h5 className={`text-[14px] font-bold ${isOverdue ? "text-red-600" : "text-slate-850"}`}>
                          ค่าน้ำประปาและขยะ{isOverdue ? "ค้างชำระ" : ""}
                        </h5>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                          รอบบิล: {billMonthText} | ค่าน้ำ: {waterAmount.toFixed(2)} บ. | ค่าขยะ: {garbageAmount.toFixed(2)} บ.
                        </p>
                      </div>
                    </div>
                    <span className={`text-[15px] font-extrabold ${isOverdue ? "text-red-600" : "text-slate-700"}`}>
                      ฿ {inv.total_amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}

              {(!household?.invoices || household.invoices.length === 0) && (
                <div className="text-center py-8 text-slate-400 font-bold text-[14px]">
                  ไม่มีรายการค้างชำระค้างอยู่
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Checkout card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-6">
            <h4 className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-3">สรุปยอดชำระ</h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[13px] font-semibold text-slate-400">
                <span>ยอดรวม ({invoicesCount} รายการ)</span>
                <span className="text-slate-700 font-bold">{grandTotal.toFixed(2)} ฿</span>
              </div>
              <div className="flex items-center justify-between text-[13px] font-semibold text-slate-400 pb-4 border-b border-slate-100">
                <span>ค่าธรรมเนียม</span>
                <span className="bg-blue-50 text-[#38BDF8] px-2 py-0.5 rounded-[4px] font-extrabold text-[11px]">ฟรี</span>
              </div>

              {/* Grand Total Price */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] font-bold text-slate-800">ยอดรวมทั้งสิ้น</span>
                <span className="text-2xl font-extrabold text-[#0B409C]">{grandTotal.toFixed(2)} ฿</span>
              </div>
            </div>

            {/* Payment options buttons stack */}
            <div className="space-y-3">
              {/* Pay with QR Code Button */}
              <button 
                onClick={() => onConfirm("qr")}
                disabled={invoicesCount === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#0B409C] hover:bg-[#09337d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition duration-200 transform active:scale-95 cursor-pointer text-[14px] focus-visible:outline-none"
              >
                <span>ชำระด้วย QR Code</span>
                <QrCode className="w-4 h-4" />
              </button>

              {/* Pay with Cash Button */}
              <button 
                onClick={() => onConfirm("cash")}
                disabled={invoicesCount === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#0B409C] hover:bg-[#09337d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition duration-200 transform active:scale-95 cursor-pointer text-[14px] focus-visible:outline-none"
              >
                <span>ชำระด้วยเงินสด</span>
                <Banknote className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Cancel & Back button */}
          <button 
            onClick={onCancel}
            className="w-full py-3 border border-slate-200 rounded-2xl bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-[14px] font-bold transition shadow-sm cursor-pointer"
          >
            ย้อนกลับ
          </button>
        </div>

      </div>

    </div>
  );
}
