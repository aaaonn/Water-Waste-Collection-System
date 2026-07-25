"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Home, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  MoreHorizontal, 
  ChevronDown 
} from "lucide-react";
import { httpClient } from "../../../service/http-client";

interface Village {
  id: number;
  subdistrict_id: number;
  village_name: string;
  village_number: number;
}

interface ProgressData {
  percentage: number;
  target: number;
  collected: number;
}

interface SurveyProgressData {
  totalActive: number;
  surveyed: number;
  unsurveyed: number;
  percentage: number;
}

interface MonthlyRevenueData {
  month: string;
  water: number;
  garbage: number;
}

interface DashboardStats {
  revenueCollected: string;
  revenueTotal: string;
  householdsPaid: string;
  householdsActive: string;
  householdsTotal: string;
  pendingTasks: number;
  totalTasks: number;
  systemAlerts: number;
  waterProgress: ProgressData;
  garbageProgress: ProgressData;
  surveyProgress: SurveyProgressData;
  chartData: MonthlyRevenueData[];
}

export default function StaffDashboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedVillage, setSelectedVillage] = useState<number>(0);
  const [villages, setVillages] = useState<Village[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVillages() {
      try {
        const res = await httpClient.get<Village[]>("/villages");
        setVillages(res || []);
      } catch (err) {
        console.error("Failed to load villages", err);
      }
    }
    loadVillages();
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await httpClient.get<DashboardStats>(`/dashboard/stats?month=${selectedMonth}&year=${selectedYear}&village_id=${selectedVillage}`);
        setStats(data);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [selectedMonth, selectedYear, selectedVillage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลแดชบอร์ด...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-50 text-rose-600 p-6 rounded-3xl border border-rose-100 text-center font-bold">
        {error || "ไม่พบข้อมูลแดชบอร์ด"}
      </div>
    );
  }

  // Water rate progress ring settings
  const waterCircumference = 188.5;
  const waterOffset = waterCircumference * (1 - stats.waterProgress.percentage / 100);

  // Garbage rate progress ring settings
  const garbageOffset = waterCircumference * (1 - stats.garbageProgress.percentage / 100);

  const chartData = stats.chartData;

  const months = [
    { value: 1, label: "มกราคม" }, { value: 2, label: "กุมภาพันธ์" }, { value: 3, label: "มีนาคม" },
    { value: 4, label: "เมษายน" }, { value: 5, label: "พฤษภาคม" }, { value: 6, label: "มิถุนายน" },
    { value: 7, label: "กรกฎาคม" }, { value: 8, label: "สิงหาคม" }, { value: 9, label: "กันยายน" },
    { value: 10, label: "ตุลาคม" }, { value: 11, label: "พฤศจิกายน" }, { value: 12, label: "ธันวาคม" }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Top Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-800 ml-2">
          ภาพรวมระบบ {selectedVillage > 0 
            ? `(หมู่ ${villages.find(v => v.id === selectedVillage)?.village_number} ${villages.find(v => v.id === selectedVillage)?.village_name || ''})` 
            : '(ทุกหมู่บ้าน)'}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* Village Selector */}
          <div className="relative">
            <select 
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(Number(e.target.value))}
              className="pl-4 pr-9 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-600 font-bold focus:outline-none transition cursor-pointer appearance-none"
            >
              <option value={0}>ทุกหมู่บ้าน (ทั้งหมด)</option>
              {villages.map(v => (
                <option key={v.id} value={v.id}>
                  หมู่ {v.village_number} {v.village_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Month Selector */}
          <div className="relative">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="pl-4 pr-9 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-600 font-bold focus:outline-none transition cursor-pointer appearance-none"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="pl-4 pr-9 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] text-slate-600 font-bold focus:outline-none transition cursor-pointer appearance-none"
            >
              {years.map(y => (
                <option key={y} value={y}>{y + 543}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* A. Top 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: รายได้จัดเก็บ */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200 relative overflow-hidden">
          {/* Card Icon */}
          <div className="w-14 h-14 bg-blue-50 text-[#0C5AE9] rounded-2xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 fill-current" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-bold text-slate-400 leading-none">รายได้จัดเก็บ (เดือนนี้)</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-2 leading-none">
              {stats.revenueCollected} <span className="text-[14px] font-bold text-slate-400">/ {stats.revenueTotal}</span>
            </p>
          </div>
        </div>

        {/* Card 2: ครัวเรือนที่ชำระแล้ว */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200">
          <div className="w-14 h-14 bg-blue-50 text-[#0C5AE9] rounded-2xl flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400 leading-none">ครัวเรือนที่ชำระแล้ว</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-2 leading-none">
              {stats.householdsPaid} <span className="text-[14px] font-bold text-slate-400">/ {stats.householdsActive}</span>
            </p>
          </div>
        </div>

        {/* Card 3: รอดำเนินการ */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400 leading-none">รอดำเนินการ</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-2 leading-none">
              {stats.pendingTasks} <span className="text-[14px] font-bold text-slate-400">/ {stats.totalTasks}</span>
            </p>
          </div>
        </div>

        {/* Card 4: ค้างชำระ */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200 relative overflow-hidden">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-bold text-slate-400 leading-none">ค้างชำระ (เดือนก่อนหน้า)</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-2 leading-none">
              {stats.systemAlerts}
            </p>
          </div>
        </div>

      </div>

      {/* B. Bottom Layout Grid containing Progress circles and Bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Card: ความคืบหน้าการจัดเก็บ (col-span 5) */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6 lg:col-span-5 flex flex-col justify-between">
          {/* Header row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">ความคืบหน้าการจัดเก็บ</h4>
            <button className="text-slate-400 hover:text-slate-600 transition">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Progress rows container */}
          <div className="space-y-8 py-2">
            
            {/* Water progress block */}
            <div className="flex items-center space-x-6">
              {/* Circular progress SVG */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 80 80">
                  {/* Background ring */}
                  <circle cx="40" cy="40" r="30" stroke="#EEF2F6" strokeWidth="8" fill="transparent" />
                  {/* Active ring */}
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="30" 
                    stroke="#0C5AE9" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={waterCircumference}
                    strokeDashoffset={waterOffset}
                    strokeLinecap="round"
                  />
                </svg>
                {/* percentage label inside */}
                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-[15px] text-slate-800">
                  {stats.waterProgress.percentage}%
                </div>
              </div>

              {/* Water detail texts */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0C5AE9] inline-block"></span>
                  <span className="text-[14px] font-bold text-slate-800">ค่าน้ำ</span>
                </div>
                <p className="text-[12px] text-slate-400 font-bold">เป้าหมาย: {stats.waterProgress.target.toLocaleString()}</p>
                <p className="text-[13px] text-[#0C5AE9] font-extrabold">จัดเก็บแล้ว: ฿{stats.waterProgress.collected.toLocaleString()}</p>
              </div>
            </div>

            {/* Garbage progress block */}
            <div className="flex items-center space-x-6">
              {/* Circular progress SVG */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 80 80">
                  {/* Background ring */}
                  <circle cx="40" cy="40" r="30" stroke="#EEF2F6" strokeWidth="8" fill="transparent" />
                  {/* Active ring */}
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="30" 
                    stroke="#10B981" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={waterCircumference}
                    strokeDashoffset={garbageOffset}
                    strokeLinecap="round"
                  />
                </svg>
                {/* percentage label inside */}
                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-[15px] text-slate-800">
                  {stats.garbageProgress.percentage}%
                </div>
              </div>

              {/* Garbage detail texts */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block"></span>
                  <span className="text-[14px] font-bold text-slate-800">ค่าขยะ</span>
                </div>
                <p className="text-[12px] text-slate-400 font-bold">เป้าหมาย: {stats.garbageProgress.target.toLocaleString()}</p>
                <p className="text-[13px] text-[#10B981] font-extrabold">จัดเก็บแล้ว: ฿{stats.garbageProgress.collected.toLocaleString()}</p>
              </div>
            </div>

          </div>

          <div className="h-2"></div>
        </div>

        {/* Right Card: สถานะการลงพื้นที่สำรวจ (Survey Progress) (col-span 7) */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6 lg:col-span-7 flex flex-col justify-between">
          
          {/* Header row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">สถานะการลงพื้นที่สำรวจ (Survey Progress)</h4>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-8 pt-2">
            
            {/* 1. Full-Width Horizontal Progress Bar */}
            <div className="w-full px-2">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[13px] font-bold text-slate-500">ความคืบหน้าภาพรวม (Overall Progress)</span>
                <span className="text-[28px] font-extrabold text-[#0B409C] leading-none tracking-tight">
                  {stats.surveyProgress.percentage}%
                </span>
              </div>
              <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden shadow-inner flex border border-slate-200/50">
                <div 
                  className="h-full bg-[#0B409C] transition-all duration-1000 relative"
                  style={{ width: `${stats.surveyProgress.percentage}%` }}
                >
                  {/* Subtle diagonal shine for texture */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>
                </div>
              </div>
            </div>

            {/* 2. Three Horizontal Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* Card 1: Total */}
              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-100 transition-all hover:shadow-sm">
                <p className="text-[12px] font-bold text-slate-400">เป้าหมายทั้งหมด</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-slate-800">
                    {stats.surveyProgress.totalActive.toLocaleString()}
                  </p>
                  <span className="text-[13px] text-slate-500 font-bold">ครัวเรือน</span>
                </div>
              </div>

              {/* Card 2: Surveyed */}
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 transition-all hover:shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
                <p className="text-[12px] font-bold text-[#0B409C]/70 relative z-10">จดบันทึกแล้ว</p>
                <div className="mt-2 flex items-baseline gap-2 relative z-10">
                  <p className="text-3xl font-extrabold text-[#0B409C]">
                    {stats.surveyProgress.surveyed.toLocaleString()}
                  </p>
                  <span className="text-[13px] text-[#0B409C]/70 font-bold">ครัวเรือน</span>
                </div>
              </div>

              {/* Card 3: Unsurveyed */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
                <p className="text-[12px] font-bold text-slate-400">รอการสำรวจ</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-slate-600">
                    {stats.surveyProgress.unsurveyed.toLocaleString()}
                  </p>
                  <span className="text-[13px] text-slate-400 font-bold">ครัวเรือน</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
