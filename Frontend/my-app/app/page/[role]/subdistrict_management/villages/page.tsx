"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Save, 
  HelpCircle, 
  CheckCircle, 
  RefreshCw,
  Search,
  ChevronDown,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Home,
  Users
} from "lucide-react";
import SuccessToast from "../../../../component/success-toast";
import { httpClient } from "../../../../service/http-client";

interface Village {
  id: number;
  village_name: string;
  village_number: number;
  subdistrict_id?: number;
  title_name: string;
  headman_firstname: string;
  headman_lastname: string;
  number_house: number;
  headman_phone_number: string;
  status?: "เปิดใช้งาน" | "ระงับชั่วคราว";
}

const defaultMockVillages: Village[] = [
  { id: 1, village_number: 1, village_name: "บ้านหนองนา", number_house: 120, title_name: "นาย", headman_firstname: "ชูเกียรติ", headman_lastname: "รักษ์บ้านเกิด", headman_phone_number: "081-234-5678", status: "เปิดใช้งาน" },
  { id: 2, village_number: 2, village_name: "บ้านท่าเรือ", number_house: 85, title_name: "นาง", headman_firstname: "วันดี", headman_lastname: "ศรีท่าเรือ", headman_phone_number: "089-876-5432", status: "เปิดใช้งาน" },
  { id: 3, village_number: 3, village_name: "บ้านดอนกลาง", number_house: 210, title_name: "นาย", headman_firstname: "สมเกียรติ", headman_lastname: "กลางดอน", headman_phone_number: "092-334-9988", status: "เปิดใช้งาน" },
  { id: 4, village_number: 4, village_name: "บ้านโนนสว่าง", number_house: 54, title_name: "นาย", headman_firstname: "สว่าง", headman_lastname: "ส่องแสง", headman_phone_number: "088-777-6655", status: "ระงับชั่วคราว" },
  { id: 5, village_number: 5, village_name: "บ้านคำแคน", number_house: 142, title_name: "นาย", headman_firstname: "แคน", headman_lastname: "เสียงทอง", headman_phone_number: "087-999-0000", status: "เปิดใช้งาน" }
];

