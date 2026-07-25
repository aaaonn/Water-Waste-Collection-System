"use client";

import { useState, useEffect } from "react";
import { getInvoicesByHousehold } from "../../../service/invoice";
import { getHouseholdMe } from "../../../service/household";
import { Household } from "../../../interface/household";
import { InvoiceResponse } from "../../../interface/invoice";
import Link from "next/link";
import { 
  MapPin, 
  Copy, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  ArrowRight,
  Info
} from "lucide-react";
import SuccessToast from "../../../component/success-toast";

export default function HouseholdDashboard() {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [totalAccumulated, setTotalAccumulated] = useState<number>(0);
  const [currentDueDate, setCurrentDueDate] = useState<string>("-");
  const [chartData, setChartData] = useState<{ month: string; amount: number; height: string; isCurrent: boolean }[]>([]);
  const [maxY, setMaxY] = useState<number>(300);

  // Fetch API Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Household Info from token
        const hhData = await getHouseholdMe();
        setHousehold(hhData);
        
        // 2. Fetch All Invoices
        // Note: Assuming `id` is the field for Household ID. Check the interface to be sure.
        const invData = await getInvoicesByHousehold(hhData.id);
        if (invData.data && invData.data.length > 0) {
          // Sort by issue_date descending
          const allInvoices = [...invData.data].sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
          
          const latest = allInvoices[0];
          
          // Check if latest is pending
          let current = 0;
          if (latest.status === "pending" || latest.status === "overdue") {
            current = latest.total_amount;
          }
          setCurrentAmount(current);
          
          // Format Date (e.g. 15 ต.ค.)
          if (latest.due_date) {
            const d = new Date(latest.due_date);
            const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
            setCurrentDueDate(`${d.getDate()} ${months[d.getMonth()]}`);
          }

          // Calculate Accumulate from older unpaid invoices
          const olderInvoices = allInvoices.slice(1);
          const accumulated = olderInvoices
            .filter(inv => inv.status === "pending" || inv.status === "overdue")
            .reduce((sum, inv) => sum + inv.total_amount, 0);
            
          setTotalAccumulated(accumulated);

          // Calculate Chart Data (last 6 months)
          const last6 = allInvoices.slice(0, 6).reverse(); // oldest to newest among the 6
          
          let maxUnit = 0;
          last6.forEach(inv => {
            if (inv.water_unit_consumed > maxUnit) maxUnit = inv.water_unit_consumed;
          });
          
          let calculatedMaxY = Math.ceil(maxUnit / 30) * 30;
          if (calculatedMaxY === 0) calculatedMaxY = 30;
          
          setMaxY(calculatedMaxY);

          const newChartData = last6.map((inv, idx) => {
            const d = new Date(inv.issue_date);
            const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
            const isLatest = idx === last6.length - 1;
            return {
              month: monthsShort[d.getMonth()],
              amount: inv.water_unit_consumed || 0,
              height: `${((inv.water_unit_consumed || 0) / calculatedMaxY) * 100}%`,
              isCurrent: isLatest
            };
          });
          setChartData(newChartData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  // Copy helper function removed

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 font-sans select-none relative">
      
      {/* Premium Slide-in Notification Toast */}
      {toastMessage && (
        <SuccessToast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}

      {/* A. Top Section: Outstanding Bills Card & Household details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Column (Takes 2 cols) - Billing Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between relative overflow-hidden">
          
          {/* Waiting for payment red badge */}
          <div className="absolute top-6 right-6">
            <span className="flex items-center gap-1.5 bg-rose-50 text-rose-500 font-extrabold text-[11px] px-3.5 py-1.5 rounded-full border border-rose-100/50">
              <Clock className="w-3.5 h-3.5" />
              <span>รอชำระเงิน</span>
            </span>
          </div>

          <div className="space-y-6">
            
            {/* Split row containing current and accumulated bills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
              
              {/* Box 1: ยอดชำระปัจจุบัน */}
              <div className="space-y-2">
                <span className="text-[12.5px] font-bold text-slate-400 block tracking-wide uppercase">ยอดชำระปัจจุบัน</span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">{currentAmount.toFixed(2)}</span>
                  <span className="text-[14px] font-extrabold text-slate-400">บาท</span>
                </div>
                <span className="text-[11.5px] font-bold text-slate-400 block pt-1 select-none">
                  ครบกำหนด {currentDueDate}
                </span>
              </div>

              {/* Box 2: ยอดค้างชำระสะสม (Gray background) */}
              <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-5 space-y-2 shadow-inner">
                <span className="text-[12px] font-bold text-slate-400 block tracking-wide uppercase">ยอดค้างชำระสะสม</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-rose-500 tracking-tight">{totalAccumulated.toFixed(2)}</span>
                  <span className="text-[13px] font-extrabold text-rose-400">บาท</span>
                </div>
                <div className="flex items-center space-x-1.5 text-rose-500 font-extrabold text-[11px] pt-1 leading-none select-none">
                  <Clock className="w-3.5 h-3.5 fill-current text-rose-500/20" />
                  <span>เกินกำหนดชำระ</span>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Row bar containing total payable and proceed action button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 mt-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">รวมบริการน้ำและขยะ</span>
              <p className="text-[14px] font-extrabold text-slate-700 mt-1 select-none">
                ยอดรวมที่ต้องชำระ: <span className="text-slate-900 font-black">{(currentAmount + totalAccumulated).toFixed(2)} บาท</span>
              </p>
            </div>

            {/* Click to proceed to payment screen (Using deep blue #0B409C matching brand confirm buttons) */}
            <Link 
              href="/page/household/payment"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-95 cursor-pointer text-[14px]"
            >
              <span>ชำระเงินทันที</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Right Column (Takes 1 col) - Household Details Card */}
        <div className="bg-[#F8FAFC]/70 border border-slate-200/60 rounded-3xl p-6 sm:p-7 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-5">
            {/* Header MapPin */}
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-slate-400" />
              <h4 className="text-[14px] font-extrabold text-slate-800 tracking-tight">รายละเอียดครัวเรือน</h4>
            </div>

            {/* Customer Name */}
            <div className="space-y-1.5 text-[13px] font-semibold text-slate-600">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">ชื่อผู้รับบริการ</span>
              <p className="text-slate-750 font-extrabold leading-relaxed">
                {household ? `${household.title_name}${household.first_name} ${household.last_name}` : "กำลังโหลด..."}
              </p>
            </div>

            {/* Service Address */}
            <div className="space-y-1.5 text-[13px] font-semibold text-slate-600">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">ที่อยู่ผู้รับบริการ</span>
              <p className="text-slate-750 font-extrabold leading-relaxed">
                {/* hard-coded ต้องแก้ไข */}
                {household ? `บ้านเลขที่ ${household.house_number} หมู่ที่ ${household.village_id} ตำบลทุ่งหลวง อำเภอปากท่อ จังหวัดราชบุรี` : "กำลังโหลด..."}
              </p>
            </div>

            {/* Account ID without copy box */}
            <div className="space-y-1.5 text-[13px] font-semibold text-slate-600">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">รหัสผู้ใช้น้ำ</span>
              <p className="text-slate-750 font-extrabold leading-relaxed">
                {household?.water_user_id || "กำลังโหลด..."}
              </p>
            </div>
          </div>

          <div className="h-1"></div>
        </div>

      </div>

      {/* B. Bottom Section: Water usage trend chart */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Header row */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight">แนวโน้มการใช้น้ำ</h4>
            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">เปรียบเทียบ 6 เดือนล่าสุด (หน่วย)</span>
          </div>

          {/* Link to detail page */}
          <Link 
            href="/page/household/history"
            className="flex items-center gap-1.5 text-[#0B409C] hover:text-blue-700 font-extrabold text-[13px] transition select-none cursor-pointer"
          >
            <span>ดูรายละเอียด</span>
            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* Custom Responsive capsule columns chart */}
        <div className="h-48 pt-4 select-none relative flex items-stretch">
          
          {/* Y-Axis markers */}
          <div className="flex flex-col justify-between text-right text-[11px] text-slate-400 font-bold w-12 pr-4 pb-8 h-full">
            <span>{maxY}</span>
            <span>{Math.round((maxY * 2) / 3)}</span>
            <span>{Math.round(maxY / 3)}</span>
            <span>0</span>
          </div>

          {/* Main Chart Column container */}
          <div className="flex-1 flex flex-col justify-between h-full relative">
            {/* Background gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
              <div className="border-b border-slate-100 w-full h-[1px]"></div>
              <div className="border-b border-slate-100 w-full h-[1px]"></div>
              <div className="border-b border-slate-100 w-full h-[1px]"></div>
              <div className="border-b border-slate-200 w-full h-[1.5px]"></div> {/* Baseline */}
            </div>

            {/* Custom columns */}
            <div className="absolute inset-0 flex justify-around items-end pb-8 pl-4 pr-4">
              {chartData.map((data, idx) => (
                <div key={idx} className="flex flex-col items-center h-full justify-end w-14 group cursor-pointer relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-extrabold text-[10.5px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition shadow-md pointer-events-none duration-150 whitespace-nowrap z-20">
                    {data.amount} หน่วย
                  </div>

                  {/* Column Capsule */}
                  <div 
                    className={`w-7 rounded-t-xl transition-all duration-300 shadow-sm transform hover:scale-105 ${
                      data.isCurrent 
                        ? "bg-black hover:bg-slate-900" 
                        : "bg-slate-200/80 hover:bg-slate-300"
                    }`}
                    style={{ height: data.height }}
                  ></div>
                </div>
              ))}
            </div>

            {/* X-Axis Month labels at the bottom */}
            <div className="absolute bottom-0 left-0 w-full flex justify-around text-center text-[12px] text-slate-400 font-extrabold pl-4 pr-4">
              {chartData.map((data, idx) => (
                <span key={idx} className="w-14">{data.month}</span>
              ))}
            </div>

          </div>

        </div>

        {/* Chart Color Legend row */}
        <div className="flex items-center justify-center space-x-6 pt-4 border-t border-slate-50 text-[12px] font-bold">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-slate-200 inline-block shadow-sm"></span>
            <span className="text-slate-400">เดือนก่อนหน้า</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-black inline-block shadow-sm"></span>
            <span className="text-slate-400">เดือนปัจจุบัน</span>
          </div>
        </div>

      </div>

    </div>
  );
}
