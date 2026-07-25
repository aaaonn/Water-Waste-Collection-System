"use client";

import SuccessToast from "../../../../component/success-toast";

interface SuccessModalProps {
  isOpen: boolean;
  onAddOther?: () => void;
  onClose: () => void;
}

export default function LocalSuccessModal({ isOpen, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <SuccessToast
      title="ดำเนินการสำเร็จ"
      message="บันทึกข้อมูลครัวเรือนเรียบร้อยแล้ว"
      onClose={onClose}
      duration={3000}
    />
  );
}