export default function VillagesManagement() {
  const [view, setView] = useState<"list" | "form">("list");

  // Villages list state
  const [villagesList, setVillagesList] = useState<Village[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("ล่าสุด");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states
  const [villageId, setVillageId] = useState<number | null>(null);
  const [villageNumber, setVillageNumber] = useState<string>("1");
  const [villageName, setVillageName] = useState<string>("");
  const [numberHouse, setNumberHouse] = useState<number>(0);
  const [titleName, setTitleName] = useState<string>("นาย");
  const [headmanFirstname, setHeadmanFirstname] = useState<string>("");
  const [headmanLastname, setHeadmanLastname] = useState<string>("");
  const [headmanPhoneNumber, setHeadmanPhoneNumber] = useState<string>("");

  const [isNew, setIsNew] = useState<boolean>(true);

  // Toast / Notification states
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch villages
  const fetchVillages = async () => {
    try {
      setLoading(true);
      const data = await httpClient.get<Village[]>("/villages");
      
      // Map status for demo consistency with mockup
      const mappedData: Village[] = data.map((v) => ({
        ...v,
        status: v.village_number === 4 ? "ระงับชั่วคราว" : "เปิดใช้งาน"
      }));
      setVillagesList(mappedData);
    } catch (err) {
      console.warn("Could not load from local backend, using mock data", err);
      setVillagesList(defaultMockVillages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVillages();
  }, []);

  // Set default fields when creating a new village
  const handleAddNewClick = () => {
    setVillageId(null);
    // Find next available village number
    const maxNum = villagesList.reduce((max, v) => v.village_number > max ? v.village_number : max, 0);
    setVillageNumber(String(maxNum + 1));
    setVillageName("");
    setNumberHouse(0);
    setTitleName("นาย");
    setHeadmanFirstname("");
    setHeadmanLastname("");
    setHeadmanPhoneNumber("");
    setIsNew(true);
    setView("form");
  };

  // Set fields for editing an existing village
  const handleEditClick = (village: Village) => {
    setVillageId(village.id);
    setVillageNumber(String(village.village_number));
    setVillageName(village.village_name || "");
    setNumberHouse(village.number_house || 0);
    setTitleName(village.title_name || "นาย");
    setHeadmanFirstname(village.headman_firstname || "");
    setHeadmanLastname(village.headman_lastname || "");
    setHeadmanPhoneNumber(village.headman_phone_number || "");
    setIsNew(false);
    setView("form");
  };

  // Handle delete
  const handleDeleteClick = async (village: Village) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลหมู่บ้าน "หมู่ที่ ${village.village_number} ${village.village_name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await httpClient.delete(`/villages/${village.id}`);

      // Even if endpoint is mocked or offline, delete from local state for robustness
      setVillagesList((prev) => prev.filter((v) => v.id !== village.id));
      setToastMessage("ลบข้อมูลหมู่บ้านเรียบร้อยแล้ว!");
    } catch (err: any) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!villageNumber || !villageName) {
      alert("กรุณากรอกหมู่ที่และชื่อหมู่บ้านให้ครบถ้วน!");
      return;
    }

    const body = {
      subdistrict_id: 1, // Mock subdistrict ID as 1
      village_name: villageName,
      village_number: Number(villageNumber),
      title_name: titleName,
      headman_firstname: headmanFirstname || "-",
      headman_lastname: headmanLastname || "-",
      number_house: numberHouse || 0,
      headman_phone_number: headmanPhoneNumber || "-",
    };

    try {
      setLoading(true);
      if (isNew) {
        await httpClient.post("/villages", body);
      } else {
        await httpClient.patch(`/villages/${villageId}`, body);
      }

      setToastMessage(isNew ? "เพิ่มข้อมูลหมู่บ้านเรียบร้อยแล้ว!" : "บันทึกการแก้ไขข้อมูลหมู่บ้านเรียบร้อยแล้ว!");
      await fetchVillages(); // Reload list
      setView("list");
    } catch (err: any) {
      console.error(err);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtered & Sorted Villages
  const filteredVillages = useMemo(() => {
    return villagesList
      .filter((v) => {
        const matchesSearch = v.village_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              String(v.village_number).includes(searchTerm) ||
                              `v-${String(v.village_number).padStart(3, "0")}`.includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "รหัสหมู่บ้าน") {
          return a.village_number - b.village_number;
        }
        if (sortBy === "ชื่อหมู่บ้าน") {
          return a.village_name.localeCompare(b.village_name, "th");
        }
        // "ล่าสุด" sorting (by id descending)
        return b.id - a.id;
      });
  }, [villagesList, searchTerm, sortBy]);

  // Paginated Villages
  const paginatedVillages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVillages.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVillages, currentPage]);

  const totalPages = Math.ceil(filteredVillages.length / itemsPerPage) || 1;

  // Metric summaries
  const totalVillagesCount = villagesList.length;
  const totalHouseholdsCount = villagesList.reduce((sum, v) => sum + (v.number_house || 0), 0);
  const totalWarningsCount = villagesList.filter((v) => v.status === "ระงับชั่วคราว" || !v.headman_firstname || v.headman_firstname === "-").length;

  return (
    <div className="space-y-6 font-sans relative">
      {/* Success Toast */}
      {toastMessage && (
        <SuccessToast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}

      {/* Loading Backdrop spinner overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
          <div className="w-12 h-12 border-4 border-[#0B409C] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* 1. LIST VIEW */}
      {view === "list" && (
        <>
          {/* Search, Filter, Sort Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="ค้นหาด้วยรหัส หรือชื่อหมู่บ้าน..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
              />
            </div>

            {/* Right Group: Sort & Add Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
              {/* Sort By */}
              <div className="relative w-full sm:w-48">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-[13.5px] text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition appearance-none cursor-pointer shadow-sm"
                >
                  <option value="ล่าสุด">เรียงตาม: ล่าสุด</option>
                  <option value="รหัสหมู่บ้าน">เรียงตาม: รหัสหมู่บ้าน</option>
                  <option value="ชื่อหมู่บ้าน">เรียงตาม: ชื่อหมู่บ้าน</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Add Button */}
              <button 
                onClick={handleAddNewClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold px-6 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition duration-200 transform active:scale-95 cursor-pointer text-[13.5px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B409C]/20 focus-visible:ring-offset-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>เพิ่มหมู่บ้านใหม่</span>
              </button>
            </div>
          </div>

          {/* Villages Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden pb-5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-600 font-bold text-[13px] bg-slate-50/50">
                    <th className="px-8 pt-5 pb-4 w-1/4">รหัสหมู่บ้าน</th>
                    <th className="px-8 pt-5 pb-4 w-1/4">ชื่อหมู่บ้าน</th>
                    <th className="px-8 pt-5 pb-4 w-1/4 text-center">จำนวนครัวเรือน</th>
                    <th className="px-8 pt-5 pb-4 w-1/4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedVillages.length > 0 ? (
                    paginatedVillages.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/20 transition duration-150">
                        {/* Village Code */}
                        <td className="px-8 py-4 font-mono font-bold text-[#0B409C]">
                          V-{String(item.village_number).padStart(3, "0")}
                        </td>

                        {/* Village Name */}
                        <td className="px-8 py-4 font-bold text-slate-700">
                          {item.village_name}
                        </td>

                        {/* Households Count */}
                        <td className="px-8 py-4 text-center font-mono font-bold text-slate-600">
                          {item.number_house}
                        </td>

                        {/* Action buttons */}
                        <td className="px-8 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 text-[#0B409C] hover:bg-blue-50 rounded-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B409C]/20"
                              title="แก้ไขข้อมูลหมู่บ้าน"
                            >
                              <Edit3 className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(item)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="ลบข้อมูลหมู่บ้าน"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
            <div className="px-8 pt-4 mt-2 flex items-center justify-between border-t border-slate-100">
              <p className="text-[13px] text-slate-500 font-bold">
                แสดง {filteredVillages.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} ถึง {Math.min(currentPage * itemsPerPage, filteredVillages.length)} จากทั้งหมด {filteredVillages.length} รายการ
              </p>

              <div className="flex items-center space-x-1">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className={`p-2 rounded-xl transition shadow-sm border border-slate-200/80 cursor-pointer ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed text-slate-300" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button 
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl text-[13px] font-bold shadow-md cursor-pointer transition transform active:scale-95 ${
                        currentPage === pNum 
                          ? "bg-[#0B409C] text-white" 
                          : "border border-slate-200/80 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className={`p-2 rounded-xl transition shadow-sm border border-slate-200/80 cursor-pointer ${
                    currentPage === totalPages ? "opacity-50 cursor-not-allowed text-slate-300" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* 2 Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none pt-2">
            {/* Card 1: หมู่บ้านทั้งหมด */}
            <div className="bg-[#EEF2F6]/60 rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between h-32">
              <p className="text-[13px] font-bold text-slate-600 leading-none">หมู่บ้านทั้งหมด</p>
              <span className="text-3xl font-extrabold font-mono text-[#0B409C]">{totalVillagesCount}</span>
            </div>

            {/* Card 2: ครัวเรือนทั้งหมด */}
            <div className="bg-[#E6F4EA]/60 rounded-3xl p-6 border border-[#CEEAD6]/60 shadow-sm flex flex-col justify-between h-32">
              <p className="text-[13px] font-bold text-slate-600 leading-none">ครัวเรือนทั้งหมด</p>
              <span className="text-3xl font-extrabold font-mono text-emerald-700">{totalHouseholdsCount.toLocaleString()}</span>
            </div>
          </div>
        </>
      )}

      {/* 2. FORM VIEW */}
      {view === "form" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">
              {isNew ? "เพิ่มหมู่บ้านใหม่" : `แก้ไขข้อมูลหมู่บ้าน (V-${String(villageNumber).padStart(3, "0")})`}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
            
            {/* ส่วนที่ 1: ข้อมูลหมู่บ้าน */}
            <div className="space-y-4">
              <div className="text-[14px] font-bold text-slate-700">ข้อมูลหมู่บ้าน</div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* หมู่ที่ */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-500 block">หมู่ที่ <span className="text-red-500">*</span></label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="ระบุหมู่"
                    value={villageNumber}
                    disabled={!isNew} // Lock village number when editing
                    onChange={(e) => setVillageNumber(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-2xl text-[14px] font-bold focus:outline-none transition-all shadow-sm ${
                       !isNew 
                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-white border-slate-200/80 text-slate-700 focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C]"
                    }`}
                  />
                </div>

                {/* ชื่อหมู่บ้าน */}
                <div className="space-y-2 md:col-span-7">
                  <label className="text-[13px] font-bold text-slate-500 block">ชื่อหมู่บ้าน <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    placeholder="ระบุชื่อหมู่บ้าน"
                    value={villageName}
                    onChange={(e) => setVillageName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                  />
                </div>

                {/* จำนวนครัวเรือน */}
                <div className="space-y-2 md:col-span-3">
                  <label className="text-[13px] font-bold text-slate-500 block">จำนวนครัวเรือน</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={numberHouse || ""}
                    onChange={(e) => setNumberHouse(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* ส่วนที่ 2: ข้อมูลผู้ใหญ่บ้าน */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="text-[14px] font-bold text-slate-700">ข้อมูลผู้ใหญ่บ้าน</div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* คำนำหน้า */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-500 block">คำนำหน้า</label>
                  <select
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm bg-white cursor-pointer"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="นาง">นาง</option>
                  </select>
                </div>

                {/* ชื่อผู้ใหญ่บ้าน */}
                <div className="space-y-2 md:col-span-3">
                  <label className="text-[13px] font-bold text-slate-500 block">ชื่อผู้ใหญ่บ้าน</label>
                  <input 
                    type="text"
                    placeholder="ระบุชื่อผู้ใหญ่บ้าน"
                    value={headmanFirstname}
                    onChange={(e) => setHeadmanFirstname(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                  />
                </div>

                {/* นามสกุลผู้ใหญ่บ้าน */}
                <div className="space-y-2 md:col-span-4">
                  <label className="text-[13px] font-bold text-slate-500 block">นามสกุลผู้ใหญ่บ้าน</label>
                  <input 
                    type="text"
                    placeholder="ระบุนามสกุลผู้ใหญ่บ้าน"
                    value={headmanLastname}
                    onChange={(e) => setHeadmanLastname(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                  />
                </div>

                {/* เบอร์โทรผู้ใหญ่บ้าน */}
                <div className="space-y-2 md:col-span-3">
                  <label className="text-[13px] font-bold text-slate-500 block">เบอร์โทรผู้ใหญ่บ้าน</label>
                  <input 
                    type="text"
                    placeholder="ระบุเบอร์โทรผู้ใหญ่บ้าน"
                    value={headmanPhoneNumber}
                    onChange={(e) => setHeadmanPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            {/* Form Actions Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button 
                type="button"
                onClick={() => setView("list")}
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

          {/* Bottom informational Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
            
            {/* Info Card 1 */}
            <div className="bg-[#FAF9F5] rounded-3xl p-5 border border-amber-100/50 flex space-x-4 shadow-sm">
              <div className="text-amber-500 flex-shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-slate-700">ข้อมูลจำเป็น</h4>
                <p className="text-[12px] font-medium text-slate-500 mt-1 leading-normal">
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
                <p className="text-[12px] font-medium text-slate-500 mt-1 leading-normal">
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
                <p className="text-[12px] font-medium text-slate-500 mt-1 leading-normal">
                  ข้อมูลจะปรากฏในรายงานภาพรวมทันทีหลังจากยืนยัน
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
