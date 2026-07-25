"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  UserPlus, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Radio, 
  BellOff, 
  FileWarning,
  ChevronDown
} from "lucide-react";
import { UserstaffResponse } from "../../../service/userstaff";

interface UserListProps {
  staffList: UserstaffResponse[];
  isLoading?: boolean;
  onAddClick: () => void;
  onEditClick: (staff: UserstaffResponse) => void;
  onDelete: (id: number) => void;
  hideStats?: boolean;
}

export default function UserList({ staffList, isLoading, onAddClick, onEditClick, hideStats = false }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset pagination on search or role change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  // Dynamic statistics calculations
  const totalCount = staffList.length;
  const activeCount = staffList.filter(s => s.status === "active").length;
  const inactiveCount = staffList.filter(s => s.status === "inactive").length;

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 10) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "หัวหน้าชุดปฏิบัติการ";
      case "staff":
        return "เจ้าหน้าที่เก็บข้อมูล";
      case "field_staff":
        return "เจ้าหน้าที่ตรวจสอบพื้นที่";
      default:
        return role;
    }
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesRole = selectedRole === "all" || s.role === selectedRole;
      
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      const formattedId = `fs-2024-${String(s.id).padStart(3, '0')}`;
      const phone = s.phone_number.toLowerCase();
      const roleLabel = getRoleLabel(s.role).toLowerCase();
      
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        fullName.includes(search) ||
        formattedId.includes(search) ||
        phone.includes(search) ||
        roleLabel.includes(search);
        
      return matchesRole && matchesSearch;
    });
  }, [staffList, searchTerm, selectedRole]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;

  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStaff, currentPage, itemsPerPage]);

  const startIndex = filteredStaff.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredStaff.length);

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* 4 Stats Cards Grid */}
      {!hideStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: เจ้าหน้าที่ทั้งหมด */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all duration-200">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-[#0C5AE9]" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-slate-400">เจ้าหน้าที่ทั้งหมด</p>
              <div className="flex items-center mt-1">
                <span className="text-3xl font-extrabold text-[#0B132B]">{totalCount}</span>
                <span className="text-3xl font-extrabold text-[#0B132B] ml-2">คน</span>
              </div>
            </div>
          </div>

          {/* Card 2: กำลังปฏิบัติงาน */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all duration-200">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Radio className="w-6 h-6 text-[#22C55E]" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-slate-400">กำลังปฏิบัติงาน</p>
              <div className="flex items-center mt-1">
                <span className="text-3xl font-extrabold text-[#22C55E]">{activeCount}</span>
                <span className="text-3xl font-extrabold text-[#22C55E] ml-2">คน</span>
              </div>
            </div>
          </div>

          {/* Card 3: อยู่นอกเวลา */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all duration-200">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <BellOff className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-slate-400">อยู่นอกเวลา</p>
              <div className="flex items-center mt-1">
                <span className="text-3xl font-extrabold text-[#F59E0B]">{inactiveCount}</span>
                <span className="text-3xl font-extrabold text-[#F59E0B] ml-2">คน</span>
              </div>
            </div>
          </div>

          {/* Card 4: รายงานรอดำเนินการ */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center space-x-5 hover:shadow-md transition-all duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FileWarning className="w-6 h-6 text-rose-500" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-slate-400">รายงานรอดำเนินการ</p>
              <div className="mt-1">
                <span className="text-3xl font-extrabold text-rose-500 block leading-none">12</span>
                <span className="text-xl font-extrabold text-rose-500 block leading-none">รายการ</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 py-5">
        
        {/* Search Bar & Action Buttons */}
        <div className="px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="ค้นหาชื่อเจ้าหน้าที่ หรือตำแหน่ง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500/30 transition-all shadow-inner"
              />
            </div>

            {/* Position filter dropdown */}
            <div className="relative min-w-[180px]">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full appearance-none bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-5 pr-10 py-2.5 text-[13.5px] font-bold text-slate-600 focus:outline-none focus:bg-white focus:border-blue-500/30 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">ตำแหน่งทั้งหมด</option>
                <option value="admin">หัวหน้าชุดปฏิบัติการ</option>
                <option value="staff">เจ้าหน้าที่เก็บข้อมูล</option>
                <option value="field_staff">เจ้าหน้าที่ตรวจสอบพื้นที่</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <button 
            onClick={onAddClick}   
            className="flex items-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold px-5 py-3 rounded-2xl shadow-md transition-all duration-150 transform active:scale-95 cursor-pointer text-[14px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มเจ้าหน้าที่ใหม่</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="px-8 py-12 text-center text-slate-400 text-[14px]">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <table className="w-full border-collapse text-left min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-[13px] bg-slate-50/30">
                  <th className="px-8 py-4 w-[30%]">ชื่อ-นามสกุล</th>
                  <th className="px-8 py-4 w-[25%]">ตำแหน่ง</th>
                  <th className="px-8 py-4 w-[20%]">เบอร์โทรศัพท์</th>
                  <th className="px-8 py-4 text-center w-[15%]">สถานะ</th>
                  <th className="px-8 py-4 text-center w-[10%]">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedStaff.length > 0 ? (
                  paginatedStaff.map((staff) => {
                    const fullName = `${staff.first_name} ${staff.last_name}`;
                    const displayId = `FS-2024-${String(staff.id).padStart(3, '0')}`;
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/30 transition-colors duration-150">
                        
                        {/* Name & ID avatar */}
                        <td className="px-8 py-4 flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-[#EEF2F6] text-[#0C5AE9] flex items-center justify-center font-bold text-[15px] border border-slate-100 flex-shrink-0 select-none">
                            {staff.first_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-slate-800 leading-tight">{fullName}</p>
                            <span className="text-[11px] text-slate-400 font-mono font-bold mt-0.5 block">ID: {displayId}</span>
                          </div>
                        </td>

                        {/* Role/Position */}
                        <td className="px-8 py-4 text-[14px] text-slate-700 font-bold">
                          {getRoleLabel(staff.role)}
                        </td>

                        {/* Phone */}
                        <td className="px-8 py-4 text-[14px] text-slate-600 font-bold">
                          {formatPhone(staff.phone_number)}
                        </td>

                        {/* Status badge */}
                        <td className="px-8 py-4 text-center">
                          <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-[12px] font-bold ${
                            staff.status === "active" 
                              ? "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]" 
                              : "bg-[#F1F3F4] text-[#3C4043] border border-[#DADCE0]"
                          }`}>
                            {staff.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          </span>
                        </td>

                        {/* Actions: Edit icon */}
                        <td className="px-8 py-4 text-center">
                          <button 
                            onClick={() => onEditClick(staff)}
                            className="p-2 text-[#0B409C] hover:text-[#0C5AE9] transition-all duration-150 transform hover:scale-110 active:scale-95 cursor-pointer"
                            title="แก้ไขข้อมูลเจ้าหน้าที่"
                          >
                            <Edit3 className="w-5 h-5 stroke-[2]" />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-slate-400 text-[14px]">
                      ไม่พบเจ้าหน้าที่ที่ตรงกับการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="px-8 pt-4 flex items-center justify-between border-t border-slate-100">
          <p className="text-[13px] text-slate-400 font-bold">
            แสดง {startIndex} ถึง {endIndex} จากทั้งหมด {filteredStaff.length} รายชื่อ
          </p>

          {/* Borderless Figma pagination buttons */}
          <div className="flex items-center space-x-1 select-none">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl transition cursor-pointer ${
                currentPage === 1 ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-xl text-[13px] font-bold transition shadow-sm transform hover:scale-105 active:scale-95 cursor-pointer ${
                  page === currentPage
                    ? "bg-[#0B409C] text-white shadow-md"
                    : "text-slate-400 hover:bg-slate-100 font-semibold"
                }`}
              >
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl transition cursor-pointer ${
                currentPage === totalPages ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:bg-slate-100"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
