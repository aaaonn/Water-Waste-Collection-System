"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Droplet
} from "lucide-react";
import { getHouseholds, getVillages } from "../../../service/household";
import { getInvoicesByHousehold } from "../../../service/invoice";
import { getReceipt } from "../../../service/payment";
import { InvoiceResponse } from "../../../interface/invoice";
import { VillageResponse } from "../../../interface/household";

interface HouseholdPayment {
  id: number;
  houseNo: string;
  village: string;
  owner: string;
  waterBill: number;
  garbageBill: number;
  status: "ค้างชำระ" | "ค้างชำระ 2 เดือน" | "ชำระแล้ว";
  avatarText?: string;
  avatarImg?: string;
  invoices: InvoiceResponse[];
  water_user_id?: string;
  allInvoices?: InvoiceResponse[];
}

interface PaymentListProps {
  onSelectHousehold: (household: HouseholdPayment) => void;
  refreshTrigger: number;
}

// Custom POS Cash Register Icon matching the Figma design perfectly
const POSRegisterIcon = () => (
  <div className="text-[#0B409C] transition duration-150 transform hover:scale-110 active:scale-95">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      {/* Device body */}
      <path d="M4 17a3 3 0 003 3h10a3 3 0 003-3v-5H4v5z" />
      {/* Device screen */}
      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v6H5V5z" opacity="0.8" />
      {/* Paper slip printing mock */}
      <path d="M8 1v2h8V1H8z" fill="white" opacity="0.6" />
      {/* POS screen buttons */}
      <rect x="7" y="14" width="2" height="1.5" rx="0.3" fill="white" />
      <rect x="11" y="14" width="2" height="1.5" rx="0.3" fill="white" />
      <rect x="15" y="14" width="2" height="1.5" rx="0.3" fill="white" />
      <rect x="7" y="17" width="2" height="1.5" rx="0.3" fill="white" />
      <rect x="11" y="17" width="2" height="1.5" rx="0.3" fill="white" />
      <rect x="15" y="17" width="2" height="1.5" rx="0.3" fill="#38BDF8" />
    </svg>
  </div>
);

