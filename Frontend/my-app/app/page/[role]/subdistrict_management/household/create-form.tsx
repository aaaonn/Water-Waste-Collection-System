"use client";

import { useState, useEffect } from "react";
import { User, Droplet, Save, ChevronDown } from "lucide-react";
import { 
  Household, 
  VillageResponse, 
  GarbageRateResponse,
  CreateHouseholdRequest,
  UpdateHouseholdRequest
} from "../../../../interface/household";
import { 
  createHousehold, 
  updateHousehold, 
  getVillages, 
  getGarbageRates 
} from "../../../../service/household";

interface CreateFormProps {
  onSave: () => void;
  onCancel: () => void;
  editHousehold?: Household;
}

export default function CreateForm({ onSave, onCancel, editHousehold }: CreateFormProps) {
  // Dropdown options states
  const [villages, setVillages] = useState<VillageResponse[]>([]);
  const [garbageRates, setGarbageRates] = useState<GarbageRateResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Inputs state
  const [houseCode, setHouseCode] = useState<string>(editHousehold?.house_code || "");
  const [houseNumber, setHouseNumber] = useState<string>(editHousehold?.house_number || "");
  const [villageId, setVillageId] = useState<number | "">(editHousehold?.village_id || "");
  const [titleName, setTitleName] = useState<string>(editHousehold?.title_name || "นาย");
  const [firstName, setFirstName] = useState<string>(editHousehold?.first_name || "");
  const [lastName, setLastName] = useState<string>(editHousehold?.last_name || "");
  const [phone, setPhone] = useState<string>(editHousehold?.phone_number || "");
  const [citizenId, setCitizenId] = useState<string>(editHousehold?.citizen_id || "");
  const [username, setUsername] = useState<string>(editHousehold?.username || "");
  const [password, setPassword] = useState<string>("");


  // Utility details states
  const [garbageStatus, setGarbageStatus] = useState<"active" | "inactive">(
    (editHousehold?.garbage_status as "active" | "inactive") || "active"
  );
  const [garbageSizeId, setGarbageSizeId] = useState<number | "">(
    editHousehold?.garbage_size_id || ""
  );

  const [waterStatus, setWaterStatus] = useState<"active" | "inactive">(
    (editHousehold?.water_status as "active" | "inactive") || "active"
  );
  const [waterUserId, setWaterUserId] = useState<string>(editHousehold?.water_user_id || "");
  const [prevReading, setPrevReading] = useState<string>(
    editHousehold?.prev_reading !== undefined ? editHousehold.prev_reading.toString() : "0.00"
  );

  // Load dropdown options
  useEffect(() => {
    async function loadOptions() {
      try {
        const vData = await getVillages();
        setVillages(vData);

        const gData = await getGarbageRates();
        setGarbageRates(gData);
      } catch (err) {
        console.error("Failed to load options:", err);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูลตัวเลือกฟอร์ม");
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  // Auto-generate username and password in Create mode
  useEffect(() => {
    if (!editHousehold) {
      if (houseNumber && villageId) {
        const selectedVillage = villages.find(v => v.id === villageId);
        if (selectedVillage) {
          setUsername(`${houseNumber}-${selectedVillage.village_number}`);
        }
      } else {
        setUsername("");
      }
    }
  }, [houseNumber, villageId, villages, editHousehold]);

  useEffect(() => {
    if (!editHousehold) {
      setPassword(citizenId);
    }
  }, [citizenId, editHousehold]);

  // Submit action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseCode || !houseNumber || !villageId || !titleName || !firstName || !lastName || !phone || !citizenId) {
      alert("กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");
      return;
    }

    if (phone.length !== 10) {
      alert("เบอร์โทรศัพท์ต้องมี 10 หลัก");
      return;
    }

    if (citizenId.length !== 13) {
      alert("เลขบัตรประชาชนต้องมี 13 หลัก");
      return;
    }

    if (garbageStatus === "active" && !garbageSizeId) {
      alert("กรุณาเลือกขนาดถังขยะ");
      return;
    }

    if (waterStatus === "active" && !waterUserId) {
      alert("กรุณากรอกเลขมาตรวัดน้ำ");
      return;
    }

    // Handlers for unique constraint fields when service is inactive
    const finalWaterUserId = waterStatus === "active" ? waterUserId : `W-inactive-${houseCode}-${Date.now()}`;

    try {
      if (editHousehold) {
        // Edit mode
        const updateBody: UpdateHouseholdRequest = {
          village_id: Number(villageId),
          house_number: houseNumber,
          house_code: houseCode,
          title_name: titleName,
          first_name: firstName,
          last_name: lastName,
          citizen_id: citizenId,
          phone_number: phone,
          water_user_id: finalWaterUserId,
          water_status: waterStatus,
          garbage_status: garbageStatus,
          prev_reading: waterStatus === "active" ? parseFloat(prevReading) || 0 : 0,
          garbage_size_id: garbageStatus === "active" ? Number(garbageSizeId) : undefined,
          username: username,
          password: password || undefined
        };
        await updateHousehold(editHousehold.id, updateBody);
      } else {
        // Create mode
        const createBody: CreateHouseholdRequest = {
          village_id: Number(villageId),
          house_number: houseNumber,
          house_code: houseCode,
          title_name: titleName,
          first_name: firstName,
          last_name: lastName,
          citizen_id: citizenId,
          phone_number: phone,
          water_user_id: finalWaterUserId,
          prev_reading: waterStatus === "active" ? parseFloat(prevReading) || 0 : 0,
          staff_id: 1, // Default staff ID
          water_status: waterStatus,
          garbage_status: garbageStatus,
          garbage_size_id: garbageStatus === "active" ? Number(garbageSizeId) : undefined,
          username: username,
          password: password
        };
        await createHousehold(createBody);
      }
      onSave();
    } catch (err) {
      const error = err as Error;
      console.error(error);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message || error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 bg-white rounded-3xl border border-slate-200/80 shadow-sm min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0B409C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8 select-none">
      
      {/* Section 1: General Info */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 bg-blue-50 text-[#0B409C] rounded-xl border border-blue-100">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">ข้อมูลทั่วไป (General Information)</h3>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          
          {/* Household Code */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">รหัสครัวเรือน <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. HH-2023-001"
              value={houseCode}
              disabled={!!editHousehold}
              onChange={(e) => setHouseCode(e.target.value)}
              className={`w-full px-4 py-3 border rounded-2xl text-[14px] focus:outline-none transition-all shadow-sm ${
                editHousehold 
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed font-mono font-bold" 
                  : "bg-white border-slate-200/80 text-[#0B409C] font-mono font-bold focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C]"
              }`}
            />
          </div>

          {/* House Number */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">บ้านเลขที่ <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. 123/4"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 font-mono font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
            />
          </div>

          {/* Moo Village */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">หมู่ที่ <span className="text-red-500">*</span></label>
            <div className="relative">
              <select 
                value={villageId}
                onChange={(e) => setVillageId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="">เลือกหมู่บ้าน</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    หมู่ {v.village_number} - {v.village_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Title Name */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">คำนำหน้า <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={titleName}
                onChange={(e) => setTitleName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* First Name */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">ชื่อเจ้าบ้าน <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="ระบุชื่อ"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">นามสกุลเจ้าบ้าน <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="ระบุนามสกุล"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={10}
              placeholder="08XXXXXXXX (10 หลัก)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 font-mono font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
            />
          </div>

          {/* Citizen ID */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">เลขบัตรประชาชน <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={13}
              placeholder="ระบุเลขบัตรประชาชน 13 หลัก"
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 font-mono font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="ตั้งชื่อผู้ใช้งานสำหรับเข้าระบบ"
              value={username}
              disabled={!editHousehold}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 border rounded-2xl text-[14px] transition-all shadow-sm ${
                !editHousehold 
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed font-bold" 
                  : "bg-white border-slate-200/80 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C]"
              }`}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-500">รหัสผ่านสำหรับเข้าใช้งาน <span className="text-red-500">{!editHousehold ? "*" : ""}</span></label>
            <input 
              type={!editHousehold ? "text" : "password"}
              placeholder="ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร"
              value={password}
              disabled={!editHousehold}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 border rounded-2xl text-[14px] transition-all shadow-sm ${
                !editHousehold 
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed font-bold" 
                  : "bg-white border-slate-200/80 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C]"
              }`}
            />
          </div>

        </div>
      </div>

      {/* Section 2: Utility Details */}
      <div className="space-y-6 pt-4 border-t border-slate-100">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 bg-blue-50 text-[#0B409C] rounded-xl border border-blue-100">
            <Droplet className="w-5 h-5" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">ข้อมูลบริการ (Utility Details)</h3>
        </div>

        {/* Garbage Service Status */}
        <div className="space-y-5">
          <div className="space-y-2.5">
            <span className="text-[14px] font-bold text-slate-600 block">สถานะการรับบริการขยะ:</span>
            
            <div className="flex items-center space-x-8">
              {/* Accept Option */}
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="garbage_status"
                  checked={garbageStatus === "active"}
                  onChange={() => setGarbageStatus("active")}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  garbageStatus === "active"
                    ? "border-[#0B409C] bg-[#0B409C]"
                    : "border-slate-300 group-hover:border-[#0B409C]/40"
                }`}>
                  {garbageStatus === "active" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-[14px] font-bold text-slate-600 group-hover:text-slate-800">รับบริการ</span>
              </label>

              {/* Decline Option */}
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="garbage_status"
                  checked={garbageStatus === "inactive"}
                  onChange={() => {
                    setGarbageStatus("inactive");
                    setGarbageSizeId("");
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  garbageStatus === "inactive"
                    ? "border-[#0B409C] bg-[#0B409C]"
                    : "border-slate-300 group-hover:border-[#0B409C]/40"
                }`}>
                  {garbageStatus === "inactive" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-[14px] font-bold text-slate-600 group-hover:text-slate-800">ไม่รับบริการ</span>
              </label>
            </div>
          </div>

          {/* Bin Size Dropdown */}
          <div className="space-y-1.5 md:max-w-[48%]">
            <label className="text-[13px] font-bold text-slate-500">ขนาดถัง</label>
            <div className="relative">
              <select 
                value={garbageSizeId}
                disabled={garbageStatus === "inactive"}
                onChange={(e) => setGarbageSizeId(e.target.value === "" ? "" : Number(e.target.value))}
                className={`w-full px-4 py-3 border rounded-2xl text-[14px] font-semibold transition-all shadow-sm appearance-none ${
                  garbageStatus === "inactive"
                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border-slate-200/80 text-slate-700 focus:border-[#0B409C] focus:ring-2 focus:ring-[#0B409C]/20 cursor-pointer"
                }`}
              >
                <option value="">เลือกขนาดถัง</option>
                {garbageRates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.size_name} (อัตรา {g.cost} บาท/เดือน)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Water Service Status */}
        <div className="space-y-5 pt-4 border-t border-slate-100">
          <div className="space-y-2.5">
            <span className="text-[14px] font-bold text-slate-600 block">สถานะการรับบริการน้ำ:</span>
            
            <div className="flex items-center space-x-8">
              {/* Accept Option */}
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="water_status"
                  checked={waterStatus === "active"}
                  onChange={() => setWaterStatus("active")}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  waterStatus === "active"
                    ? "border-[#0B409C] bg-[#0B409C]"
                    : "border-slate-300 group-hover:border-[#0B409C]/40"
                }`}>
                  {waterStatus === "active" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-[14px] font-bold text-slate-600 group-hover:text-slate-800">รับบริการ</span>
              </label>

              {/* Decline Option */}
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <input 
                  type="radio" 
                  name="water_status"
                  checked={waterStatus === "inactive"}
                  onChange={() => {
                    setWaterStatus("inactive");
                    setWaterUserId("");
                    setPrevReading("0.00");
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  waterStatus === "inactive"
                    ? "border-[#0B409C] bg-[#0B409C]"
                    : "border-slate-300 group-hover:border-[#0B409C]/40"
                }`}>
                  {waterStatus === "inactive" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-[14px] font-bold text-slate-600 group-hover:text-slate-800">ไม่รับบริการ</span>
              </label>
            </div>
          </div>

          {/* Water Meter details row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Water Meter ID */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-500">เลขมาตรวัดน้ำ</label>
              <input 
                type="text" 
                placeholder="ระบุเลขมาตรวัดน้ำ"
                value={waterUserId}
                disabled={waterStatus === "inactive"}
                onChange={(e) => setWaterUserId(e.target.value)}
                className={`w-full px-4 py-3 border rounded-2xl text-[14px] font-mono font-bold transition-all shadow-sm ${
                  waterStatus === "inactive"
                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border-slate-200/80 text-[#0B409C] focus:border-[#0B409C] focus:ring-2 focus:ring-[#0B409C]/20"
                }`}
              />
            </div>

            {/* Meter Starting Value */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-500">เลขมาตรเริ่มต้น</label>
              <input 
                type="text" 
                placeholder="0.00"
                value={prevReading}
                disabled={waterStatus === "inactive"}
                onChange={(e) => setPrevReading(e.target.value)}
                className={`w-full px-4 py-3 border rounded-2xl text-[14px] text-center font-mono font-bold transition-all shadow-sm ${
                  waterStatus === "inactive"
                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border-slate-200/80 text-[#0B409C] focus:border-[#0B409C] focus:ring-2 focus:ring-[#0B409C]/20"
                }`}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Form Actions Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-5 border-t border-slate-100">
        <button 
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B409C]/20 focus-visible:border-[#0B409C]"
        >
          ยกเลิก
        </button>
        <button 
          type="submit"
          className="flex items-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B409C]/20 focus-visible:ring-offset-2"
        >
          <Save className="w-4 h-4" />
          <span className="text-[14px]">บันทึกข้อมูล</span>
        </button>
      </div>

    </form>
  );
}
