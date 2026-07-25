"use client";

import { useState, useEffect } from "react";
import PaymentList from "./payment-list";
import PaymentVerify from "./payment-verify";
import PaymentPay from "./payment-pay";
import SuccessModal from "./success-modal";
import { httpClient } from "../../../service/http-client";
import { createPromptPayCharge, createCashPayment } from "../../../service/payment";
import { InvoiceResponse } from "../../../interface/invoice";

interface HouseholdPayment {
  id: number;
  houseNo: string;
  village: string;
  owner: string;
  waterBill: number;
  garbageBill: number;
  status: "ค้างชำระ" | "ค้างชำระ 2 เดือน" | "ชำระแล้ว";
  invoices: InvoiceResponse[];
  water_user_id?: string;
}

export default function StaffPayments() {
  const [view, setView] = useState<"list" | "verify" | "pay">("list");
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdPayment | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // State for QR Code Payment
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payInvoiceId, setPayInvoiceId] = useState<number | null>(null);
  
  // Refresh trigger for list
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Development Auto-Login for staff
  useEffect(() => {
    const ensureDevToken = async () => {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        try {
          const res = await httpClient.post<{ token: string }>("/mobilelogin", {
            username: "staff1",
            password: "123456",
          });
          localStorage.setItem("token", res.token);
          localStorage.setItem("username", "staff1");
          localStorage.setItem("role", "staff");
          console.log("Development Auto-Login successful! Token initialized.");
        } catch (e) {
          console.error("Development Auto-Login failed:", e);
        }
      }
    };
    ensureDevToken();
  }, []);

  const handleSelectHousehold = (household: HouseholdPayment) => {
    setSelectedHousehold(household);
    setView("verify");
  };

  const handleConfirmVerify = async (method: "qr" | "cash") => {
    if (!selectedHousehold || selectedHousehold.invoices.length === 0) return;
    
    // Sort invoices by issue date ascending to pay the oldest one first
    const sortedInvoices = [...selectedHousehold.invoices].sort(
      (a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
    );
    const oldestInvoice = sortedInvoices[0];

    if (method === "qr") {
      try {
        const res = await createPromptPayCharge(oldestInvoice.id);
        setQrCodeUrl(res.qr_code_url);
        setPayAmount(res.amount);
        setPayInvoiceId(oldestInvoice.id);
        setView("pay");
      } catch (err: any) {
        alert("ไม่สามารถสร้างรหัสพร้อมเพย์ได้: " + err.message);
      }
    } else {
      // Cash payment: process all pending invoices
      try {
        for (const invoice of sortedInvoices) {
          await createCashPayment(invoice.id);
        }
        setShowSuccessModal(true);
      } catch (err: any) {
        alert("ไม่สามารถบันทึกการชำระเงินสดได้: " + err.message);
      }
    }
  };

  const handleConfirmPayment = () => {
    setShowSuccessModal(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setView("list");
    setSelectedHousehold(null);
    setPayInvoiceId(null);
    setQrCodeUrl("");
    setPayAmount(0);
    setRefreshTrigger(prev => prev + 1); // trigger reload of household data
  };

  return (
    <div className="relative space-y-6">
      
      {/* 1. Step 0: Households summary list */}
      {view === "list" && (
        <PaymentList 
          onSelectHousehold={handleSelectHousehold} 
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* 2. Step 1: Verification panel */}
      {view === "verify" && (
        <PaymentVerify 
          household={selectedHousehold}
          onConfirm={handleConfirmVerify}
          onCancel={() => setView("list")}
        />
      )}

      {/* 3. Step 2: PromptPay scan panel */}
      {view === "pay" && (
        <PaymentPay 
          qrCodeUrl={qrCodeUrl}
          amount={payAmount}
          invoiceId={payInvoiceId}
          onConfirm={handleConfirmPayment}
          onCancel={() => setView("verify")}
        />
      )}

      {/* 4. Separated Success Modal popup overlay */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={handleCloseSuccess}
      />

    </div>
  );
}
