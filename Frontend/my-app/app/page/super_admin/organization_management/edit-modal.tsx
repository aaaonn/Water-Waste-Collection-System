"use client";

import { useState, useEffect } from "react";
import { X, Building } from "lucide-react";
import { UpdateOrganizationRequest } from "../../../interface/organization";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateOrganizationRequest) => void;
  initialData?: UpdateOrganizationRequest | null;
}

export default function EditOrganizationModal({ isOpen, onClose, onSubmit, initialData }: EditModalProps) {
  const [formData, setFormData] = useState<UpdateOrganizationRequest>({
    title_name: "นาย",
    first_name: "",
    last_name: "",
    phone_number: "",
    address_number: "",
    village_id: 1,
    subdistrict_name: "",
    district_name: "",
    province_name: "",
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "village_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0B132B] px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">แก้ไขข้อมูลองค์กร</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              ข้อมูลนายกองค์การบริหารส่วนตำบล
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">คำนำหน้า <span className="text-rose-500">*</span></label>
                <select 
                  name="title_name" 
                  value={formData.title_name} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:border-[#0B409C] focus:bg-white transition-colors cursor-pointer appearance-none"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
              </div>
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">ชื่อ <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:border-[#0B409C] focus:bg-white transition-colors"
                />
              </div>
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">นามสกุล <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="last_name" 
                  value={formData.last_name} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:border-[#0B409C] focus:bg-white transition-colors"
                />
              </div>
              <div className="sm:col-span-6 space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">เบอร์โทรศัพท์ <span className="text-rose-500">*</span></label>
                <input 
                  type="tel" 
                  name="phone_number" 
                  value={formData.phone_number} 
                  onChange={handleChange}
                  maxLength={10}
                  required
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:border-[#0B409C] focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              ที่ตั้งสำนักงาน
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">เลขที่ <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  name="address_number" 
                  value={formData.address_number} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:border-[#0B409C] focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-500">หมู่ที่ <span className="text-rose-500">*</span></label>
                <select 
                  name="village_id" 
                  value={formData.village_id || 1} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:border-[#0B409C] focus:bg-white transition-colors cursor-pointer appearance-none"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>หมู่ที่ {num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-[#0B409C] hover:bg-[#09337d] text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
            >
              บันทึกข้อมูล
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
