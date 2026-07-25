"use client";

import { useState, useEffect } from "react";
import DeleteToast from "../../../component/delete-toast";
import SuccessToast from "../../../component/success-toast";
import { organizationService } from "../../../service/organization";
import { OrganizationResponse } from "../../../interface/organization";
import {
  Users,
  Radio,
  Clock,
  FileWarning,
  Building,
  Edit3,
  Save,
  HelpCircle,
  CheckCircle,
  RefreshCw,
  Home,
  MapPin,
  Phone
} from "lucide-react";
import UserList from "../../[role]/users/user-list";
import UserForm from "../../[role]/users/user-form";
import SuccessModal from "../../[role]/users/success-modal";
import { 
  getUserstaffs, 
  createUserstaff, 
  updateUserstaff, 
  deleteUserstaff, 
  UserstaffResponse 
} from "../../../service/userstaff";

export default function OrganizationManagement() {
  // Separate view states for organization card and staff table
  const [orgView, setOrgView] = useState<"details" | "edit">("details");
  const [staffView, setStaffView] = useState<"list" | "create" | "edit">("list");

  // Staff States
  const [staffList, setStaffList] = useState<UserstaffResponse[]>([]);
  const [editStaff, setEditStaff] = useState<UserstaffResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [orgData, setOrgData] = useState<OrganizationResponse | null>(null);

  // Form states for Organization
  const [titleName, setTitleName] = useState("นาย");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [villageId, setVillageId] = useState(1);
  const [subdistrictName, setSubdistrictName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [provinceName, setProvinceName] = useState("");

  const fetchOrganization = async () => {
    try {
      const response = await organizationService.getOrganization();
      setOrgData(response.data);
      if (response.data) {
        setTitleName(response.data.title_name || "นาย");
        setFirstName(response.data.first_name || "");
        setLastName(response.data.last_name || "");
        setPhoneNumber(response.data.phone_number || "");
        setAddressNumber(response.data.address_number || "");
        setVillageId(response.data.village_id || 1);
        setSubdistrictName(response.data.organization_full_name ? response.data.organization_full_name.replace("องค์การบริหารส่วนตำบล", "") : "");
        setDistrictName(response.data.district_name || "");
        setProvinceName(response.data.province_name || "");
      }
    } catch (error) {
      console.error("Failed to fetch organization", error);
    }
  };

  const fetchStaffs = async () => {
    setIsLoading(true);
    try {
      const data = await getUserstaffs();
      setStaffList(data);
    } catch (error: any) {
      console.error("Failed to fetch staff list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
    fetchStaffs();
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await organizationService.updateOrganization({
        title_name: titleName,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        address_number: addressNumber,
        village_id: villageId,
        subdistrict_name: subdistrictName,
        district_name: districtName,
        province_name: provinceName,
      });
      setOrgView("details");
      setShowSuccessToast(true);
      fetchOrganization(); // Refresh data
    } catch (error) {
      console.error("Failed to update organization", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleSave = async (formData: any) => {
    try {
      if (staffView === "edit" && editStaff) {
        await updateUserstaff(editStaff.id, formData, "super_admin");
      } else {
        await createUserstaff(formData, "super_admin");
      }
      await fetchStaffs();
      setShowSuccessModal(true);
    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUserstaff(id, "super_admin");
      await fetchStaffs();
      setStaffView("list");
      setShowDeleteToast(true);
    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการลบข้อมูล: " + error.message);
    }
  };

  const handleEditClick = (staff: UserstaffResponse) => {
    setEditStaff(staff);
    setStaffView("edit");
  };

  const handleCreateClick = () => {
    setEditStaff(null);
    setStaffView("create");
  };

  const handleCancel = () => {
    setEditStaff(null);
    setStaffView("list");
  };

  // Dynamic statistics calculations
  const totalCount = staffList.length;
  const activeCount = staffList.filter(s => s.status === "active").length;
  const inactiveCount = staffList.filter(s => s.status === "inactive").length;

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* 1. DETAILS VIEW FOR ORGANIZATION */}
      {orgView === "details" && (
        <>
          {/* Organization Info Details Card */}
          {staffView === "list" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 bg-[#0B132B] text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Building className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{orgData?.organization_full_name || "กำลังโหลด..."}</h3>
                  </div>
                </div>
                
                <button 
                  onClick={() => setOrgView("edit")}
                  className="flex items-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold px-5 py-3 rounded-2xl shadow-md transition-all duration-150 transform active:scale-95 text-[14px] cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>แก้ไขข้อมูล</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[14.5px] text-slate-600 font-medium pt-2">
                <div>
                  <span className="text-slate-800 font-bold mr-1">ชื่อหน่วยงาน :</span> {orgData?.organization_full_name || "-"}
                </div>
                <div>
                  <span className="text-slate-800 font-bold mr-1">นายก อบต. :</span> {orgData ? `${orgData.title_name}${orgData.first_name} ${orgData.last_name}` : "-"}
                </div>
              </div>

              <div className="space-y-3 text-[14.5px] text-slate-600 font-medium pt-2 border-t border-slate-100">
                <p className="text-slate-800 font-bold">ที่ตั้ง :</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 pl-1">
                  <div className="space-y-2">
                    <p><span className="text-slate-500 font-bold">เลขที่</span> {orgData?.address_number || "-"}</p>
                    <p><span className="text-slate-500 font-bold">ตำบล</span> {orgData?.organization_full_name ? orgData.organization_full_name.replace("องค์การบริหารส่วนตำบล", "") : "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="text-slate-500 font-bold">หมู่</span> {orgData?.village_number || "-"}</p>
                    <p><span className="text-slate-500 font-bold">อำเภอ</span> {orgData?.district_name || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="text-slate-500 font-bold">บ้าน</span> {orgData?.village_name || "-"}</p>
                    <p><span className="text-slate-500 font-bold">จังหวัด</span> {orgData?.province_name || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Renders the Bottom section (User List / User Form) */}
          {staffView === "list" && (
            <UserList 
              staffList={staffList} 
              isLoading={isLoading}
              onAddClick={handleCreateClick} 
              onEditClick={handleEditClick}
              onDelete={handleDelete}
            />
          )}

          {(staffView === "create" || staffView === "edit") && (
            <UserForm 
              editStaff={editStaff}
              onSave={handleSave} 
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      {/* 3. FORM VIEW FOR EDITING ORGANIZATION (Friend's version from main) */}
      {orgView === "edit" && (
        <div className="space-y-6">

          <form onSubmit={handleEditSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
            
            {/* ข้อมูลองค์กร */}
            <div className="space-y-4">
              <div className="text-[14px] font-bold text-slate-700">ข้อมูลนายกองค์การบริหารส่วนตำบล</div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* คำนำหน้า */}
                <div className="space-y-2 md:col-span-3">
                  <label className="text-[13px] font-bold text-slate-500 block">คำนำหน้า <span className="text-red-500">*</span></label>
                  <select
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm bg-white cursor-pointer appearance-none"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>

                {/* ชื่อ */}
                <div className="space-y-2 md:col-span-4">
                  <label className="text-[13px] font-bold text-slate-500 block">ชื่อ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="ระบุชื่อ"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* นามสกุล */}
                <div className="space-y-2 md:col-span-5">
                  <label className="text-[13px] font-bold text-slate-500 block">นามสกุล <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    placeholder="ระบุนามสกุล"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                  />
                </div>
                
                {/* เบอร์โทรศัพท์ */}
                <div className="space-y-2 md:col-span-6">
                  <label className="text-[13px] font-bold text-slate-500 block">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="tel"
                      placeholder="ระบุเบอร์โทรศัพท์"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      maxLength={10}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ที่ตั้งสำนักงาน */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="text-[14px] font-bold text-slate-700">ที่ตั้งสำนักงาน</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* เลขที่ */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 block">เลขที่ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="ระบุเลขที่ตั้งสำนักงาน"
                      value={addressNumber}
                      onChange={(e) => setAddressNumber(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* หมู่ที่ */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 block">หมู่ที่ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <select
                      value={villageId}
                      onChange={(e) => setVillageId(Number(e.target.value))}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm bg-white cursor-pointer appearance-none"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>หมู่ที่ {num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ตำบล */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 block">ตำบล <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="ระบุตำบล"
                      value={subdistrictName}
                      onChange={(e) => setSubdistrictName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* อำเภอ */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 block">อำเภอ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="ระบุอำเภอ"
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* จังหวัด */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-500 block">จังหวัด <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="ระบุจังหวัด"
                      value={provinceName}
                      onChange={(e) => setProvinceName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-slate-200/80 rounded-2xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
                    />
                  </div>
                </div>

              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            {/* Form Actions Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button 
                type="button"
                onClick={() => setOrgView("details")}
                className="px-6 py-3 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B409C]/20 focus-visible:border-[#0B409C]"
              >
                ยกเลิก
              </button>
              
              <button 
                type="submit"
                className="flex items-center gap-2 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B409C]/20"
              >
                <Save className="w-4 h-4" />
                <span className="text-[14px]">บันทึกข้อมูล</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* Success Modal for Staff mutations */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onAddOther={() => {
          setShowSuccessModal(false);
          if (staffView === "edit") {
            setStaffView("list");
          }
        }}
        onClose={() => {
          setShowSuccessModal(false);
          setStaffView("list");
        }}
      />

      {showDeleteToast && (
        <DeleteToast onClose={() => setShowDeleteToast(false)} />
      )}

      {showSuccessToast && (
        <SuccessToast 
          title="ดำเนินการสำเร็จ"
          message="บันทึกข้อมูลองค์กรเรียบร้อยแล้ว"
          onClose={() => setShowSuccessToast(false)} 
        />
      )}
    </div>
  );
}
