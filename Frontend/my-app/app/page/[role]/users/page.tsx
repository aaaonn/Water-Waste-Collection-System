"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect } from "react";
import UserList from "./user-list";
import UserForm from "./user-form";
import SuccessModal from "./success-modal";
import DeleteToast from "../../../component/delete-toast";
import { 
  getUserstaffs, 
  createUserstaff, 
  updateUserstaff, 
  deleteUserstaff, 
  UserstaffResponse 
} from "../../../service/userstaff";

export default function StaffUsers() {
  const { role } = useParams();
  
  // Authorization Guard: Only allow 'admin'
  if (role !== "admin") {
    notFound();
  }

  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [staffList, setStaffList] = useState<UserstaffResponse[]>([]);
  const [editStaff, setEditStaff] = useState<UserstaffResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

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
    fetchStaffs();
  }, []);

  const handleSave = async (formData: any) => {
    try {
      if (view === "edit" && editStaff) {
        await updateUserstaff(editStaff.id, formData);
      } else {
        await createUserstaff(formData);
      }
      await fetchStaffs();
      setShowSuccessModal(true);
    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUserstaff(id);
      await fetchStaffs();
      setShowDeleteToast(true);
    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการลบข้อมูล: " + error.message);
    }
  };

  const handleEditClick = (staff: UserstaffResponse) => {
    setEditStaff(staff);
    setView("edit");
  };

  const handleCreateClick = () => {
    setEditStaff(null);
    setView("create");
  };

  const handleCancel = () => {
    setEditStaff(null);
    setView("list");
  };

  return (
    <div className="relative space-y-6">
      
      {/* 1. Renders the Main List View */}
      {view === "list" && (
        <UserList 
          staffList={staffList} 
          isLoading={isLoading}
          onAddClick={handleCreateClick} 
          onEditClick={handleEditClick}
          onDelete={handleDelete}
        />
      )}

      {/* 2. Renders the Create/Edit Form View */}
      {(view === "create" || view === "edit") && (
        <UserForm 
          editStaff={editStaff}
          onSave={handleSave} 
          onCancel={handleCancel} 
          onDelete={handleDelete}
        />
      )}

      {/* 3. Renders separated success modal popup overlay */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onAddOther={() => {
          setShowSuccessModal(false);
          // Keep view as "create" to let them add another staff!
          if (view === "edit") {
            setView("list");
          }
        }}
        onClose={() => {
          setShowSuccessModal(false);
          setView("list"); // Return to list view
        }}
      />

      {showDeleteToast && (
        <DeleteToast onClose={() => setShowDeleteToast(false)} />
      )}
    </div>
  );
}
