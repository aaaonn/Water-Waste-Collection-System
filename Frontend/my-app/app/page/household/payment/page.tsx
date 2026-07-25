"use client";

import { useState, useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import PaymentSelect from "./payment-select";
import PaymentVerify from "./payment-verify";
import PaymentPay from "./payment-pay";
import SuccessModal from "./success-modal";
import { getInvoicesByHousehold } from "../../../service/invoice";
import { getHouseholdMe } from "../../../service/household";
import { createPromptPayCharge } from "../../../service/payment";

interface BillItem {
  id: string;
  type: "normal" | "warning";
  serviceName: string;
  subtext?: string;
  billingCycle: string;
  amount: number;
  prevReading?: number;
  currReading?: number;
  unitConsumed?: number;
}

export default function HouseholdPaymentPage() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [household, setHousehold] = useState<any>(null);

  // List of household bills matching Figma screenshots
  const [bills, setBills] = useState<BillItem[]>([]);

  // Selected bills (default single selection)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // QR Payment Details from backend
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payInvoiceId, setPayInvoiceId] = useState<number | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        // Fetch household from token
        const hhData = await getHouseholdMe();
        setHousehold(hhData);

        const res = await getInvoicesByHousehold(hhData.id);
        if (res.data) {
          // Filter only pending and overdue
          const unpaid = res.data.filter(inv => inv.status === "pending" || inv.status === "overdue");

          // Sort oldest to newest
          unpaid.sort((a, b) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime());

          const formattedBills = unpaid.map((inv) => {
            const d = new Date(inv.issue_date);
            const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
            const cycle = `${months[d.getMonth()]} ${d.getFullYear()}`;

            let subtext = "";
            let type: "normal" | "warning" = "normal";
            let serviceName = "ค่าน้ำประปาและขยะ";

            if (inv.status === "overdue") {
              type = "warning";
              serviceName = "ค่าน้ำประปาและขยะ\nค้างชำระ";
              const due = new Date(inv.due_date);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - due.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              subtext = `ค้างชำระ ${diffDays} วัน`;
            }

            return {
              id: inv.id.toString(),
              type,
              serviceName,
              subtext,
              billingCycle: cycle,
              amount: inv.total_amount,
              prevReading: inv.water_prev_reading,
              currReading: inv.water_curr_reading,
              unitConsumed: inv.water_unit_consumed
            } as BillItem;
          });

          setBills(formattedBills);
          // Default select the oldest bill
          if (formattedBills.length > 0) {
            setSelectedIds([formattedBills[0].id]);
          } else {
            setSelectedIds([]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBills();
  }, [refreshTrigger]);

  const handleToggleSelect = (id: string) => {
    // Single selection logic - only allow one at a time
    setSelectedIds([id]);
  };

  const handleConfirmVerify = async () => {
    if (selectedIds.length === 0) return;
    const invoiceId = parseInt(selectedIds[0]);
    try {
      const res = await createPromptPayCharge(invoiceId);
      setQrCodeUrl(res.qr_code_url);
      setPayAmount(res.amount);
      setPayInvoiceId(res.invoice_id);
      setStep(3);
    } catch (err: any) {
      alert("ไม่สามารถสร้างรหัสพร้อมเพย์ได้: " + err.message);
    }
  };

  const handleSimulateSuccess = () => {
    setStep(1);
    setQrCodeUrl("");
    setPayAmount(0);
    setPayInvoiceId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setStep(1);
    setQrCodeUrl("");
    setPayAmount(0);
    setPayInvoiceId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const selectedCount = selectedIds.length;
  const totalAmount = useMemo(() => {
    return bills
      .filter((b) => selectedIds.includes(b.id))
      .reduce((sum, b) => sum + b.amount, 0);
  }, [bills, selectedIds]);

  return (
    <div className="space-y-8 font-sans">

      {/* ================= STEPS FLOW PROGRESS INDICATOR ================= */}
      <div className="max-w-3xl mx-auto flex items-center justify-between relative px-6 py-4 select-none">

        {/* Progress Connecting Line background */}
        <div className="absolute left-[45px] right-[45px] top-[34px] h-[3px] bg-slate-200 z-0 rounded">
          {/* Half progress fill */}
          <div
            className="h-full bg-[#0B409C] transition-all duration-300 rounded"
            style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
          />
        </div>

        {/* Step 1: เลือกรายการ */}
        <div className="flex flex-col items-center space-y-2 z-10 relative">
          {step > 1 ? (
            <div className="w-9 h-9 rounded-full bg-[#0B409C] text-white flex items-center justify-center font-extrabold text-[13px] shadow-md transition-all duration-300">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#0B409C] text-white flex items-center justify-center font-extrabold text-[13px] shadow-md ring-4 ring-blue-100 transition-all duration-300">
              1
            </div>
          )}
          <span className={`text-[12px] font-extrabold transition-all bg-white px-1 ${step >= 1 ? "text-[#0B409C]" : "text-slate-400"}`}>
            เลือกรายการ
          </span>
        </div>

        {/* Step 2: ตรวจสอบข้อมูล */}
        <div className="flex flex-col items-center space-y-2 z-10 relative">
          {step > 2 ? (
            <div className="w-9 h-9 rounded-full bg-[#0B409C] text-white flex items-center justify-center font-extrabold text-[13px] shadow-md transition-all duration-300">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          ) : step === 2 ? (
            <div className="w-9 h-9 rounded-full bg-[#0B409C] text-white flex items-center justify-center font-extrabold text-[13px] shadow-md ring-4 ring-blue-100 transition-all duration-300">
              2
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-white border-[2.5px] border-slate-200 text-slate-400 flex items-center justify-center font-bold text-[13px] transition-all duration-300">
              2
            </div>
          )}
          <span className={`text-[12px] font-extrabold transition-all bg-white px-1 ${step >= 2 ? "text-[#0B409C]" : "text-slate-400"}`}>
            ตรวจสอบข้อมูล
          </span>
        </div>

        {/* Step 3: ชำระเงิน */}
        <div className="flex flex-col items-center space-y-2 z-10 relative">
          {step === 3 ? (
            <div className="w-9 h-9 rounded-full bg-[#0B409C] text-white flex items-center justify-center font-extrabold text-[13px] shadow-md ring-4 ring-blue-100 transition-all duration-300">
              3
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-white border-[2.5px] border-slate-200 text-slate-400 flex items-center justify-center font-bold text-[13px] transition-all duration-300">
              3
            </div>
          )}
          <span className={`text-[12px] font-extrabold transition-all bg-white px-1 ${step >= 3 ? "text-[#0B409C]" : "text-slate-400"}`}>
            ชำระเงิน
          </span>
        </div>

      </div>

      {/* ================= STEP CONTENT CONTROLLER ================= */}
      <div className="relative">

        {/* Step 1: Select bills */}
        {step === 1 && (
          <PaymentSelect
            bills={bills}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onProceed={() => setStep(2)}
          />
        )}

        {/* Step 2: Verification */}
        {step === 2 && (
          <PaymentVerify
            household={household}
            bills={bills}
            selectedIds={selectedIds}
            onConfirm={handleConfirmVerify}
            onCancel={() => setStep(1)}
          />
        )}

        {/* Step 3: Payment scan */}
        {step === 3 && (
          <PaymentPay
            qrCodeUrl={qrCodeUrl}
            amount={payAmount}
            invoiceId={payInvoiceId}
            onConfirm={() => setShowSuccess(true)}
            onSimulateSuccess={handleSimulateSuccess}
            onCancel={() => setStep(2)}
          />
        )}

      </div>

      {/* ================= POPUP MODALS ================= */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
      />

    </div>
  );
}
