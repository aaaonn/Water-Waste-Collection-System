"use client";

import { useState, useMemo, useEffect } from "react";
import { getPaymentsByHousehold, getReceipt } from "../../../service/payment";
import { getHouseholdMe } from "../../../service/household";
import { 
  Calendar, 
  Download, 
  FileText, 
  CheckCircle,
  Droplet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface HistoryItem {
  id: string;
  date: string;
  year: string;
  month: string;
  item: string;
  amount: number;
  status: string;
  water_prev_reading?: number;
  water_curr_reading?: number;
  water_unit_consumed?: number;
  householdName?: string;
  householdUserId?: string;
  invoice_id?: number;
}

export default function HouseholdHistory() {
  // Filter States
  const currentYearStr = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState("ทุกเดือน");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [allHistoryData, setAllHistoryData] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hhData = await getHouseholdMe();
        const name = hhData ? `${hhData.title_name}${hhData.first_name} ${hhData.last_name}` : "ไม่ระบุ";
        const userId = hhData ? hhData.water_user_id : "-";

        const paymentRes = await getPaymentsByHousehold(hhData.id);
        if (paymentRes.data) {
          const formatted = paymentRes.data.map(p => {
            const d = new Date(p.paid_at || p.invoice_issue_date);
            const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
            
            let statusThai = "รอดำเนินการ";
            if (p.payment_status === "success" || p.payment_status === "successful" || p.payment_status === "completed" || p.payment_status === "สำเร็จ") {
              statusThai = "สำเร็จ";
            } else if (p.payment_status === "failed" || p.payment_status === "ไม่สำเร็จ") {
              statusThai = "ไม่สำเร็จ";
            }

            return {
              id: p.id.toString(),
              date: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
              year: d.getFullYear().toString(),
              month: months[d.getMonth()],
              item: "ค่าน้ำประปา + ค่าจัดการขยะ",
              amount: p.invoice_amount,
              status: statusThai,
              water_prev_reading: p.water_prev_reading,
              water_curr_reading: p.water_curr_reading,
              water_unit_consumed: p.water_unit_consumed,
              householdName: name,
              householdUserId: userId,
              invoice_id: p.invoice_id
            };
          });
          setAllHistoryData(formatted);
          
          // Auto-select the latest year from data
          if (formatted.length > 0) {
            const latestYear = formatted[0].year;
            setSelectedYear(latestYear);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // Extract available years dynamically
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(allHistoryData.map(item => item.year)));
    if (years.length === 0) return [currentYearStr];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [allHistoryData, currentYearStr]);

  // Filtered Rows list
  const filteredData = useMemo(() => {
    return allHistoryData.filter((item) => {
      const yearMatch = item.year === selectedYear;
      const monthMatch = selectedMonth === "ทุกเดือน" || item.month === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [allHistoryData, selectedYear, selectedMonth]);

  // Paginated Rows
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    const csvContent = "\uFEFFวันที่ชำระ,รายการบริการ,ยอดรวมสุทธิ (บาท),สถานะการชำระ\n" +
      filteredData.map(r => `"${r.date}","${r.item}",${r.amount},"${r.status}"`).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ประวัติการชำระเงิน_ปีงบประมาณ_${selectedYear}_เดือน_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side Receipt Generator (Virtual PDF Print Window)
  const handleDownloadReceipt = async (receipt: HistoryItem) => {
    try {
      const invoiceId = receipt.invoice_id || parseInt(receipt.id);
      if (!invoiceId || isNaN(invoiceId)) {
        alert("ไม่พบข้อมูลเลขที่ใบแจ้งหนี้เพื่อแสดงใบเสร็จ!");
        return;
      }
      const receiptData = await getReceipt(invoiceId);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("กรุณาอนุญาตระบบป๊อปอัปเพื่อแสดงใบเสร็จรับเงิน!");
        return;
      }

      printWindow.document.write(`
        <html>
        <head>
          <title>ใบเสร็จรับเงิน - ${receiptData.organization.name}</title>
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
              <div class="org-name">${receiptData.organization.name}</div>
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
                  <td style="width: 33.33%; text-align: left; vertical-align: top; border: none; padding: 0;" class="meta-value">${receiptData.receipt_number}</td>
                  <td style="width: 33.33%; text-align: center; vertical-align: top; border: none; padding: 0;" class="meta-value">${receiptData.bill_month}</td>
                  <td style="width: 33.33%; text-align: right; vertical-align: top; border: none; padding: 0;" class="meta-value" id="date-recorded">-</td>
                </tr>
              </table>
            </div>

            <div class="details-grid">
              <div>
                <div class="details-label">ผู้ใช้บริการ / Customer Name</div>
                <div class="details-value">${receiptData.household.owner_name}</div>
                <div class="details-label" style="margin-top: 8px;">รหัสผู้ใช้น้ำ / Water User ID</div>
                <div class="details-value">${receiptData.household.water_user_id || "-"}</div>
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
                  ${receiptData.water_usage ? `
                  <tr>
                    <td>
                      <div>ค่าน้ำประปาประจำรอบบิล</div>
                      <div class="item-sub" style="margin-top: 4px;">
                        เลขมิเตอร์เริ่มต้น: <strong>${receiptData.water_usage.prev_reading_value}</strong> - สิ้นสุด: <strong>${receiptData.water_usage.curr_reading_value}</strong>
                      </div>
                    </td>
                    <td class="text-center">${receiptData.water_usage.unit_consumed} หน่วย</td>
                    <td class="text-right">${receiptData.water_usage.water_bill_amount.toFixed(2)}</td>
                  </tr>
                  ` : ""}
                  ${receiptData.garbage_usage ? receiptData.garbage_usage.details.map(d => `
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
              <span class="total-amount">฿${receiptData.total_amount.toFixed(2)}</span>
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
            const paidAt = "${receiptData.paid_at}";
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
            let address = "${receiptData.household.full_address || ""}";
            if (address && address.includes("หนองคาย") && !address.includes("43120")) {
              address += " 43120";
            }
            document.getElementById('full-address').innerText = address;

            function shareReceipt() {
              if (navigator.share) {
                navigator.share({
                  title: 'ใบเสร็จรับเงิน - ' + "${receiptData.organization.name}",
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
      
      {/* 1. TOP CARD: Filter Controls Card */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-7 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
          {/* Fiscal Year */}
          <div className="space-y-2 relative">
            <label className="text-[13px] font-bold text-slate-400">ปีงบประมาณ</label>
            <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-10 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14px] text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-blue-500/30 transition cursor-pointer appearance-none"
              >
                {availableYears.map(year => (
                  <option key={year} value={year} className="text-slate-800 bg-white font-bold">{year}</option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Month */}
          <div className="space-y-2 relative">
            <label className="text-[13px] font-bold text-slate-400">เดือน</label>
            <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-10 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14px] text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-blue-500/30 transition cursor-pointer appearance-none"
              >
                <option value="ทุกเดือน" className="text-slate-800 bg-white font-bold">ทุกเดือน</option>
                <option value="มกราคม" className="text-slate-800 bg-white font-bold">มกราคม</option>
                <option value="กุมภาพันธ์" className="text-slate-800 bg-white font-bold">กุมภาพันธ์</option>
                <option value="มีนาคม" className="text-slate-800 bg-white font-bold">มีนาคม</option>
                <option value="เมษายน" className="text-slate-800 bg-white font-bold">เมษายน</option>
                <option value="พฤษภาคม" className="text-slate-800 bg-white font-bold">พฤษภาคม</option>
                <option value="มิถุนายน" className="text-slate-800 bg-white font-bold">มิถุนายน</option>
                <option value="กรกฎาคม" className="text-slate-800 bg-white font-bold">กรกฎาคม</option>
                <option value="สิงหาคม" className="text-slate-800 bg-white font-bold">สิงหาคม</option>
                <option value="กันยายน" className="text-slate-800 bg-white font-bold">กันยายน</option>
                <option value="ตุลาคม" className="text-slate-800 bg-white font-bold">ตุลาคม</option>
                <option value="พฤศจิกายน" className="text-slate-800 bg-white font-bold">พฤศจิกายน</option>
                <option value="ธันวาคม" className="text-slate-800 bg-white font-bold">ธันวาคม</option>
              </select>
              <Calendar className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM CARD: Recent Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Table Title and Export CSV block */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-[16px] font-extrabold text-slate-800 tracking-tight">รายการล่าสุด</h3>
          
          {/* Export CSV action button */}
          <button 
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-[#0B409C] hover:text-blue-700 font-extrabold text-[13.5px] cursor-pointer transition select-none"
          >
            <Download className="w-4.5 h-4.5" />
            <span>ส่งออก CSV</span>
          </button>
        </div>

        {/* Interactive Responsive Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-[12px] uppercase bg-slate-50/50">
                <th className="px-6 py-4">วันที่</th>
                <th className="px-6 py-4">รายการ</th>
                <th className="px-6 py-4 text-center">จำนวนเงินรวม</th>
                <th className="px-6 py-4 text-center">สถานะ</th>
                <th className="px-6 py-4 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[14px] font-bold text-slate-700">
              {paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/20 transition duration-150">
                  {/* Date */}
                  <td className="px-6 py-4.5 text-slate-500 font-semibold">{row.date}</td>
                  
                  {/* Item Description with icons */}
                  <td className="px-6 py-4.5">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-8.5 h-8.5 bg-blue-50/50 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-500">
                        <div className="flex space-x-0.5">
                          <Droplet className="w-3.5 h-3.5 fill-current text-[#0C5AE9]" />
                          <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-slate-750">{row.item}</span>
                    </div>
                  </td>
                  
                  {/* Total Amount */}
                  <td className="px-6 py-4.5 text-center text-slate-800 font-extrabold">
                    ฿{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-6 py-4.5 text-center">
                    <span className={`px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide inline-block shadow-sm border ${
                      row.status === "สำเร็จ" 
                        ? "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]" 
                        : row.status === "ไม่สำเร็จ" 
                          ? "bg-rose-50 text-rose-600 border-rose-200" 
                          : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  
                  {/* Action Print Download Link */}
                  <td className="px-6 py-4.5 text-right">
                    <button 
                      onClick={() => handleDownloadReceipt(row)}
                      className="inline-flex items-center gap-1 text-[#0B409C] hover:text-blue-700 text-[13.5px] font-extrabold transition cursor-pointer select-none"
                    >
                      <FileText className="w-4 h-4 stroke-[2.5]" />
                      <span>ดาวน์โหลด</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-bold text-[14px]">
                    ไม่มีบันทึกประวัติการชำระเงินตามปีงบประมาณและเดือนที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination footer matching Screenshot perfectly */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-[12.5px] font-bold text-slate-400">
            {/* Show items progress indicators */}
            <span>
              แสดง {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} ถึง{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
            </span>

            {/* Pagination buttons navigation */}
            <div className="flex items-center space-x-1.5">
              {/* Chevron Left */}
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold transition cursor-pointer ${
                      isActive 
                        ? "bg-[#0B409C] text-white shadow-md scale-105" 
                        : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Chevron Right */}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
