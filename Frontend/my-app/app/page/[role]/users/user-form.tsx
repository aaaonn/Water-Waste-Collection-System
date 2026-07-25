"use client";

import { useState, useEffect } from "react";
import { 
  Camera, 
  Eye, 
  EyeOff, 
  Info, 
  Save, 
  Trash2,
  ChevronDown,
  User
} from "lucide-react";
import { UserstaffResponse } from "../../../service/userstaff";

interface UserFormProps {
  editStaff?: UserstaffResponse | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete?: (id: number) => void;
}

export default function UserForm({ editStaff, onSave, onCancel, onDelete }: UserFormProps) {
  const isEdit = !!editStaff;

  // Input states
  const [titleName, setTitleName] = useState("นาย");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("staff");
  const [status, setStatus] = useState("active");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ขนาดไฟล์ภาพต้องไม่เกิน 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load values when editing
  useEffect(() => {
    if (editStaff) {
      setTitleName(editStaff.title_name || "นาย");
      setFirstName(editStaff.first_name || "");
      setLastName(editStaff.last_name || "");
      setPhone(editStaff.phone_number || "");
      setUsername(editStaff.username || "");
      setRole(editStaff.role || "staff");
      setStatus(editStaff.status || "active");
      setProfileImage(null);
      setPassword(""); // Clear password field for security
    } else {
      setTitleName("นาย");
      setFirstName("");
      setLastName("");
      setPhone("");
      setUsername("");
      setRole("staff");
      setStatus("active");
      setProfileImage(null);
      setPassword("");
    }
  }, [editStaff]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !phone || !role || (!isEdit && !password) || (!isEdit && !username)) {
      alert("กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก");
      return;
    }

    const payload: any = {
      title_name: titleName,
      first_name: firstName,
      last_name: lastName,
      phone_number: cleanPhone,
      role: role,
      status: status,
    };

    if (!isEdit) {
      payload.username = username;
      payload.password = password;
    } else if (password) {
      payload.password = password;
    }

    onSave(payload);
  };

  const handleDeleteClick = () => {
    if (!editStaff || !onDelete) return;
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบเจ้าหน้าที่ ${editStaff.first_name} ${editStaff.last_name}?`)) {
      onDelete(editStaff.id);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* Main Form Container Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
        
        {/* Title Header with Vertical Blue Line */}
        <div className="flex items-center space-x-3.5 pb-2">
          <div className="w-1.5 h-6 bg-[#0B409C] rounded-full"></div>
          <h3 className="text-[16px] font-bold text-slate-800">
            {isEdit ? "แก้ไขข้อมูลพื้นฐานเจ้าหน้าที่" : "เพิ่มข้อมูลพื้นฐานเจ้าหน้าที่"}
          </h3>
        </div>

        {/* Hidden File Input */}
        <input 
          type="file"
          id="profile-upload"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Dotted Profile Upload Area */}
        <div className="border border-dashed border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-[#F8FAFC]/50">
          {/* Avatar Circle Container */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 stroke-[1.2]" />
              )}
            </div>
            {/* Overlaid Camera Icon */}
            <button 
              type="button"
              onClick={() => document.getElementById("profile-upload")?.click()}
              className="absolute bottom-0 right-0 p-2 bg-[#0B409C] hover:bg-[#09337d] text-white rounded-full shadow-md transition transform active:scale-90"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Upload helper text & Select button */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h4 className="text-[14px] font-bold text-slate-700">อัปโหลดรูปโปรไฟล์</h4>
            <p className="text-[12px] text-slate-400 font-medium leading-normal">
              รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
            </p>
            <button 
              type="button"
              onClick={() => document.getElementById("profile-upload")?.click()}
              className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm cursor-pointer"
            >
              เลือกรูปภาพ
            </button>
          </div>
        </div>

        {/* Inputs Fields Row 1 (Title, First/Last name) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Title Name */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500">คำนำหน้าชื่อ <span className="text-red-500">*</span></label>
            <div className="relative">
              <select 
                value={titleName}
                onChange={(e) => setTitleName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="นาย">นาย</option>
                <option value="นางสาว">นางสาว</option>
                <option value="นาง">นาง</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500">ชื่อ <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="ระบุชื่อจริง"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500">นามสกุล <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="ระบุนามสกุล"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Inputs Fields Row 2 (Phone/Position/Status) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="08X-XXX-XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Position/Role Selection */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500">ตำแหน่ง <span className="text-red-500">*</span></label>
            <div className="relative">
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="admin">หัวหน้าชุดปฏิบัติการ</option>
                <option value="staff">เจ้าหน้าที่เก็บข้อมูล</option>
                <option value="field_staff">เจ้าหน้าที่ตรวจสอบพื้นที่</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500">สถานะ <span className="text-red-500">*</span></label>
            <div className="relative">
              <select 
                value={status}
                disabled={!isEdit}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer ${
                  !isEdit ? "bg-slate-100/80 text-slate-400 cursor-not-allowed" : "bg-white"
                }`}
              >
                <option value="active">เปิดใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Inputs Fields Row 3 (Username/Password) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500">ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="ตั้งชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
              value={username}
              disabled={isEdit}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${
                isEdit ? "bg-slate-100/80 text-slate-400 cursor-not-allowed" : "bg-white"
              }`}
            />
          </div>

          {/* Password with toggle eye */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500">
              รหัสผ่านสำหรับเข้าใช้งาน {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={isEdit ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
              {/* Eye Toggle button */}
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>



        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={onCancel}
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

    </div>
  );
}