export default function PaymentList({ onSelectHousehold, refreshTrigger }: PaymentListProps) {
  const [households, setHouseholds] = useState<HouseholdPayment[]>([]);
  const [villages, setVillages] = useState<VillageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [selectedVillage, setSelectedVillage] = useState("ทั้งหมด");
  const [selectedMonth, setSelectedMonth] = useState("ทั้งหมด");
  const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Fetch data from GORM backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [householdsData, villagesData] = await Promise.all([
          getHouseholds(),
          getVillages()
        ]);
        
        setVillages(villagesData);

        const villageMap = new Map(
          villagesData.map(v => [v.id, `หมู่ที่ ${v.village_number} บ.${v.village_name}`])
        );

        // Fetch invoices for each household to calculate statuses and bills
        const mappedHouseholds = await Promise.all(
          householdsData.map(async (h) => {
            const invoiceRes = await getInvoicesByHousehold(h.id);
            const invoices = invoiceRes.data || [];
            
            // Filter pending/overdue invoices
            const pendingInvoices = invoices.filter(
              (inv) => inv.status === "pending" || inv.status === "overdue"
            );

            let waterBill = 0;
            let totalBill = 0;
            let garbageBill = 0;

            if (pendingInvoices.length > 0) {
              waterBill = pendingInvoices.reduce((sum, inv) => sum + (inv.water_reading_amount || 0), 0);
              totalBill = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
              garbageBill = totalBill - waterBill;
            } else if (invoices.length > 0) {
              // Fallback to latest invoice when paid, so we don't display 0.00
              const sortedInvoices = [...invoices].sort(
                (a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
              );
              const latest = sortedInvoices[0];
              waterBill = latest.water_reading_amount || 0;
              totalBill = latest.total_amount;
              garbageBill = totalBill - waterBill;
            }

            let status: "ชำระแล้ว" | "ค้างชำระ" | "ค้างชำระ 2 เดือน" = "ชำระแล้ว";
            if (pendingInvoices.length === 1) {
              status = "ค้างชำระ";
            } else if (pendingInvoices.length >= 2) {
              status = "ค้างชำระ 2 เดือน";
            }

            const ownerName = `${h.title_name}${h.first_name} ${h.last_name}`;
            const avatarText = h.first_name.slice(0, 2);

            return {
              id: h.id,
              houseNo: h.house_number,
              village: villageMap.get(h.village_id) || `หมู่ที่ ${h.village_id}`,
              owner: ownerName,
              waterBill,
              garbageBill,
              status,
              avatarText,
              invoices: pendingInvoices,
              water_user_id: h.water_user_id,
              allInvoices: invoices
            };
          })
        );

        setHouseholds(mappedHouseholds);
      } catch (err) {
        console.error("Failed to load households and payments data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  // 2. Dynamic Month list collection from all invoices
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const thaiMonths = [
      "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    households.forEach((h) => {
      h.allInvoices?.forEach((inv) => {
        const d = new Date(inv.issue_date);
        const m = thaiMonths[d.getMonth() + 1];
        const y = d.getFullYear() + 543;
        months.add(`${m} ${y}`);
      });
    });

    return Array.from(months);
  }, [households]);

  // 3. Filtering logic
  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      // Village filter
      const matchVillage = selectedVillage === "ทั้งหมด" || h.village.includes(selectedVillage);
      
      // Status filter
      const matchStatus = selectedStatus === "ทั้งหมด" || h.status === selectedStatus;
      
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        h.owner.toLowerCase().includes(searchLower) || 
        h.houseNo.toLowerCase().includes(searchLower) || 
        (h.water_user_id && h.water_user_id.toLowerCase().includes(searchLower));

      // Month filter
      let matchMonth = true;
      if (selectedMonth !== "ทั้งหมด") {
        const thaiMonths = [
          "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
          "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ];
        matchMonth = h.allInvoices?.some((inv) => {
          const d = new Date(inv.issue_date);
          const m = thaiMonths[d.getMonth() + 1];
          const y = d.getFullYear() + 543;
          return `${m} ${y}` === selectedMonth;
        }) || false;
      }

      return matchVillage && matchStatus && matchSearch && matchMonth;
    });
  }, [households, selectedVillage, selectedStatus, searchTerm, selectedMonth]);

  // 4. Pagination calculations
  const totalItems = filteredHouseholds.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  const paginatedHouseholds = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredHouseholds.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredHouseholds, currentPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedVillage, selectedMonth, selectedStatus, searchTerm]);

  // 5. Printable dynamic PDF Receipt Window
  const handlePrintReceipt = async (invoiceId: number) => {
    try {
      const receipt = await getReceipt(invoiceId);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("กรุณาอนุญาตป๊อปอัปเพื่อแสดงใบเสร็จ!");
        return;
      }

      printWindow.document.write(`
        <html>
        <head>
          <title>ใบเสร็จรับเงิน - ${receipt.organization.name}</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700;800&display=swap');
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              background-color: #f8fafc;
              color: #1e293b;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              padding: 20px;
            }
            /* Screen height optimization to fit full screen without scroll */
            @media (min-height: 720px) {
              body {
                justify-content: center;
                overflow: hidden;
              }
            }
            .action-bar {
              width: 100%;
              max-width: 680px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              padding: 0 4px;
            }
            .btn {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 8px 16px;
              font-size: 14px;
              font-weight: 600;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              background-color: #ffffff;
              color: #334155;
              cursor: pointer;
              transition: all 0.15s;
            }
            .btn:hover {
              background-color: #f1f5f9;
              border-color: #cbd5e1;
            }
            .btn-primary {
              background-color: #0b409c;
              color: #ffffff;
              border-color: #0b409c;
            }
            .btn-primary:hover {
              background-color: #09337d;
              border-color: #09337d;
            }
            .receipt-card {
              width: 100%;
              max-width: 680px;
              background-color: #ffffff;
              border: 1.5px solid #e2e8f0;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
              padding: 24px 32px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .header {
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
            }
            .logo {
              width: 55px;
              height: 55px;
              object-fit: contain;
            }
            .org-name {
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
            }
            .receipt-title {
              font-size: 14px;
              color: #64748b;
              font-weight: 500;
            }
            .meta-bar {
              border-top: 1px dashed #cbd5e1;
              border-bottom: 1px dashed #cbd5e1;
              padding: 10px 0;
              margin: 4px 0;
            }
            .meta-label {
              font-size: 11px;
              color: #64748b;
              font-weight: 500;
            }
            .meta-value {
              font-size: 13.5px;
              font-weight: 700;
              color: #0f172a;
            }
            .details-grid {
              display: grid;
              grid-template-cols: 1.2fr 0.8fr;
              gap: 16px;
              font-size: 13px;
              line-height: 1.5;
            }
            .details-label {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 2px;
            }
            .details-value {
              font-weight: 700;
              color: #1e293b;
            }
            .table-container {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 10px 12px;
              font-size: 13px;
              text-align: left;
            }
            th {
              background-color: #f8fafc;
              font-weight: 700;
              color: #475569;
              border-bottom: 1px solid #e2e8f0;
            }
            td {
              border-bottom: 1px solid #f1f5f9;
              color: #334155;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .item-sub {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .total-box {
              background-color: #f1f5f9;
              border-radius: 8px;
              padding: 12px 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .total-label {
              font-size: 13px;
              font-weight: 700;
              color: #475569;
            }
            .total-amount {
              font-size: 20px;
              font-weight: 800;
              color: #0b409c;
            }
            .footer-section {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
              margin-top: 4px;
            }
            .paid-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background-color: #ecfdf5;
              color: #059669;
              border: 1px solid #a7f3d0;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 700;
            }
            .paid-icon {
              width: 14px;
              height: 14px;
              fill: currentColor;
            }
            .footer-note {
              font-size: 11.5px;
              color: #64748b;
              text-align: center;
            }
            
            /* Print styles */
            @media print {
              @page {
                margin: 0;
              }
              body {
                background-color: #ffffff;
                padding: 0;
                margin: 20mm 15mm;
                min-height: auto;
                overflow: visible !important;
                display: block !important;
              }
              .action-bar {
                display: none !important;
              }
              .receipt-card {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100% !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <button class="btn" onclick="window.close()">
              <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              ย้อนกลับ
            </button>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary" onclick="window.print()">
                <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                พิมพ์ใบเสร็จ
              </button>
              <button class="btn" onclick="shareReceipt()">
                <svg style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.5" viewBox="0 0 24 24"><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98M21 12a3 3 0 11-6 0 3 3 0 016 0zM9 6a3 3 0 11-6 0 3 3 0 016 0zm0 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                แชร์
              </button>
            </div>
          </div>

          <div class="receipt-card">
            <div class="header">
              <img class="logo" src="${window.location.origin + "/tunglaung_logo.jpg"}" alt="อบต.ทุ่งหลวง">
              <div class="org-name">${receipt.organization.name}</div>
              <div class="receipt-title">ใบเสร็จรับเงิน (Official Receipt)</div>
            </div>

            <div class="meta-bar">
              <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0; table-layout: fixed;">
                <tr>
                  <td style="width: 33.33%; text-align: left; vertical-align: bottom; border: none; padding: 0 0 2px 0;" class="meta-label">เลขที่ใบเสร็จ / RECEIPT NO.</td>
                  <td style="width: 33.33%; text-align: center; vertical-align: bottom; border: none; padding: 0 0 2px 0;" class="meta-label">รอบเดือน / CYCLE</td>
                  <td style="width: 33.33%; text-align: right; vertical-align: bottom; border: none; padding: 0 0 2px 0;" class="meta-label">วันที่บันทึก / DATE RECORDED</td>
                </tr>
                <tr>
                  <td style="width: 33.33%; text-align: left; vertical-align: top; border: none; padding: 0;" class="meta-value">${receipt.receipt_number}</td>
                  <td style="width: 33.33%; text-align: center; vertical-align: top; border: none; padding: 0;" class="meta-value">${receipt.bill_month}</td>
                  <td style="width: 33.33%; text-align: right; vertical-align: top; border: none; padding: 0;" class="meta-value" id="date-recorded">-</td>
                </tr>
              </table>
            </div>

            <div class="details-grid">
              <div>
                <div class="details-label">ผู้ใช้บริการ / Customer Name</div>
                <div class="details-value">${receipt.household.owner_name}</div>
                <div class="details-label" style="margin-top: 8px;">รหัสผู้ใช้น้ำ / Water User ID</div>
                <div class="details-value">${receipt.household.water_user_id || "-"}</div>
              </div>
              <div>
                <div class="details-label">ที่อยู่ / Address</div>
                <div class="details-value" style="font-weight: 500;" id="full-address">-</div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>รายการ (Description)</th>
                    <th class="text-center" style="width: 80px;">หน่วย</th>
                    <th class="text-right" style="width: 120px;">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  ${receipt.water_usage ? `
                  <tr>
                    <td>
                      <div>ค่าน้ำประปาประจำรอบบิล</div>
                      <div class="item-sub" style="margin-top: 4px;">
                        เลขมิเตอร์เริ่มต้น: <strong>${receipt.water_usage.prev_reading_value}</strong> - สิ้นสุด: <strong>${receipt.water_usage.curr_reading_value}</strong>
                      </div>
                    </td>
                    <td class="text-center">${receipt.water_usage.unit_consumed} หน่วย</td>
                    <td class="text-right">${receipt.water_usage.water_bill_amount.toFixed(2)}</td>
                  </tr>
                  ` : ""}
                  ${receipt.garbage_usage ? receipt.garbage_usage.details.map(d => `
                  <tr>
                    <td>
                      <div>ค่าขยะ - ${d.size_name}</div>
                      <div class="item-sub">อัตรา ${d.cost} บาท / เดือน</div>
                    </td>
                    <td class="text-center">${d.amount} ถัง</td>
                    <td class="text-right">${((d.cost || 0) * (d.amount || 0)).toFixed(2)}</td>
                  </tr>
                  `).join("") : ""}
                </tbody>
              </table>
            </div>

            <div class="total-box">
              <span class="total-label">ยอดรวมทั้งสิ้น (Grand Total)</span>
              <span class="total-amount">฿${receipt.total_amount.toFixed(2)}</span>
            </div>

            <div class="footer-section">
              <div class="paid-badge">
                <svg class="paid-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                ชำระเงินเรียบร้อยแล้ว (Paid)
              </div>
              <div class="footer-note">ขอบคุณที่ใช้บริการ องค์การบริหารส่วนตำบลทุ่งหลวง ยินดีรับใช้ประชาชนทุกท่าน</div>
            </div>
          </div>

          <script>
            // format date recorded
            const paidAt = "${receipt.paid_at}";
            if (paidAt) {
              const d = new Date(paidAt);
              const thaiYear = d.getFullYear() + 543;
              const dateStr = d.getDate() + '/' + (d.getMonth() + 1) + '/' + thaiYear + ' ' + 
                              String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' น.';
              document.getElementById('date-recorded').innerText = dateStr;
            } else {
              document.getElementById('date-recorded').innerText = '-';
            }

            // format address
            let address = "${receipt.household.full_address || ""}";
            if (address && address.includes("หนองคาย") && !address.includes("43120")) {
              address += " 43120";
            }
            document.getElementById('full-address').innerText = address;

            function shareReceipt() {
              if (navigator.share) {
                navigator.share({
                  title: 'ใบเสร็จรับเงิน - ' + "${receipt.organization.name}",
                  url: window.location.href
                }).catch(err => console.log(err));
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('คัดลอกลิงก์ใบเสร็จไปยังคลิปบอร์ดแล้ว!');
              }
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err: any) {
      alert("ไม่สามารถดึงข้อมูลใบเสร็จได้: " + err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Top Filter and Search Bar Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 bg-transparent select-none">
        {/* Village Community Selector */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-500">หมู่บ้าน / ชุมชน</label>
          <div className="relative">
            <select 
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-[13.5px] text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition appearance-none cursor-pointer shadow-sm"
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              {villages.map(v => (
                <option key={v.id} value={`หมู่ ${v.village_number}`}>
                  หมู่ที่ {v.village_number} บ.{v.village_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Month Selector */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-500">รอบบิล (เดือน)</label>
          <div className="relative">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-[13.5px] text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition appearance-none cursor-pointer shadow-sm"
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Payment Status Selector */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-500">สถานะการชำระ</label>
          <div className="relative">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-[13.5px] text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition appearance-none cursor-pointer shadow-sm"
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              <option value="ค้างชำระ">ค้างชำระ</option>
              <option value="ชำระแล้ว">ชำระแล้ว</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search Input */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-500">ค้นหาชื่อ / เลขที่บ้าน / รหัสผู้ใช้น้ำ</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ระบุคำค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B409C]/20 focus:border-[#0B409C] transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden py-6 space-y-4">
        
        {/* Table Title and Count Header */}
        <div className="px-8 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">รายการครัวเรือน</h3>
          <span className="text-[12px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold">
            แสดง {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-{Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
          </span>
        </div>

        {/* Households Table Container */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20 text-slate-400 font-bold text-[14px]">
              กำลังดึงข้อมูลจากระบบหลังบ้าน...
            </div>
          ) : (
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-[13px] bg-slate-50/20">
                  <th className="px-8 py-4 w-1/4">เลขที่บ้าน / หมู่</th>
                  <th className="px-8 py-4 w-1/4">ชื่อเจ้าของบ้าน</th>
                  <th className="px-8 py-4 text-slate-600">ค่าน้ำ (บาท)</th>
                  <th className="px-8 py-4 text-slate-600">ค่าขยะ (บาท)</th>
                  <th className="px-8 py-4 text-slate-700">ยอดรวม</th>
                  <th className="px-8 py-4 text-center w-1/6">สถานะ</th>
                  <th className="px-8 py-4 text-center w-1/12">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedHouseholds.map((item) => {
                  const totalBill = item.waterBill + item.garbageBill;
                  const isPaid = item.status === "ชำระแล้ว";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/20 transition duration-150">
                      {/* House No & Village */}
                      <td className="px-8 py-4">
                        <p className="text-[14px] font-bold text-slate-800">{item.houseNo}</p>
                        <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">{item.village}</span>
                      </td>

                      {/* Owner avatar & name */}
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-3">
                          {item.avatarImg ? (
                            <img 
                              src={item.avatarImg} 
                              alt={item.owner} 
                              className="w-8 h-8 rounded-full border border-slate-200 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                              {item.avatarText || item.owner.charAt(0)}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-slate-700">{item.owner}</span>
                            {item.water_user_id && (
                              <span className="text-[10px] font-mono text-slate-400 mt-0.5">{item.water_user_id}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Bills */}
                      <td className="px-8 py-4 text-[14px] text-slate-600 font-semibold">
                        {item.waterBill.toFixed(2)}
                      </td>
                      <td className="px-8 py-4 text-[14px] text-slate-600 font-semibold">
                        {item.garbageBill.toFixed(2)}
                      </td>

                      {/* Total */}
                      <td className="px-8 py-4 text-[14px] font-bold">
                        <span className={isPaid ? "text-slate-700" : "text-rose-500"}>
                          {totalBill.toFixed(2)}
                        </span>
                      </td>

                      {/* Status Pill Badge */}
                      <td className="px-8 py-4 text-center">
                        <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-[12px] font-bold ${
                          item.status === "ชำระแล้ว" 
                            ? "bg-emerald-100 text-emerald-600" 
                            : item.status === "ค้างชำระ 2 เดือน" 
                            ? "bg-rose-100 text-rose-500" 
                            : "bg-rose-100 text-rose-500"
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Action button */}
                      <td className="px-8 py-4 text-center">
                        {isPaid ? (
                          <button 
                            onClick={() => {
                              const paidInvoices = item.allInvoices?.filter(inv => inv.status === "paid") || [];
                              if (paidInvoices.length > 0) {
                                const latestPaid = paidInvoices.sort((a,b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())[0];
                                handlePrintReceipt(latestPaid.id);
                              } else {
                                alert("ไม่พบใบเสร็จสำหรับประวัติการชำระเงินของครัวเรือนนี้");
                              }
                            }}
                            className="p-2 text-[#0B409C] hover:text-blue-700 inline-block cursor-pointer transition transform active:scale-95" 
                            title="พิมพ์ใบเสร็จรับเงิน"
                          >
                            <FileText className="w-5 h-5 stroke-[2]" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => onSelectHousehold(item)}
                            className="inline-block p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="ดำเนินการรับชำระเงิน"
                          >
                            <POSRegisterIcon />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredHouseholds.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-slate-400 font-bold text-[14px]">
                      ไม่มีรายชื่อครัวเรือนตามเงื่อนไขที่ระบุ
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
            กำลังแสดงหน้า {currentPage} จาก {totalPages}
          </p>

          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-[13px] font-bold transition cursor-pointer ${
                    isActive 
                      ? "bg-[#0B409C] text-white shadow-md scale-105" 
                      : "text-slate-400 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
