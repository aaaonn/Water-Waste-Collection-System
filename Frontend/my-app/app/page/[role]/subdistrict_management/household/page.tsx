"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2,
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Upload
} from "lucide-react";
import CreateForm from "./create-form";
import SuccessModal from "./success-modal";
import ImportModal from "./import-modal";
import SuccessToast from "../../../../component/success-toast";
import { Household, VillageResponse } from "../../../../interface/household";
import { getHouseholds, getVillages, deleteHousehold } from "../../../../service/household";

export default function StaffHousehold() {
  // Navigation & Modal state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showImportToast, setShowImportToast] = useState<boolean>(false);
  const [importResultMessage, setImportResultMessage] = useState<string>("");

  // API retrieved data states
  const [households, setHouseholds] = useState<Household[]>([]);
  const [villages, setVillages] = useState<VillageResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMoo, setSelectedMoo] = useState<string>("ทุกหมู่บ้าน"); // village_id as string

  // Fetch households
  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      const data = await getHouseholds();
      setHouseholds(data);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลครัวเรือน");
    } finally {
      setLoading(false);
    }
  };

  // Fetch villages
  const fetchVillages = async () => {
    try {
      const data = await getVillages();
      setVillages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHouseholds();
    fetchVillages();
  }, []);

  // Handle Delete Click
  const handleDeleteClick = async (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลครัวเรือนนี้?")) {
      try {
        await deleteHousehold(id);
        alert("ลบข้อมูลครัวเรือนสำเร็จ");
        fetchHouseholds();
      } catch (err) {
        const error = err as Error;
        console.error(error);
        alert(`เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message || error}`);
      }
    }
  };

  // Filter logic
  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      const fullName = `${h.first_name} ${h.last_name}`.trim();
      const matchesSearch = String(h.house_number || "").includes(searchTerm) || 
                            fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            h.house_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMoo = selectedMoo === "ทุกหมู่บ้าน" || h.village_id === Number(selectedMoo);
      
      return matchesSearch && matchesMoo;
    });
  }, [households, searchTerm, selectedMoo]);

  // Form Save Action
  const handleSave = () => {
    fetchHouseholds();
    setShowSuccessModal(true);
  };

  if (loading && households.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#0B409C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* 1. MAIN TABLE VIEW */}
      {!isCreating && !editingHousehold && (
        <>
          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-transparent select-none">
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="ค้นหาบ้านเลขที่/ชื่อเจ้าของบ้าน/รหัสครัวเรือน"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
              />
            </div>

            {/* Right Group: Dropdowns & Add Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
              {/* Moo Dropdown */}
              <div className="relative w-full sm:w-48">
                <select
                  value={selectedMoo}
                  onChange={(e) => setSelectedMoo(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-[13.5px] text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition appearance-none cursor-pointer shadow-sm"
                >
                  <option value="ทุกหมู่บ้าน">ทุกหมู่บ้าน</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      หมู่ {v.village_number} - {v.village_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Import Household Button */}
              <button 
                onClick={() => setShowImportModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition duration-200 transform active:scale-95 cursor-pointer text-[13.5px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:ring-offset-2"
              >
                <Upload className="w-4 h-4 stroke-[3]" />
                <span className="text-[13.5px]">นำเข้าข้อมูล (Excel/CSV)</span>
              </button>

              {/* Add Household Button */}
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold px-6 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition duration-200 transform active:scale-95 cursor-pointer text-[13.5px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B409C]/20 focus-visible:ring-offset-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="text-[13.5px]">เพิ่มข้อมูลครัวเรือน</span>
              </button>
            </div>
          </div>

          {/* Households Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden pb-5 select-none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-600 font-bold text-[13px] bg-slate-50/50">
                    <th className="px-8 pt-5 pb-4 w-1/4">รหัสครัวเรือน</th>
                    <th className="px-8 pt-5 pb-4 w-1/4">บ้านเลขที่ / หมู่</th>
                    <th className="px-8 pt-5 pb-4 w-1/4">ชื่อเจ้าของบ้าน</th>
                    <th className="px-8 pt-5 pb-4 w-1/4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHouseholds.length > 0 ? (
                    filteredHouseholds.map((household) => {
                      const villageObj = villages.find(v => v.id === household.village_id);
                      const mooText = villageObj ? `หมู่ ${villageObj.village_number} - ${villageObj.village_name}` : `หมู่ที่ ${household.village_id}`;
                      const ownerName = `${household.title_name}${household.first_name} ${household.last_name}`.trim();

                      return (
                        <tr key={household.id} className="hover:bg-slate-50/20 transition duration-150">
                          {/* Household Code with Monospace font */}
                          <td className="px-8 py-4 font-mono font-bold text-[#0B409C]">
                            {household.house_code}
                          </td>

                          {/* House Number & Moo */}
                          <td className="px-8 py-4">
                            <div className="flex flex-col">
                              <span className="text-[14px] font-mono font-bold text-slate-700">{household.house_number}</span>
                              <span className="text-[12px] text-slate-400 font-semibold">{mooText}</span>
                            </div>
                          </td>

                          {/* Owner Name */}
                          <td className="px-8 py-4 font-bold text-slate-700">
                            {ownerName ? (
                              <span>{ownerName}</span>
                            ) : (
                              <span className="italic text-slate-300">(ไม่มีชื่อเจ้าของบ้าน)</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-8 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button 
                                onClick={() => setEditingHousehold(household)}
                                className="p-1.5 text-[#0B409C] hover:bg-blue-50 rounded-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B409C]/20"
                                title="แก้ไขข้อมูลครัวเรือน"
                              >
                                <Edit3 className="w-4.5 h-4.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(household.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20"
                                title="ลบข้อมูลครัวเรือน"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-[14px]">
                        ไม่พบข้อมูลที่ตรงกับการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-8 pt-4 mt-2 flex items-center justify-between border-t border-slate-100 flex-wrap gap-4">
              <p className="text-[13px] text-slate-500 font-bold">
                แสดง 1 ถึง {filteredHouseholds.length} จาก {filteredHouseholds.length} รายการ
              </p>
              <div className="flex items-center space-x-1 select-none">
                <button className="p-2 rounded-xl transition shadow-sm border border-slate-200/80 text-slate-500 hover:bg-slate-50 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center bg-[#0B409C] text-white rounded-xl text-[13px] font-bold shadow-md cursor-pointer transition transform active:scale-95">1</button>
                <button className="p-2 rounded-xl transition shadow-sm border border-slate-200/80 text-slate-500 hover:bg-slate-50 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. CREATION FORM VIEW */}
      {(isCreating || editingHousehold) && (
        <CreateForm 
          onSave={handleSave} 
          onCancel={() => {
            setIsCreating(false);
            setEditingHousehold(null);
          }} 
          editHousehold={editingHousehold || undefined}
        />
      )}

      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(data: any) => {
          fetchHouseholds();
          // ไม่ต้องปิด Modal ทันที ให้ผู้ใช้ดูสรุปผลก่อน
          
          // Show beautiful Toast instead of alert
          let msg = `เพิ่มข้อมูลใหม่ ${data.success_count} รายการ`;
          if (data.skipped_count && data.skipped_count > 0) {
            msg += `, ข้ามข้อมูลเดิม ${data.skipped_count} รายการ`;
          }
          setImportResultMessage(msg);
          setShowImportToast(true);
        }}
      />

      {/* 4. SUCCESS MODAL OVERLAY (For Create/Edit) */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onAddOther={() => setShowSuccessModal(false)}
        onClose={() => {
          setShowSuccessModal(false);
          setIsCreating(false);
          setEditingHousehold(null);
        }}
      />

      {/* 5. IMPORT SUCCESS TOAST */}
      {showImportToast && (
        <SuccessToast
          title="เพิ่มข้อมูลสำเร็จ"
          message={importResultMessage}
          onClose={() => setShowImportToast(false)}
          duration={4000}
        />
      )}

    </div>
  );
}
