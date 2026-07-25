"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Save, 
  HelpCircle, 
  CheckCircle, 
  RefreshCw,
  Hash,
  Home,
  MapPin
} from "lucide-react";
import SuccessModal from "./success-modal";

export default function VillageForm() {
  const router = useRouter();
  const { role } = useParams();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [households, setHouseholds] = useState(0);
  const [status, setStatus] = useState<"เปิดใช้งาน" | "ระงับชั่วคราว">("เปิดใช้งาน");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
      alert("กรุณากรอกรหัสและชื่อหมู่บ้านให้ครบถ้วน!");
      return;
    }
    setShowSuccessModal(true);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Form Card Panel */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
        
        {/* Row 1: Code and Name Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Village Code */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 block">รหัสหมู่บ้าน</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="เช่น V-0XX"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-1">ระบุรหัสประจำหมู่บ้านตามทะเบียนราษฎร์</p>
          </div>

          {/* Village Name */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 block">ชื่อหมู่บ้าน</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="ระบุชื่อหมู่บ้าน"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Households Input */}
        <div className="space-y-2 md:max-w-[48%]">
          <label className="text-[13px] font-bold text-slate-500 block">จำนวนครัวเรือน</label>
          <div className="relative">
            <Home className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="number"
              min="0"
              placeholder="0"
              value={households || ""}
              onChange={(e) => setHouseholds(parseInt(e.target.value) || 0)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <hr className="border-slate-100 my-2" />

        {/* Row 3: Status Radios */}
        <div className="space-y-3">
          <label className="text-[13px] font-bold text-slate-500 block">สถานะการใช้งาน</label>
          
          <div className="flex items-center space-x-6 select-none">
            {/* Active Radio */}
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="radio" 
                name="status"
                value="เปิดใช้งาน"
                checked={status === "เปิดใช้งาน"}
                onChange={() => setStatus("เปิดใช้งาน")}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                status === "เปิดใช้งาน" 
                  ? "border-[#0B409C] bg-[#0B409C]" 
                  : "border-slate-300 group-hover:border-[#0B409C]/40"
              }`}>
                {status === "เปิดใช้งาน" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-bold bg-emerald-100 text-emerald-600 transition-all group-hover:opacity-90">
                เปิดใช้งาน
              </span>
            </label>

            {/* Suspended Radio */}
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="radio" 
                name="status"
                value="ระงับชั่วคราว"
                checked={status === "ระงับชั่วคราว"}
                onChange={() => setStatus("ระงับชั่วคราว")}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                status === "ระงับชั่วคราว" 
                  ? "border-red-500 bg-red-500" 
                  : "border-slate-300 group-hover:border-red-500/40"
              }`}>
                {status === "ระงับชั่วคราว" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-bold bg-red-50 text-red-500 transition-all group-hover:opacity-90">
                ระงับชั่วคราว
              </span>
            </label>
          </div>
        </div>

        {/* Form Actions Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button 
            type="button"
            onClick={() => router.push(`/page/${role}/subdistrict_management`)}
            className="px-6 py-3 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition shadow-sm"
          >
            ยกเลิก
          </button>
          
          <button 
            type="submit"
            className="flex items-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 transform active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span className="text-[14px]">บันทึกข้อมูล</span>
          </button>
        </div>

      </form>

      {/* Bottom informational Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
        
        {/* Info Card 1 */}
        <div className="bg-[#FAF9F5] rounded-3xl p-5 border border-amber-100/50 flex space-x-4 shadow-sm">
          <div className="text-amber-500 flex-shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-700">ข้อมูลจำเป็น</h4>
            <p className="text-[12px] font-medium text-slate-400 mt-1 leading-normal">
              กรุณาตรวจสอบรหัสหมู่บ้านให้ถูกต้องก่อนการบันทึก
            </p>
          </div>
        </div>

        {/* Info Card 2 */}
        <div className="bg-[#FAF9F5] rounded-3xl p-5 border border-amber-100/50 flex space-x-4 shadow-sm">
          <div className="text-amber-500 flex-shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-700">การยืนยัน</h4>
            <p className="text-[12px] font-medium text-slate-400 mt-1 leading-normal">
              ระบบจะทำความสะอาดข้อมูลอัตโนมัติหลังกดบันทึก
            </p>
          </div>
        </div>

        {/* Info Card 3 */}
        <div className="bg-[#FAF9F5] rounded-3xl p-5 border border-amber-100/50 flex space-x-4 shadow-sm">
          <div className="text-amber-500 flex-shrink-0 mt-0.5">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-700">อัปเดตแบบเรียลไทม์</h4>
            <p className="text-[12px] font-medium text-slate-400 mt-1 leading-normal">
              ข้อมูลจะปรากฏในรายงานภาพรวมทันทีหลังจากยืนยัน
            </p>
          </div>
        </div>

      </div>

      {/* Success Modal Popup */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onAddOther={() => {
          setShowSuccessModal(false);
          setId("");
          setName("");
          setHouseholds(0);
          setStatus("เปิดใช้งาน");
        }}
        onClose={() => {
          setShowSuccessModal(false);
          router.push(`/page/${role}/subdistrict_management`);
        }}
      />

    </div>
  );
}
