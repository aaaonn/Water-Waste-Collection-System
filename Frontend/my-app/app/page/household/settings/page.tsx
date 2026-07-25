"use client";

import { useState, useRef, useEffect } from "react";
import { 
  User, 
  Droplet,
  Lock, 
  ShieldCheck, 
  PhoneCall,
  MailQuestion
} from "lucide-react";
import SuccessToast from "../../../component/success-toast";
import { getHouseholdMe, updateHouseholdProfile } from "../../../service/household";

export default function HouseholdSettings() {

  const [householdId, setHouseholdId] = useState<number | null>(null);

  const [profile, setProfile] = useState({
    houseCode: "",
    houseNo: "",
    village: "",
    titleName: "",
    firstName: "",
    lastName: "",
    phone: "",
    citizenId: "",
    waterUserId: "",
    waterStatus: "",
    garbageStatus: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลเมื่อโหลดหน้าจอ
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getHouseholdMe();
        if (data && data.id) {
          setHouseholdId(data.id);
        }
        setProfile({
          houseCode: data.house_code || "-",
          houseNo: data.house_number || "-",
          village: `หมู่ ${data.village_id}`, 
          titleName: data.title_name || "-",
          firstName: data.first_name || "-",
          lastName: data.last_name || "-",
          phone: data.phone_number || "",
          citizenId: data.citizen_id || "-",
          waterUserId: data.water_user_id || "-",
          waterStatus: data.water_status === 'active' ? "ใช้งาน" : data.water_status,
          garbageStatus: data.garbage_status === 'active' ? "ใช้งาน" : data.garbage_status,
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);


  // 2. Security State
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirmPass: ""
  });

  // 3. Notification Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId) {
      alert("ไม่พบข้อมูลผู้ใช้งาน");
      return;
    }
    try {
      await updateHouseholdProfile(householdId, { phone_number: profile.phone });
      triggerToast("บันทึกข้อมูลส่วนตัว (เบอร์โทรศัพท์) เรียบร้อยแล้ว!");
    } catch (error: any) {
      alert(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId) {
      alert("ไม่พบข้อมูลผู้ใช้งาน");
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      alert("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    
    try {
      await updateHouseholdProfile(householdId, {
        old_password: passwords.current,
        new_password: passwords.newPass
      });
      triggerToast("อัปเดตความปลอดภัยรหัสผ่านสำเร็จแล้ว!");
      setPasswords(prev => ({ ...prev, current: "", newPass: "", confirmPass: "" }));
    } catch (error: any) {
      alert(error.message || "รหัสผ่านเดิมไม่ถูกต้อง หรือเกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-6 font-sans select-none relative">
      
      {/* Premium Toast Notification */}
      {toastMessage && (
        <SuccessToast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}

      {/* Main Form Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT SIDE: Personal Information (col-span 8) ================= */}
        <form onSubmit={handleProfileSubmit} className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="space-y-8">
            
            {/* ---------------- Section 1: ข้อมูลทั่วไป ---------------- */}
            <div className="flex items-center space-x-2 text-[#0B409C] mb-6 border-b border-slate-100 pb-4">
              <User className="w-5 h-5" />
              <h3 className="text-[16px] font-extrabold tracking-tight">ข้อมูลทั่วไป (General Information)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">รหัสครัวเรือน</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.houseCode}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">บ้านเลขที่</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.houseNo}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">หมู่ที่</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.village}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">คำนำหน้า</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.titleName}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">ชื่อเจ้าบ้าน</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.firstName}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">นามสกุลเจ้าบ้าน</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.lastName}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#0B409C]">เบอร์โทรศัพท์ (แก้ไขได้) <span className="text-red-500">*</span></label>
                <input type="text" value={profile.phone} onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[14px] text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm" />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">เลขบัตรประชาชน</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.citizenId}</p>
              </div>

            </div>

            {/* ---------------- Section 2: ข้อมูลบริการ ---------------- */}
            <div className="flex items-center space-x-2 text-[#0B409C] mb-6 border-b border-slate-100 pb-4 mt-10">
              <Droplet className="w-5 h-5" />
              <h3 className="text-[16px] font-extrabold tracking-tight">ข้อมูลบริการ (Utility Details)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">รหัสผู้ใช้น้ำ</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.waterUserId}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">สถานะใช้น้ำ</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.waterStatus}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-400">สถานะเก็บขยะ</label>
                <p className="text-[15px] text-slate-800 font-extrabold pt-1">{profile.garbageStatus}</p>
              </div>
            </div>

          </div>

          {/* Submit Profile changes button */}
          <div className="flex justify-end pt-5 border-t border-slate-100 mt-6">
            <button 
              type="submit"
              className="bg-[#0B409C] hover:bg-[#09337d] text-white font-extrabold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition duration-150 transform active:scale-95 cursor-pointer text-[14px]"
            >
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>

        </form>

        {/* ================= RIGHT SIDE: Security & Need Help? (col-span 4) ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: ความปลอดภัย */}
          <form onSubmit={handleSecuritySubmit} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-7 space-y-6">
            
            {/* Header title */}
            <div className="pb-3.5 border-b border-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#0B409C]" />
              <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight">ความปลอดภัย</h4>
            </div>

            {/* Inputs stack */}
            <div className="space-y-4">
              
              {/* รหัสผ่านปัจจุบัน */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-400">รหัสผ่านปัจจุบัน</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14px] text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-blue-500 transition shadow-sm placeholder-slate-350"
                />
              </div>

              {/* รหัสผ่านใหม่ */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-400">รหัสผ่านใหม่</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPass: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14px] text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-blue-500 transition shadow-sm placeholder-slate-350"
                />
              </div>

              {/* ยืนยันรหัสผ่านใหม่ */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-400">ยืนยันรหัสผ่านใหม่</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={passwords.confirmPass}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPass: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14px] text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-blue-500 transition shadow-sm placeholder-slate-350"
                />
              </div>

            </div>

            {/* Save security button (Solid Deep Blue matching brand) */}
            <button 
              type="submit"
              className="w-full bg-[#0B409C] hover:bg-[#09337d] text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-md transition duration-150 transform active:scale-95 cursor-pointer text-[14px]"
            >
              อัปเดตความปลอดภัย
            </button>

            {/* 2FA Status info */}
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2.5 text-[11px] text-slate-400 font-bold leading-none">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Two-factor authentication is enabled</span>
            </div>

          </form>

          {/* Card 2: ต้องการความช่วยเหลือ? */}
          <div className="bg-[#0B132B] text-white rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg border border-slate-850">
            <div className="space-y-2">
              <h4 className="text-[15.5px] font-extrabold tracking-tight">ต้องการความช่วยเหลือ?</h4>
              <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                ทีมสนับสนุนของเราพร้อมให้บริการช่วยเหลือดูแลแนะนำการใช้งานระบบตลอด 24 ชั่วโมง
              </p>
            </div>

            <div className="space-y-3.5 pt-1 text-[13px] font-bold text-slate-200">
              {/* Phone Line */}
              <a 
                href="tel:1122" 
                className="flex items-center space-x-3 hover:text-white transition group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-[#0C5AE9] transition">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <span>1122 (สายด่วน อบต.)</span>
              </a>

              {/* Email Support */}
              <a 
                href="mailto:support@civic-utility.th" 
                className="flex items-center space-x-3 hover:text-white transition group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-[#0C5AE9] transition">
                  <MailQuestion className="w-4 h-4" />
                </div>
                <span className="truncate">support@civic-utility.th</span>
              </a>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
