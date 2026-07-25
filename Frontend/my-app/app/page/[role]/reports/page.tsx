"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Banknote, 
  AlertTriangle, 
  Users, 
  ChevronDown, 
  Download, 
  FileSpreadsheet, 
  Eye, 
  X, 
  Home,
  Droplet,
  Trash2
} from "lucide-react";
import SuccessToast from "../../../component/success-toast";
import { httpClient } from "../../../service/http-client";

interface ProgressData {
  percentage: number;
  target: number;
  collected: number;
}
interface SurveyProgressData {
  totalActive: number;
  surveyed: number;
  unsurveyed: number;
  percentage: number;
}
interface DashboardStats {
  revenueCollected: string;
  revenueTotal: string;
  householdsPaid: string;
  householdsActive: string;
  householdsTotal: string;
  pendingTasks: number;
  totalTasks: number;
  systemAlerts: number;
  waterProgress: ProgressData;
  garbageProgress: ProgressData;
  surveyProgress: SurveyProgressData;
}

interface VillageProgress {
  id: string;
  name: string;
  waterPaid: number;
  waterTotal: number;
  wastePaid: number;
  wasteTotal: number;
  households: number;
}


export default function StaffReports() {
  const monthMap: Record<string, number> = {
    "มกราคม": 1,
    "กุมภาพันธ์": 2,
    "มีนาคม": 3,
    "เมษายน": 4,
    "พฤษภาคม": 5,
    "มิถุนายน": 6,
    "กรกฎาคม": 7,
    "สิงหาคม": 8,
    "กันยายน": 9,
    "ตุลาคม": 10,
    "พฤศจิกายน": 11,
    "ธันวาคม": 12,
  };

  // 1. Time Period & Global Settings States
  // Get current real-time month and Buddhist year defaults
  const currentDate = new Date();
  const thaiMonthsList = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const defaultMonth = thaiMonthsList[currentDate.getMonth()] || "มิถุนายน";
  const defaultYear = String(currentDate.getFullYear() + 543);

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Generate a dynamic list of Buddhist years (current year - 2 to current year + 2)
  const yearsList = useMemo(() => {
    const startBE = (new Date().getFullYear() + 543) - 2;
    return Array.from({ length: 5 }, (_, i) => String(startBE + i));
  }, []);
  
  // 2. Search & Detail Modal States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVillage, setActiveVillage] = useState<VillageProgress | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real Database States
  const [villages, setVillages] = useState<VillageProgress[]>([]);
  const [globalStats, setGlobalStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeHouseholds, setActiveHouseholds] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalWaterTiers, setModalWaterTiers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"water" | "garbage">("water");

  // Load report data from backend on filter changes
  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        setError("");
        
        const monthNum = monthMap[selectedMonth] || 5;
        const yearNum = parseInt(selectedYear) - 543; // e.g. 2569 -> 2026
        
        // 1. Fetch all villages in subdistrict
        const villageList = await httpClient.get<any[]>("/villages");
        
        // 2. Fetch global subdistrict stats
        const subdistrictStats = await httpClient.get<DashboardStats>(
          `/dashboard/stats?month=${monthNum}&year=${yearNum}&village_id=0`
        );
        setGlobalStats(subdistrictStats);
        
        // 3. Fetch stats for each village concurrently
        const progressList = await Promise.all(
          villageList.map(async (v) => {
            try {
              const vStats = await httpClient.get<DashboardStats>(
                `/dashboard/stats?month=${monthNum}&year=${yearNum}&village_id=${v.id}`
              );
              return {
                id: String(v.id),
                name: `หมู่ ${v.village_number} ${v.village_name}`,
                waterPaid: vStats.waterProgress.collected,
                waterTotal: vStats.waterProgress.target,
                wastePaid: vStats.garbageProgress.collected,
                wasteTotal: vStats.garbageProgress.target,
                households: vStats.surveyProgress.totalActive,
              };
            } catch (err) {
              console.error(`Failed to load stats for village ${v.id}`, err);
              return {
                id: String(v.id),
                name: `หมู่ ${v.village_number} ${v.village_name}`,
                waterPaid: 0,
                waterTotal: 0,
                wastePaid: 0,
                wasteTotal: 0,
                households: v.number_house || 0,
              };
            }
          })
        );
        
        setVillages(progressList);
      } catch (err: any) {
        console.error("Failed to load report data", err);
        setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน");
      } finally {
        setLoading(false);
      }
    }
    
    loadReportData();
  }, [selectedYear, selectedMonth]);

  // Load households and water rates for detail modal
  useEffect(() => {
    if (!activeVillage) {
      setActiveHouseholds([]);
      setModalWaterTiers([]);
      return;
    }
    
    const villageId = activeVillage.id;
    const monthNum = monthMap[selectedMonth] || 5;
    const yearNum = parseInt(selectedYear) - 543;
    
    async function loadActiveHouseholdsAndRates() {
      try {
        setLoadingModal(true);
        const [householdsRes, tiersRes] = await Promise.all([
          httpClient.get<any[]>(`/villages/${villageId}/households?month=${monthNum}&year=${yearNum}`),
          httpClient.get<any[]>(`/water-units?subdistrict_id=1&month=${monthNum}&year=${yearNum}`)
        ]);
        setActiveHouseholds(householdsRes || []);
        
        const sortedTiers = (tiersRes || []).sort((a, b) => (Number(a.start_unit) || 0) - (Number(b.start_unit) || 0));
        setModalWaterTiers(sortedTiers);
      } catch (err) {
        console.error("Failed to load households/tiers for village", err);
      } finally {
        setLoadingModal(false);
      }
    }
    
    loadActiveHouseholdsAndRates();
  }, [activeVillage, selectedMonth, selectedYear]);

  // Derive stats dynamically from fetched data
  const stats = useMemo(() => {
    if (!globalStats) {
      return {
        totalRevenue: 0,
        overdueAmount: 0,
        totalVillages: 0,
        waterPaid: 0,
        waterTotal: 0,
        wastePaid: 0,
        wasteTotal: 0,
        totalHouseholds: 0
      };
    }
    const expected = parseFloat(globalStats.revenueTotal) || 0;
    const collected = parseFloat(globalStats.revenueCollected) || 0;
    const pending = expected - collected;
    return {
      totalRevenue: collected,
      overdueAmount: pending > 0 ? pending : 0,
      totalVillages: villages.length,
      waterPaid: globalStats.waterProgress.collected,
      waterTotal: globalStats.waterProgress.target,
      wastePaid: globalStats.garbageProgress.collected,
      wasteTotal: globalStats.garbageProgress.target,
      totalHouseholds: parseInt(globalStats.householdsTotal) || 0
    };
  }, [globalStats, villages]);

  // 5. Filter villages by search input
  const filteredVillages = useMemo(() => {
    if (!searchQuery.trim()) return villages;
    return villages.filter(v => 
      v.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, villages]);

  // Toast handler
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };



  // Helper to calculate tier usages
  const getTierUsages = (consumed: number, tiers: any[]): number[] => {
    let remaining = consumed;
    return tiers.map(tier => {
      if (remaining <= 0) return 0;
      const start = Number(tier.start_unit);
      const end = tier.end_unit === null || tier.end_unit === undefined || tier.end_unit === 9999 ? null : Number(tier.end_unit);
      
      let capacity = 0;
      if (end === null) {
        capacity = remaining;
      } else {
        if (start === 0) {
          capacity = end;
        } else {
          capacity = end - start + 1;
        }
      }
      
      const consumedInTier = Math.min(remaining, capacity);
      remaining -= consumedInTier;
      return consumedInTier;
    });
  };

  // Calculate water totals for active village households
  const waterTotals = useMemo(() => {
    let consumedSum = 0;
    let amountSum = 0;
    const tierSums = modalWaterTiers.map(() => 0);

    activeHouseholds.forEach(h => {
      if (h.is_water_recorded) {
        const consumed = (h.water_consumed !== undefined && h.water_consumed !== null && !isNaN(h.water_consumed)) ? Number(h.water_consumed) : 0;
        const amount = (h.water_total_amount !== undefined && h.water_total_amount !== null && !isNaN(h.water_total_amount)) ? Number(h.water_total_amount) : 0;
        consumedSum += consumed;
        amountSum += amount;

        const usages = getTierUsages(consumed, modalWaterTiers);
        usages.forEach((val, idx) => {
          tierSums[idx] += val;
        });
      }
    });

    return {
      consumedSum,
      amountSum,
      tierSums
    };
  }, [activeHouseholds, modalWaterTiers]);

  // Calculate garbage totals for active village households
  const garbageTotals = useMemo(() => {
    let sum20 = 0;
    let sum40 = 0;
    let sum60 = 0;
    let sum100 = 0;
    let sumAmount = 0;

    activeHouseholds.forEach(h => {
      if (h.is_garbage_recorded) {
        sum20 += (h.garbage_20_amount !== undefined && h.garbage_20_amount !== null && !isNaN(h.garbage_20_amount)) ? Number(h.garbage_20_amount) : 0;
        sum40 += (h.garbage_40_amount !== undefined && h.garbage_40_amount !== null && !isNaN(h.garbage_40_amount)) ? Number(h.garbage_40_amount) : 0;
        sum60 += (h.garbage_60_amount !== undefined && h.garbage_60_amount !== null && !isNaN(h.garbage_60_amount)) ? Number(h.garbage_60_amount) : 0;
        sum100 += (h.garbage_100_amount !== undefined && h.garbage_100_amount !== null && !isNaN(h.garbage_100_amount)) ? Number(h.garbage_100_amount) : 0;
        sumAmount += (h.garbage_total_amount !== undefined && h.garbage_total_amount !== null && !isNaN(h.garbage_total_amount)) ? Number(h.garbage_total_amount) : 0;
      }
    });

    return {
      sum20,
      sum40,
      sum60,
      sum100,
      sumAmount
    };
  }, [activeHouseholds]);


  // Excel Exporter (HTML spreadsheet layout)
  const handleExportExcel = async (type: string, targetVillage?: VillageProgress) => {
    const monthNum = monthMap[selectedMonth] || 5;
    const yearNum = parseInt(selectedYear) - 543; // e.g. 2569 -> 2026

    let title = "";
    let excelContent = "";

    // Fetch water tiers if exporting water reports
    let waterTiers: any[] = [];
    if (type.startsWith("water_")) {
      try {
        const res = await httpClient.get<any[]>(`/water-units?subdistrict_id=1&month=${monthNum}&year=${yearNum}`);
        waterTiers = res || [];
        waterTiers.sort((a, b) => (Number(a.start_unit) || 0) - (Number(b.start_unit) || 0));
      } catch (err) {
        console.error("Failed to fetch water units", err);
        triggerToast("เกิดข้อผิดพลาดในการโหลดอัตราค่าน้ำประปา");
        return;
      }
      if (waterTiers.length === 0) {
        triggerToast("ไม่พบข้อมูลการตั้งค่าอัตราค่าน้ำประปาขั้นบันได");
        return;
      }
    }

    // XML/HTML Escaper for safety
    const escapeXml = (unsafe: any): string => {
      if (unsafe === undefined || unsafe === null) return "";
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    // Helper to extract village info from name (e.g. "หมู่ 1 บ้านป่าสัก")
    const getVillageInfo = (name: string) => {
      const match = name.match(/หมู่\s*(\d+)\s*(.*)/);
      if (match) {
        return { number: match[1], name: match[2] };
      }
      return { number: "", name };
    };

    // Style section for Excel
    const styleSheet = `
      <style>
        table { border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000000; padding: 6px; font-family: "Cordia New", "TH Sarabun New", sans-serif; font-size: 15px; }
        th { font-weight: bold; background-color: #f2f2f2; text-align: center; }
        .title { border: none; font-size: 18px; font-weight: bold; text-align: center; }
        .subtitle { border: none; font-size: 16px; font-weight: bold; text-align: center; }
        .total-row td { font-weight: bold; background-color: #f9f9f9; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
      </style>
    `;

    if (targetVillage) {
      // ----------------------------------------------------
      // EXPORT SPECIFIC VILLAGE (FROM MODAL)
      // ----------------------------------------------------
      try {
        const res = await httpClient.get<any[]>(`/villages/${targetVillage.id}/households?month=${monthNum}&year=${yearNum}`);
        const households = res || [];

        if (type === "water_village") {
          title = `รายงานสรุปยอดค่าบริการน้ำประปาประจำเดือน_${selectedMonth}_ปี_${selectedYear}_${targetVillage.name}`;
          
          let sumConsumed = 0;
          let sumAmount = 0;
          const sumTierUsages = waterTiers.map(() => 0);

          const rowsHtml = households.map((h, i) => {
            const consumed = (h.water_consumed !== undefined && h.water_consumed !== null && !isNaN(h.water_consumed)) ? Number(h.water_consumed) : 0;
            const amount = (h.water_total_amount !== undefined && h.water_total_amount !== null && !isNaN(h.water_total_amount)) ? Number(h.water_total_amount) : 0;
            sumConsumed += consumed;
            sumAmount += amount;

            const tierUsages = getTierUsages(consumed, waterTiers);
            tierUsages.forEach((val, idx) => {
              sumTierUsages[idx] += val;
            });

            const tierCells = tierUsages.map(val => `<td class="text-right">${val > 0 ? val.toFixed(1) : "-"}</td>`).join("");

            return `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td class="text-center">${escapeXml(h.house_number || "-")}</td>
                <td class="text-center">${escapeXml(h.water_user_id || "-")}</td>
                <td class="text-left">${escapeXml((h.title_name || "") + (h.first_name || "") + " " + (h.last_name || ""))}</td>
                <td class="text-right">${(h.water_curr_reading !== undefined && h.water_curr_reading !== null && !isNaN(h.water_curr_reading)) ? Number(h.water_curr_reading).toFixed(1) : "0.0"}</td>
                <td class="text-right">${(h.water_prev_reading !== undefined && h.water_prev_reading !== null && !isNaN(h.water_prev_reading)) ? Number(h.water_prev_reading).toFixed(1) : "0.0"}</td>
                <td class="text-right">${consumed.toFixed(1)}</td>
                ${tierCells}
                <td class="text-right">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `;
          }).join("");

          const totalCols = 8 + waterTiers.length;
          const infoColspan = 4 + waterTiers.length;

          const tierHeaders = waterTiers.map(t => {
            const endText = t.end_unit === null || t.end_unit === undefined || t.end_unit === 9999 ? "ขึ้นไป" : t.end_unit;
            return `<th>${t.start_unit}-${endText} หน่วย<br/>(${Number(t.cost).toFixed(2)} บ.)</th>`;
          }).join("");

          const totalTierCells = sumTierUsages.map(val => `<td class="text-right">${val > 0 ? val.toFixed(1) : "-"}</td>`).join("");

          excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
              <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
              ${styleSheet}
            </head>
            <body>
              <table>
                <tr>
                  <td colspan="${totalCols}" class="title">รายงานสรุปยอดค่าบริการน้ำประปาประจำเดือน ${escapeXml(selectedMonth)} ปี ${escapeXml(selectedYear)}</td>
                </tr>
                <tr>
                  <td colspan="${totalCols}" class="subtitle">${escapeXml(targetVillage.name)}</td>
                </tr>
                <tr><td colspan="${totalCols}" style="border: none; height: 10px;"></td></tr>
                <thead>
                  <tr>
                    <th rowspan="2">ลำดับที่</th>
                    <th rowspan="2">บ้านเลขที่</th>
                    <th rowspan="2">เลขผู้ใช้น้ำ</th>
                    <th rowspan="2">ชื่อ - สกุล</th>
                    <th colspan="${infoColspan}">ข้อมูลการใช้น้ำ</th>
                  </tr>
                  <tr>
                    <th>เลขครั้งหลัง</th>
                    <th>เลขครั้งก่อน</th>
                    <th>จำนวนที่ใช้</th>
                    ${tierHeaders}
                    <th>เป็นเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                  <tr class="total-row">
                    <td colspan="4" class="text-center">รวมทั้งสิ้น</td>
                    <td></td>
                    <td></td>
                    <td class="text-right">${sumConsumed.toFixed(1)}</td>
                    ${totalTierCells}
                    <td class="text-right">${sumAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </body>
            </html>
          `;
        } else if (type === "waste_village") {
          title = `รายงานสรุปยอดค่าบริการเก็บขยะประจำเดือน_${selectedMonth}_ปี_${selectedYear}_${targetVillage.name}`;
          
          let sum20 = 0;
          let sum40 = 0;
          let sum60 = 0;
          let sum100 = 0;
          let sumAmount = 0;

          const rowsHtml = households.map((h, i) => {
            const amount20 = (h.garbage_20_amount !== undefined && h.garbage_20_amount !== null && !isNaN(h.garbage_20_amount)) ? Number(h.garbage_20_amount) : 0;
            const amount40 = (h.garbage_40_amount !== undefined && h.garbage_40_amount !== null && !isNaN(h.garbage_40_amount)) ? Number(h.garbage_40_amount) : 0;
            const amount60 = (h.garbage_60_amount !== undefined && h.garbage_60_amount !== null && !isNaN(h.garbage_60_amount)) ? Number(h.garbage_60_amount) : 0;
            const amount100 = (h.garbage_100_amount !== undefined && h.garbage_100_amount !== null && !isNaN(h.garbage_100_amount)) ? Number(h.garbage_100_amount) : 0;
            const total = (h.garbage_total_amount !== undefined && h.garbage_total_amount !== null && !isNaN(h.garbage_total_amount)) ? Number(h.garbage_total_amount) : 0;

            sum20 += amount20;
            sum40 += amount40;
            sum60 += amount60;
            sum100 += amount100;
            sumAmount += total;

            return `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td class="text-center">${escapeXml(h.house_number || "-")}</td>
                <td class="text-left">${escapeXml((h.title_name || "") + (h.first_name || "") + " " + (h.last_name || ""))}</td>
                <td class="text-right">${amount20 > 0 ? amount20 : "-"}</td>
                <td class="text-right">${amount40 > 0 ? amount40 : "-"}</td>
                <td class="text-right">${amount60 > 0 ? amount60 : "-"}</td>
                <td class="text-right">${amount100 > 0 ? amount100 : "-"}</td>
                <td class="text-right">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `;
          }).join("");

          excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
              <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
              ${styleSheet}
            </head>
            <body>
              <table>
                <tr>
                  <td colspan="8" class="title">รายงานสรุปยอดค่าบริการเก็บขยะประจำเดือน ${escapeXml(selectedMonth)} ปี ${escapeXml(selectedYear)}</td>
                </tr>
                <tr>
                  <td colspan="8" class="subtitle">${escapeXml(targetVillage.name)}</td>
                </tr>
                <tr><td colspan="8" style="border: none; height: 10px;"></td></tr>
                <thead>
                  <tr>
                    <th rowspan="2">ลำดับที่</th>
                    <th rowspan="2">บ้านเลขที่</th>
                    <th rowspan="2">ชื่อ - สกุล</th>
                    <th colspan="5">ข้อมูลการใช้ถังขยะ</th>
                  </tr>
                  <tr>
                    <th>ขนาดปกติ / 20 บาท</th>
                    <th>ขนาดใหญ่ / 40 บาท</th>
                    <th>ขนาดใหญ่พิเศษ / 60 บาท</th>
                    <th>เหมาจ่าย / 100 บาท</th>
                    <th>เป็นเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                  <tr class="total-row">
                    <td colspan="3" class="text-center">รวมทั้งสิ้น</td>
                    <td class="text-right">${sum20 > 0 ? sum20 : "-"}</td>
                    <td class="text-right">${sum40 > 0 ? sum40 : "-"}</td>
                    <td class="text-right">${sum60 > 0 ? sum60 : "-"}</td>
                    <td class="text-right">${sum100 > 0 ? sum100 : "-"}</td>
                    <td class="text-right">${sumAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </body>
            </html>
          `;
        }
      } catch (err) {
        console.error("Failed to export village report", err);
        triggerToast("เกิดข้อผิดพลาดในการดึงข้อมูลส่งออก");
        return;
      }
    } else {
      // ----------------------------------------------------
      // EXPORT ALL VILLAGES OR SUBDISTRICT LEVEL REPORTS
      // ----------------------------------------------------
      if (type === "water_tambon" || type === "waste_tambon") {
        try {
          // Fetch summaries for all villages
          const villageDataList = await Promise.all(
            villages.map(async (v) => {
              const households = await httpClient.get<any[]>(`/villages/${v.id}/households?month=${monthNum}&year=${yearNum}`);
              const parsed = getVillageInfo(v.name);
              
              let waterUserCount = 0;
              let waterConsumedSum = 0;
              let waterAmountSum = 0;
              const villageTierSums = waterTiers.map(() => 0);
              
              let waste20Sum = 0;
              let waste40Sum = 0;
              let waste60Sum = 0;
              let waste100Sum = 0;
              let wasteAmountSum = 0;
              
              const list = households || [];
              list.forEach(h => {
                if (h.is_water_recorded) {
                  waterUserCount++;
                  const consumed = (h.water_consumed !== undefined && h.water_consumed !== null && !isNaN(h.water_consumed)) ? Number(h.water_consumed) : 0;
                  waterConsumedSum += consumed;
                  waterAmountSum += (h.water_total_amount !== undefined && h.water_total_amount !== null && !isNaN(h.water_total_amount)) ? Number(h.water_total_amount) : 0;

                  const tierUsages = getTierUsages(consumed, waterTiers);
                  tierUsages.forEach((val, idx) => {
                    villageTierSums[idx] += val;
                  });
                }
                if (h.is_garbage_recorded) {
                  waste20Sum += (h.garbage_20_amount !== undefined && h.garbage_20_amount !== null && !isNaN(h.garbage_20_amount)) ? Number(h.garbage_20_amount) : 0;
                  waste40Sum += (h.garbage_40_amount !== undefined && h.garbage_40_amount !== null && !isNaN(h.garbage_40_amount)) ? Number(h.garbage_40_amount) : 0;
                  waste60Sum += (h.garbage_60_amount !== undefined && h.garbage_60_amount !== null && !isNaN(h.garbage_60_amount)) ? Number(h.garbage_60_amount) : 0;
                  waste100Sum += (h.garbage_100_amount !== undefined && h.garbage_100_amount !== null && !isNaN(h.garbage_100_amount)) ? Number(h.garbage_100_amount) : 0;
                  wasteAmountSum += (h.garbage_total_amount !== undefined && h.garbage_total_amount !== null && !isNaN(h.garbage_total_amount)) ? Number(h.garbage_total_amount) : 0;
                }
              });
              
              return {
                villageName: parsed.name,
                villageNumber: parsed.number,
                waterUserCount,
                waterConsumedSum,
                waterAmountSum,
                villageTierSums,
                waste20Sum,
                waste40Sum,
                waste60Sum,
                waste100Sum,
                wasteAmountSum
              };
            })
          );

          if (type === "water_tambon") {
            title = `รายงานสรุปยอดค่าบริการน้ำประปาประจำเดือน_${selectedMonth}_ปี_${selectedYear}_ตำบลทุ่งหลวง`;
            
            let totalUsers = 0;
            let totalConsumed = 0;
            let totalAmount = 0;
            const totalTierSums = waterTiers.map(() => 0);

            const rowsXml = villageDataList.map((v, i) => {
              totalUsers += v.waterUserCount;
              totalConsumed += v.waterConsumedSum;
              totalAmount += v.waterAmountSum;

              v.villageTierSums.forEach((val, idx) => {
                totalTierSums[idx] += val;
              });

              const tierCells = v.villageTierSums.map(val => {
                return `<Cell ss:StyleID="cell_right"><Data ss:Type="${val > 0 ? "Number" : "String"}">${val > 0 ? val : "-"}</Data></Cell>`;
              }).join("");

              return `
                 <Row ss:Height="20">
                  <Cell ss:StyleID="cell_center"><Data ss:Type="Number">${i + 1}</Data></Cell>
                  <Cell ss:StyleID="cell_left"><Data ss:Type="String">${escapeXml(v.villageName)}</Data></Cell>
                  <Cell ss:StyleID="cell_center"><Data ss:Type="String">หมู่ที่ ${escapeXml(v.villageNumber)}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${v.waterUserCount}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${v.waterConsumedSum}</Data></Cell>
                  ${tierCells}
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${v.waterAmountSum}</Data></Cell>
                 </Row>
              `;
            }).join("");

            const totalColsAcross = 5 + waterTiers.length;
            const infoColspan = 2 + waterTiers.length;

            const tierHeaders = waterTiers.map(t => {
              const endText = t.end_unit === null || t.end_unit === undefined || t.end_unit === 9999 ? "ขึ้นไป" : t.end_unit;
              return `<Cell ss:StyleID="header"><Data ss:Type="String">${t.start_unit}-${endText} หน่วย&#10;(${Number(t.cost).toFixed(2)} บาท)</Data></Cell>`;
            }).join("");

            const totalTierCells = totalTierSums.map(val => {
              return `<Cell ss:StyleID="cell_right"><Data ss:Type="${val > 0 ? "Number" : "String"}">${val > 0 ? val : "-"}</Data></Cell>`;
            }).join("");

            excelContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="14"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="title">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="18" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="subtitle">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="16" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="header">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="cell_left">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="cell_center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="cell_right">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="total">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#F9F9F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="ตำบลทุ่งหลวง">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="160"/>
   <Column ss:Width="70"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   ${waterTiers.map(() => `<Column ss:Width="95"/>`).join("")}
   <Column ss:Width="110"/>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="${totalColsAcross}" ss:StyleID="title"><Data ss:Type="String">รายงานสรุปยอดค่าบริการน้ำประปาประจำเดือน ${escapeXml(selectedMonth)} ปี ${escapeXml(selectedYear)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="${totalColsAcross}" ss:StyleID="subtitle"><Data ss:Type="String">ตำบลทุ่งหลวง</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">ลำดับที่</Data></Cell>
    <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">บ้าน</Data></Cell>
    <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">หมู่ที่</Data></Cell>
    <Cell ss:MergeAcross="${infoColspan}" ss:StyleID="header"><Data ss:Type="String">ข้อมูลการใช้น้ำ</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:Index="4" ss:StyleID="header"><Data ss:Type="String">จำนวนผู้ใช้น้ำ</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">จำนวนน้ำที่ใช้</Data></Cell>
    ${tierHeaders}
    <Cell ss:StyleID="header"><Data ss:Type="String">เป็นเงิน</Data></Cell>
   </Row>
   ${rowsXml}
   <Row ss:Height="20">
    <Cell ss:Index="2" ss:MergeAcross="1" ss:StyleID="total"><Data ss:Type="String">รวมทั้งสิ้น</Data></Cell>
    <Cell ss:Index="4" ss:StyleID="cell_right"><Data ss:Type="Number">${totalUsers}</Data></Cell>
    <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${totalConsumed}</Data></Cell>
    ${totalTierCells}
    <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${totalAmount}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
          } else if (type === "waste_tambon") {
            title = `รายงานสรุปยอดค่าบริการเก็บขยะประจำเดือน_${selectedMonth}_ปี_${selectedYear}_ตำบลทุ่งหลวง`;
            
            let total20 = 0;
            let total40 = 0;
            let total60 = 0;
            let total100 = 0;
            let totalAmount = 0;

            const rowsXml = villageDataList.map((v, i) => {
              total20 += v.waste20Sum;
              total40 += v.waste40Sum;
              total60 += v.waste60Sum;
              total100 += v.waste100Sum;
              totalAmount += v.wasteAmountSum;

              return `
                 <Row ss:Height="20">
                  <Cell ss:StyleID="cell_center"><Data ss:Type="Number">${i + 1}</Data></Cell>
                  <Cell ss:StyleID="cell_left"><Data ss:Type="String">${escapeXml(v.villageName)}</Data></Cell>
                  <Cell ss:StyleID="cell_center"><Data ss:Type="String">หมู่ที่ ${escapeXml(v.villageNumber)}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${v.waste20Sum > 0 ? "Number" : "String"}">${v.waste20Sum > 0 ? v.waste20Sum : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${v.waste40Sum > 0 ? "Number" : "String"}">${v.waste40Sum > 0 ? v.waste40Sum : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${v.waste60Sum > 0 ? "Number" : "String"}">${v.waste60Sum > 0 ? v.waste60Sum : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${v.waste100Sum > 0 ? "Number" : "String"}">${v.waste100Sum > 0 ? v.waste100Sum : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${v.wasteAmountSum}</Data></Cell>
                 </Row>
              `;
            }).join("");

            excelContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="14"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="title">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="18" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="subtitle">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="16" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="header">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="cell_left">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="cell_center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="cell_right">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="total">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#F9F9F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="ตำบลทุ่งหลวง">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="160"/>
   <Column ss:Width="70"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="7" ss:StyleID="title"><Data ss:Type="String">รายงานสรุปยอดค่าบริการเก็บขยะประจำเดือน ${escapeXml(selectedMonth)} ปี ${escapeXml(selectedYear)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="7" ss:StyleID="subtitle"><Data ss:Type="String">ตำบลทุ่งหลวง</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">ลำดับที่</Data></Cell>
    <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">บ้าน</Data></Cell>
    <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">หมู่ที่</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="header"><Data ss:Type="String">ข้อมูลการใช้ถังขยะ</Data></Cell>
    <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">เป็นเงิน</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:Index="4" ss:StyleID="header"><Data ss:Type="String">ขนาดปกติ / 20 บาท</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">ขนาดใหญ่ / 40 บาท</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">ขนาดใหญ่พิเศษ / 60 บาท</Data></Cell>
    <Cell ss:StyleID="header"><Data ss:Type="String">เหมาจ่าย / 100 บาท</Data></Cell>
   </Row>
   ${rowsXml}
   <Row ss:Height="20">
    <Cell ss:Index="2" ss:MergeAcross="1" ss:StyleID="total"><Data ss:Type="String">รวมทั้งสิ้น</Data></Cell>
    <Cell ss:Index="4" ss:StyleID="cell_right"><Data ss:Type="${total20 > 0 ? "Number" : "String"}">${total20 > 0 ? total20 : "-"}</Data></Cell>
    <Cell ss:StyleID="cell_right"><Data ss:Type="${total40 > 0 ? "Number" : "String"}">${total40 > 0 ? total40 : "-"}</Data></Cell>
    <Cell ss:StyleID="cell_right"><Data ss:Type="${total60 > 0 ? "Number" : "String"}">${total60 > 0 ? total60 : "-"}</Data></Cell>
    <Cell ss:StyleID="cell_right"><Data ss:Type="${total100 > 0 ? "Number" : "String"}">${total100 > 0 ? total100 : "-"}</Data></Cell>
    <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${totalAmount}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
          }
        } catch (err) {
          console.error("Failed to fetch subdistrict reports", err);
          triggerToast("เกิดข้อผิดพลาดในการดึงข้อมูลส่งออก");
          return;
        }
      } else if (type === "water_village" || type === "waste_village") {
        // Fetch all villages data and stack them
        try {
          const allData = await Promise.all(
            villages.map(async (v) => {
              const res = await httpClient.get<any[]>(`/villages/${v.id}/households?month=${monthNum}&year=${yearNum}`);
              return { villageName: v.name, households: res || [] };
            })
          );

          const getVillageTabName = (name: string) => {
            const match = name.match(/หมู่\s*(\d+)/);
            if (match) {
              return `หมู่ที่ ${match[1]}`;
            }
            return name;
          };

          if (type === "water_village") {
            title = `รายงานสรุปยอดค่าบริการน้ำประปาหมู่บ้านทั้งหมดประจำเดือน_${selectedMonth}_ปี_${selectedYear}`;
            
            const worksheetsXml = allData.map((vData) => {
              let sumConsumed = 0;
              let sumAmount = 0;
              const sumTierUsages = waterTiers.map(() => 0);

              const rowsXml = vData.households.map((h, i) => {
                const consumed = (h.water_consumed !== undefined && h.water_consumed !== null && !isNaN(h.water_consumed)) ? Number(h.water_consumed) : 0;
                const amount = (h.water_total_amount !== undefined && h.water_total_amount !== null && !isNaN(h.water_total_amount)) ? Number(h.water_total_amount) : 0;
                sumConsumed += consumed;
                sumAmount += amount;

                const tierUsages = getTierUsages(consumed, waterTiers);
                tierUsages.forEach((val, idx) => {
                  sumTierUsages[idx] += val;
                });

                const tierCells = tierUsages.map(val => {
                  return `<Cell ss:StyleID="cell_right"><Data ss:Type="${val > 0 ? "Number" : "String"}">${val > 0 ? val : "-"}</Data></Cell>`;
                }).join("");

                return `
                 <Row ss:Height="20">
                  <Cell ss:StyleID="cell_center"><Data ss:Type="Number">${i + 1}</Data></Cell>
                  <Cell ss:StyleID="cell_center"><Data ss:Type="String">${escapeXml(h.house_number || "-")}</Data></Cell>
                  <Cell ss:StyleID="cell_center"><Data ss:Type="String">${escapeXml(h.water_user_id || "-")}</Data></Cell>
                  <Cell ss:StyleID="cell_left"><Data ss:Type="String">${escapeXml((h.title_name || "") + (h.first_name || "") + " " + (h.last_name || ""))}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${(h.water_curr_reading !== undefined && h.water_curr_reading !== null && !isNaN(h.water_curr_reading)) ? Number(h.water_curr_reading) : 0}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${(h.water_prev_reading !== undefined && h.water_prev_reading !== null && !isNaN(h.water_prev_reading)) ? Number(h.water_prev_reading) : 0}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${consumed}</Data></Cell>
                  ${tierCells}
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${amount}</Data></Cell>
                 </Row>
                `;
              }).join("");

              const totalColsAcross = 7 + waterTiers.length;
              const infoColspan = 3 + waterTiers.length;

              const tierHeaders = waterTiers.map(t => {
                const endText = t.end_unit === null || t.end_unit === undefined || t.end_unit === 9999 ? "ขึ้นไป" : t.end_unit;
                return `<Cell ss:StyleID="header"><Data ss:Type="String">${t.start_unit}-${endText} หน่วย&#10;(${Number(t.cost).toFixed(2)} บาท)</Data></Cell>`;
              }).join("");

              const totalTierCells = sumTierUsages.map(val => {
                return `<Cell ss:StyleID="cell_right"><Data ss:Type="${val > 0 ? "Number" : "String"}">${val > 0 ? val : "-"}</Data></Cell>`;
              }).join("");

              return `
               <Worksheet ss:Name="${escapeXml(getVillageTabName(vData.villageName))}">
                <Table>
                 <Column ss:Width="40"/>
                 <Column ss:Width="70"/>
                 <Column ss:Width="70"/>
                 <Column ss:Width="160"/>
                 <Column ss:Width="75"/>
                 <Column ss:Width="75"/>
                 <Column ss:Width="75"/>
                 ${waterTiers.map(() => `<Column ss:Width="95"/>`).join("")}
                 <Column ss:Width="85"/>
                 <Row ss:Height="25">
                  <Cell ss:MergeAcross="${totalColsAcross}" ss:StyleID="title"><Data ss:Type="String">รายงานสรุปยอดค่าบริการน้ำประปาประจำเดือน ${escapeXml(selectedMonth)} ปี ${escapeXml(selectedYear)}</Data></Cell>
                 </Row>
                 <Row ss:Height="20">
                  <Cell ss:MergeAcross="${totalColsAcross}" ss:StyleID="subtitle"><Data ss:Type="String"> ${escapeXml(vData.villageName)}</Data></Cell>
                 </Row>
                 <Row ss:Height="20">
                  <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">ลำดับที่</Data></Cell>
                  <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">บ้านเลขที่</Data></Cell>
                  <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">เลขผู้ใช้น้ำ</Data></Cell>
                  <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">ชื่อ - สกุล</Data></Cell>
                  <Cell ss:MergeAcross="${infoColspan}" ss:StyleID="header"><Data ss:Type="String">ข้อมูลการใช้น้ำ</Data></Cell>
                 </Row>
                 <Row ss:Height="20">
                  <Cell ss:Index="5" ss:StyleID="header"><Data ss:Type="String">เลขครั้งหลัง</Data></Cell>
                  <Cell ss:StyleID="header"><Data ss:Type="String">เลขครั้งก่อน</Data></Cell>
                  <Cell ss:StyleID="header"><Data ss:Type="String">จำนวนที่ใช้</Data></Cell>
                  ${tierHeaders}
                  <Cell ss:StyleID="header"><Data ss:Type="String">เป็นเงิน</Data></Cell>
                 </Row>
                 ${rowsXml}
                 <Row ss:Height="20">
                  <Cell ss:MergeAcross="3" ss:StyleID="total"><Data ss:Type="String">รวมทั้งสิ้น</Data></Cell>
                  <Cell ss:Index="5" ss:StyleID="total"/>
                  <Cell ss:StyleID="total"/>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${sumConsumed}</Data></Cell>
                  ${totalTierCells}
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${sumAmount}</Data></Cell>
                 </Row>
                </Table>
               </Worksheet>
              `;
            }).join("");

            excelContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="14"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="title">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="18" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="subtitle">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="16" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="header">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="cell_left">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="cell_center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="cell_right">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="total">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#F9F9F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${worksheetsXml}
</Workbook>`;
          } else if (type === "waste_village") {
            title = `รายงานสรุปยอดค่าบริการเก็บขยะหมู่บ้านทั้งหมดประจำเดือน_${selectedMonth}_ปี_${selectedYear}`;
            
            const worksheetsXml = allData.map((vData) => {
              let sum20 = 0;
              let sum40 = 0;
              let sum60 = 0;
              let sum100 = 0;
              let sumAmount = 0;

              const rowsXml = vData.households.map((h, i) => {
                const amount20 = (h.garbage_20_amount !== undefined && h.garbage_20_amount !== null && !isNaN(h.garbage_20_amount)) ? Number(h.garbage_20_amount) : 0;
                const amount40 = (h.garbage_40_amount !== undefined && h.garbage_40_amount !== null && !isNaN(h.garbage_40_amount)) ? Number(h.garbage_40_amount) : 0;
                const amount60 = (h.garbage_60_amount !== undefined && h.garbage_60_amount !== null && !isNaN(h.garbage_60_amount)) ? Number(h.garbage_60_amount) : 0;
                const amount100 = (h.garbage_100_amount !== undefined && h.garbage_100_amount !== null && !isNaN(h.garbage_100_amount)) ? Number(h.garbage_100_amount) : 0;
                const total = (h.garbage_total_amount !== undefined && h.garbage_total_amount !== null && !isNaN(h.garbage_total_amount)) ? Number(h.garbage_total_amount) : 0;

                sum20 += amount20;
                sum40 += amount40;
                sum60 += amount60;
                sum100 += amount100;
                sumAmount += total;

                return `
                 <Row ss:Height="20">
                  <Cell ss:StyleID="cell_center"><Data ss:Type="Number">${i + 1}</Data></Cell>
                  <Cell ss:StyleID="cell_center"><Data ss:Type="String">${escapeXml(h.house_number || "-")}</Data></Cell>
                  <Cell ss:StyleID="cell_left"><Data ss:Type="String">${escapeXml((h.title_name || "") + (h.first_name || "") + " " + (h.last_name || ""))}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${amount20 > 0 ? "Number" : "String"}">${amount20 > 0 ? amount20 : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${amount40 > 0 ? "Number" : "String"}">${amount40 > 0 ? amount40 : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${amount60 > 0 ? "Number" : "String"}">${amount60 > 0 ? amount60 : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${amount100 > 0 ? "Number" : "String"}">${amount100 > 0 ? amount100 : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${total}</Data></Cell>
                 </Row>
                `;
              }).join("");

              return `
               <Worksheet ss:Name="${escapeXml(getVillageTabName(vData.villageName))}">
                <Table>
                 <Column ss:Width="40"/>
                 <Column ss:Width="70"/>
                 <Column ss:Width="160"/>
                 <Column ss:Width="110"/>
                 <Column ss:Width="110"/>
                 <Column ss:Width="110"/>
                 <Column ss:Width="110"/>
                 <Column ss:Width="85"/>
                 <Row ss:Height="25">
                  <Cell ss:MergeAcross="7" ss:StyleID="title"><Data ss:Type="String">รายงานสรุปยอดค่าบริการเก็บขยะประจำเดือน ${escapeXml(selectedMonth)} ปี ${escapeXml(selectedYear)}</Data></Cell>
                 </Row>
                 <Row ss:Height="20">
                  <Cell ss:MergeAcross="7" ss:StyleID="subtitle"><Data ss:Type="String"> ${escapeXml(vData.villageName)}</Data></Cell>
                 </Row>
                 <Row ss:Height="20">
                  <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">ลำดับที่</Data></Cell>
                  <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">บ้านเลขที่</Data></Cell>
                  <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">ชื่อ - สกุล</Data></Cell>
                  <Cell ss:MergeAcross="4" ss:StyleID="header"><Data ss:Type="String">ข้อมูลการใช้ถังขยะ</Data></Cell>
                 </Row>
                 <Row ss:Height="20">
                  <Cell ss:Index="4" ss:StyleID="header"><Data ss:Type="String">ขนาดปกติ / 20 บาท</Data></Cell>
                  <Cell ss:StyleID="header"><Data ss:Type="String">ขนาดใหญ่ / 40 บาท</Data></Cell>
                  <Cell ss:StyleID="header"><Data ss:Type="String">ขนาดใหญ่พิเศษ / 60 บาท</Data></Cell>
                  <Cell ss:StyleID="header"><Data ss:Type="String">เหมาจ่าย / 100 บาท</Data></Cell>
                  <Cell ss:StyleID="header"><Data ss:Type="String">เป็นเงิน</Data></Cell>
                 </Row>
                 ${rowsXml}
                 <Row ss:Height="20">
                  <Cell ss:MergeAcross="2" ss:StyleID="total"><Data ss:Type="String">รวมทั้งสิ้น</Data></Cell>
                  <Cell ss:Index="4" ss:StyleID="cell_right"><Data ss:Type="${sum20 > 0 ? "Number" : "String"}">${sum20 > 0 ? sum20 : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${sum40 > 0 ? "Number" : "String"}">${sum40 > 0 ? sum40 : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${sum60 > 0 ? "Number" : "String"}">${sum60 > 0 ? sum60 : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="${sum100 > 0 ? "Number" : "String"}">${sum100 > 0 ? sum100 : "-"}</Data></Cell>
                  <Cell ss:StyleID="cell_right"><Data ss:Type="Number">${sumAmount}</Data></Cell>
                 </Row>
                </Table>
               </Worksheet>
              `;
            }).join("");

            excelContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="14"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="title">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="18" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="subtitle">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Size="16" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="header">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="cell_left">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="cell_center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="cell_right">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="total">
   <Font ss:FontName="Cordia New" x:CharSet="222" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Interior ss:Color="#F9F9F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${worksheetsXml}
</Workbook>`;
          }
        } catch (err) {
          console.error("Failed to export all villages reports", err);
          triggerToast("เกิดข้อผิดพลาดในการดึงข้อมูลส่งออก");
          return;
        }
      }
    }

    if (!excelContent) {
      triggerToast("ไม่พบข้อมูลสำหรับการส่งออกค่าน้ำประปา/จัดการขยะ");
      return;
    }

    const blob = new Blob(["\ufeff", excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/ /g, "_")}_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast(`ส่งออกไฟล์ Excel สำเร็จแล้ว!`);
  };

  // Main Export handler
  const handleMainExport = (type: string) => {
    handleExportExcel(type);
    setIsExportDropdownOpen(false);
  };


  return (
    <div className="space-y-6 font-sans select-none relative pb-12">
      
      {/* Toast Popup */}
      {toastMessage && (
        <SuccessToast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}

      {/* A. 6 Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-300">
        {/* Card 1: รายได้ทั้งหมด */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Banknote className="w-6 h-6 text-[#137333]" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400">รายได้ทั้งหมด</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              ฿{stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 2: ยอดค้างชำระ */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200">
          <div className="w-14 h-14 bg-rose-50 text-[#C5221F] rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400">ยอดค้างชำระ</p>
            <p className="text-2xl font-extrabold text-[#C5221F] mt-1">
              ฿{stats.overdueAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 3: จำนวนหมู่บ้านทั้งหมด */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200">
          <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-[#D81B60]" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400">จำนวนหมู่บ้านทั้งหมด</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {stats.totalVillages}
            </p>
          </div>
        </div>

        {/* Card 4: ค่าน้ำชำระแล้ว */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Droplet className="w-6 h-6 text-[#0B409C]" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400">ค่าน้ำชำระแล้ว</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              ฿{stats.waterPaid}/{stats.waterTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 5: ค่าขยะชำระแล้ว */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6 text-[#137333]" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400">ค่าขยะชำระแล้ว</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              ฿{stats.wastePaid}/{stats.wasteTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 6: จำนวนครัวเรือนทั้งหมด */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center space-x-5 hover:shadow-md transition duration-200">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-[#3F51B5]" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400">จำนวนครัวเรือนทั้งหมด</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {stats.totalHouseholds}
            </p>
          </div>
        </div>
      </div>

      {/* B. Controls & Preview Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Top filter inputs & Export action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
          {/* Left Side: Period Selectors */}
          <div className="space-y-2.5">
            <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider block">
              รอบเดือนการเก็บค่าบริการ
            </label>
            <div className="flex items-center gap-3">
              {/* Year Dropdown */}
              <div className="relative">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="pl-4 pr-10 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14.5px] text-slate-700 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer appearance-none"
                >
                  {yearsList.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-4 pr-10 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14.5px] text-slate-700 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition cursor-pointer appearance-none"
                >
                  <option value="มกราคม">มกราคม</option>
                  <option value="กุมภาพันธ์">กุมภาพันธ์</option>
                  <option value="มีนาคม">มีนาคม</option>
                  <option value="เมษายน">เมษายน</option>
                  <option value="พฤษภาคม">พฤษภาคม</option>
                  <option value="มิถุนายน">มิถุนายน</option>
                  <option value="กรกฎาคม">กรกฎาคม</option>
                  <option value="สิงหาคม">สิงหาคม</option>
                  <option value="กันยายน">กันยายน</option>
                  <option value="ตุลาคม">ตุลาคม</option>
                  <option value="พฤศจิกายน">พฤศจิกายน</option>
                  <option value="ธันวาคม">ธันวาคม</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right Side: File Format switcher & Dropdown Export */}
          <div className="flex items-center space-x-3 self-end">
            


            {/* main export drop trigger button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="flex items-center justify-between gap-3 bg-[#0B409C] hover:bg-[#09337d] text-white font-bold py-2.5 px-5 rounded-2xl shadow-sm transition transform active:scale-95 cursor-pointer text-[14px]"
              >
                <Download className="w-4 h-4" />
                <span>ส่งออกรายงาน Excel</span>
                <ChevronDown className="w-4 h-4 opacity-80" />
              </button>

              {/* Click Outside Overlay to Close */}
              {isExportDropdownOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsExportDropdownOpen(false)}
                />
              )}

              {/* Floating Menu */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    รูปแบบรายงาน
                  </div>
                  <div className="divide-y divide-slate-100">
                    <button
                      type="button"
                      onClick={() => handleMainExport("water_tambon")}
                      className="w-full text-left px-5 py-3.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      รายงานน้ำประปาแบบตำบล
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMainExport("water_village")}
                      className="w-full text-left px-5 py-3.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      รายงานน้ำประปาหมู่บ้าน
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMainExport("waste_tambon")}
                      className="w-full text-left px-5 py-3.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      รายงานขยะแบบตำบล
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMainExport("waste_village")}
                      className="w-full text-left px-5 py-3.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      รายงานขยะแบบหมู่บ้าน
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* C. Preview Table Area */}
        <div className="space-y-5 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-5">
              <h4 className="text-[16px] font-bold text-slate-800 tracking-tight">ตัวอย่างข้อมูลรายงาน</h4>
              
              {/* Legend indicators */}
              <div className="flex items-center space-x-4 text-[12px] text-slate-400 font-bold select-none">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0B409C] inline-block" />
                  <span>น้ำประปา</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#137333] inline-block" />
                  <span>ขยะ</span>
                </div>
              </div>
            </div>

            {/* Quick Screen Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="ค้นหาชื่อหมู่บ้าน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition font-bold"
              />
            </div>
          </div>

          {/* Villages List with twin progress bars */}
          <div className="space-y-3.5 pt-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <div className="w-8 h-8 border-4 border-[#0B409C] border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-[14px]">กำลังโหลดข้อมูลความคืบหน้าของหมู่บ้าน...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-rose-500 font-bold text-[14px]">
                {error}
              </div>
            ) : (
              <>
                {filteredVillages.map((v) => {
                  const waterProgress = v.waterTotal > 0 ? (v.waterPaid / v.waterTotal) * 100 : 0;
                  const wasteProgress = v.wasteTotal > 0 ? (v.wastePaid / v.wasteTotal) * 100 : 0;
                  const isWaterRisk = waterProgress < 50 && v.waterTotal > 0;
                  const isWasteRisk = wasteProgress < 50 && v.wasteTotal > 0;

                  return (
                    <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-3xl hover:bg-slate-50/40 transition gap-4">
                      {/* Village details info */}
                      <div className="sm:w-1/4">
                        <p className="text-[15px] font-extrabold text-slate-800">{v.name}</p>
                        <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
                          ครัวเรือน: {v.households} หลังคาเรือน
                        </span>
                      </div>

                      {/* Twin Progress Bars */}
                      <div className="flex-1 max-w-lg space-y-3">
                        
                        {/* Water Progress bar */}
                        <div className="flex items-center justify-between space-x-4">
                          {/* Bar container */}
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isWaterRisk ? "bg-orange-500" : "bg-[#0B409C]"
                              }`}
                              style={{ width: `${Math.min(100, waterProgress)}%` }}
                            />
                          </div>
                          {/* Values & Alert (Overdue/Risk Alert) */}
                          <div className="w-44 text-right flex items-center justify-end space-x-2">
                            {isWaterRisk && (
                              <span className="text-[10px] text-orange-600 font-bold bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md flex items-center">
                                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                                ค้างชำระสูง
                              </span>
                            )}
                            <span className="text-[12px] font-bold text-slate-500">
                              {v.waterPaid.toLocaleString()} / {v.waterTotal.toLocaleString()} บาท
                            </span>
                          </div>
                        </div>

                        {/* Waste Progress bar */}
                        <div className="flex items-center justify-between space-x-4">
                          {/* Bar container */}
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isWasteRisk ? "bg-orange-500" : "bg-[#137333]"
                              }`}
                              style={{ width: `${Math.min(100, wasteProgress)}%` }}
                            />
                          </div>
                          {/* Values & Alert */}
                          <div className="w-44 text-right flex items-center justify-end space-x-2">
                            {isWasteRisk && (
                              <span className="text-[10px] text-orange-600 font-bold bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md flex items-center">
                                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                                ค้างชำระสูง
                              </span>
                            )}
                            <span className="text-[12px] font-bold text-slate-500">
                              {v.wastePaid.toLocaleString()} / {v.wasteTotal.toLocaleString()} บาท
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Eye details view icon (triggers modal) */}
                      <div className="sm:w-20 text-right">
                        <button 
                          type="button"
                          onClick={() => setActiveVillage(v)}
                          className="p-2.5 bg-[#F8FAFC] text-[#0B409C] hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition duration-150 border border-slate-200/50 cursor-pointer inline-flex items-center justify-center transform active:scale-95"
                          title="ดูรายละเอียดเชิงลึกและส่งออกเฉพาะหมู่บ้านนี้"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {filteredVillages.length === 0 && (
                  <div className="text-center py-12 text-slate-400 font-bold text-[14px]">
                    ไม่พบข้อมูลหมู่บ้านที่คุณค้นหา
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>


      {/* E. Interactive Modal: Specific Village Details View (Option 2) */}
      {activeVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred overlay backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setActiveVillage(null)}
          />

          {/* Modal Container */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-[95vw] md:max-w-7xl w-full border border-slate-100 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 h-[90vh] max-h-[90vh] flex flex-col">
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setActiveVillage(null)}
              className="absolute top-6 right-6 p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="space-y-1 pb-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-extrabold text-slate-800">
                รายละเอียดความคืบหน้า - {activeVillage.name}
              </h3>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                รอบเดือนการเก็บค่าบริการ: {selectedMonth} {selectedYear}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-slate-100 mt-2 mb-4 flex-shrink-0">
              <button
                type="button"
                className={`py-2.5 px-5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                  activeTab === "water"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                onClick={() => setActiveTab("water")}
              >
                รายงานน้ำประปา
              </button>
              <button
                type="button"
                className={`py-2.5 px-5 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                  activeTab === "garbage"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                onClick={() => setActiveTab("garbage")}
              >
                รายงานค่าจัดการขยะ
              </button>
            </div>

            {/* Local Stats Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 flex-shrink-0">
              
              {/* Local Water stats */}
              <div className={`border rounded-2xl p-4 flex items-center space-x-4 transition-all ${
                activeTab === "water" 
                  ? "bg-blue-50/70 border-blue-200 ring-2 ring-blue-600/10 shadow-sm" 
                  : "bg-slate-50/40 border-slate-100 opacity-80"
              }`}>
                <div className="w-12 h-12 rounded-full bg-blue-100/80 flex items-center justify-center flex-shrink-0">
                  <Droplet className="w-6 h-6 text-[#0B409C]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-600/80 uppercase block">ค่าน้ำชำระแล้ว</span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-xl font-black text-[#0B409C]">
                      ฿{activeVillage.waterPaid.toLocaleString()}
                    </span>
                    <span className="text-[14px] font-bold text-slate-400">
                      /{activeVillage.waterTotal.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 ml-2">
                      ({activeVillage.waterTotal > 0 ? ((activeVillage.waterPaid / activeVillage.waterTotal) * 100).toFixed(1) : "0.0"}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Local Waste stats */}
              <div className={`border rounded-2xl p-4 flex items-center space-x-4 transition-all ${
                activeTab === "garbage" 
                  ? "bg-emerald-50/70 border-emerald-200 ring-2 ring-emerald-600/10 shadow-sm" 
                  : "bg-slate-50/40 border-slate-100 opacity-80"
              }`}>
                <div className="w-12 h-12 rounded-full bg-emerald-100/80 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-[#137333]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-600/80 uppercase block">ค่าขยะชำระแล้ว</span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-xl font-black text-[#137333]">
                      ฿{activeVillage.wastePaid.toLocaleString()}
                    </span>
                    <span className="text-[14px] font-bold text-slate-400">
                      /{activeVillage.wasteTotal.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 ml-2">
                      ({activeVillage.wasteTotal > 0 ? ((activeVillage.wastePaid / activeVillage.wasteTotal) * 100).toFixed(1) : "0.0"}%)
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Micro preview table of households */}
            <div className="space-y-3 pb-6 flex-1 min-h-0 flex flex-col">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block flex-shrink-0">
                ตัวอย่างก่อนส่งออก ({activeTab === "water" ? "รายงานน้ำประปา" : "รายงานค่าขยะ"})
              </span>
              
              {activeTab === "water" ? (
                <div className="border border-slate-100 rounded-2xl overflow-auto flex-1 min-h-0 relative">
                  <table className="w-full text-[13px] border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold sticky top-0 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
                        <th className="px-3 py-3 text-center sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_rgba(241,245,249,1)]">ลำดับ</th>
                        <th className="px-3 py-3 text-center sticky left-[45px] bg-slate-50 z-20 shadow-[1px_0_0_0_rgba(241,245,249,1)]">บ้านเลขที่</th>
                        <th className="px-3 py-3 text-center">เลขผู้ใช้น้ำ</th>
                        <th className="px-3 py-3 text-left">ชื่อ - สกุล</th>
                        <th className="px-3 py-3 text-center">เลขครั้งหลัง</th>
                        <th className="px-3 py-3 text-center">เลขครั้งก่อน</th>
                        <th className="px-3 py-3 text-center">จำนวนที่ใช้</th>
                        {modalWaterTiers.map((tier, idx) => {
                          const endText = tier.end_unit === null || tier.end_unit === undefined || tier.end_unit === 9999 ? "ขึ้นไป" : tier.end_unit;
                          return (
                            <th key={tier.id || idx} className="px-3 py-3 text-center whitespace-nowrap">
                              {tier.start_unit}-{endText} หน่วย<br />
                              <span className="text-[11px] text-slate-400 font-normal">({Number(tier.cost).toFixed(2)} บ.)</span>
                            </th>
                          );
                        })}
                        <th className="px-3 py-3 text-right">เป็นเงิน<br /><span className="text-[11px] text-slate-400 font-normal">(บาท)</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {loadingModal ? (
                        <tr>
                          <td colSpan={8 + modalWaterTiers.length} className="text-center py-12 text-slate-400">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>กำลังโหลดข้อมูลครัวเรือน...</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {activeHouseholds.map((h, i) => {
                            const consumed = (h.water_consumed !== undefined && h.water_consumed !== null && !isNaN(h.water_consumed)) ? Number(h.water_consumed) : 0;
                            const amount = (h.water_total_amount !== undefined && h.water_total_amount !== null && !isNaN(h.water_total_amount)) ? Number(h.water_total_amount) : 0;
                            const tierUsages = getTierUsages(consumed, modalWaterTiers);

                            return (
                              <tr key={h.id || i} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2.5 text-center sticky left-0 bg-white shadow-[1px_0_0_0_rgba(241,245,249,1)] z-10">{i + 1}</td>
                                <td className="px-3 py-2.5 text-center sticky left-[45px] bg-white shadow-[1px_0_0_0_rgba(241,245,249,1)] z-10 font-bold">{h.house_number || "-"}</td>
                                <td className="px-3 py-2.5 text-center text-slate-500">{h.water_user_id || "-"}</td>
                                <td className="px-3 py-2.5 text-left truncate max-w-[150px]">
                                  {h.title_name || ""}{h.first_name || ""} {h.last_name || ""}
                                </td>
                                <td className="px-3 py-2.5 text-center font-medium">
                                  {h.water_curr_reading !== undefined && h.water_curr_reading !== null ? Number(h.water_curr_reading).toFixed(1) : "0.0"}
                                </td>
                                <td className="px-3 py-2.5 text-center text-slate-400">
                                  {h.water_prev_reading !== undefined && h.water_prev_reading !== null ? Number(h.water_prev_reading).toFixed(1) : "0.0"}
                                </td>
                                <td className="px-3 py-2.5 text-center font-semibold text-blue-600 bg-blue-50/20">
                                  {consumed.toFixed(1)}
                                </td>
                                {tierUsages.map((val, idx) => (
                                  <td key={idx} className="px-3 py-2.5 text-center text-slate-600">
                                    {val > 0 ? val.toFixed(1) : "-"}
                                  </td>
                                ))}
                                <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                                  {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                          {activeHouseholds.length === 0 && (
                            <tr>
                              <td colSpan={8 + modalWaterTiers.length} className="text-center py-12 text-slate-400">
                                ไม่มีข้อมูลค่าน้ำประปาในหมู่บ้านนี้
                              </td>
                            </tr>
                          )}
                          {/* Total Row */}
                          {activeHouseholds.length > 0 && (
                            <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-200 sticky bottom-0 z-10 shadow-[0_-1px_0_0_rgba(226,232,240,1)]">
                              <td colSpan={4} className="px-3 py-3 text-center sticky left-0 bg-slate-200/95 shadow-[1px_0_0_0_rgba(226,232,240,1)] z-10">รวมทั้งสิ้น</td>
                              <td className="px-3 py-3"></td>
                              <td className="px-3 py-3"></td>
                              <td className="px-3 py-3 text-center text-blue-700 bg-blue-100/40">
                                {waterTotals.consumedSum.toFixed(1)}
                              </td>
                              {waterTotals.tierSums.map((val, idx) => (
                                <td key={idx} className="px-3 py-3 text-center text-slate-700">
                                  {val > 0 ? val.toFixed(1) : "-"}
                                </td>
                              ))}
                              <td className="px-3 py-3 text-right text-slate-900 font-extrabold text-sm">
                                {waterTotals.amountSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-2xl overflow-auto flex-1 min-h-0 relative">
                  <table className="w-full text-[13px] border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold sticky top-0 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
                        <th className="px-4 py-3 text-center sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_rgba(241,245,249,1)]">ลำดับ</th>
                        <th className="px-4 py-3 text-center sticky left-[45px] bg-slate-50 z-20 shadow-[1px_0_0_0_rgba(241,245,249,1)]">บ้านเลขที่</th>
                        <th className="px-4 py-3 text-left">ชื่อ - สกุล</th>
                        <th className="px-4 py-3 text-center">ขนาดปกติ / 20 บาท</th>
                        <th className="px-4 py-3 text-center">ขนาดใหญ่ / 40 บาท</th>
                        <th className="px-4 py-3 text-center">ขนาดใหญ่พิเศษ / 60 บาท</th>
                        <th className="px-4 py-3 text-center">เหมาจ่าย / 100 บาท</th>
                        <th className="px-4 py-3 text-right">เป็นเงิน<br /><span className="text-[11px] text-slate-400 font-normal">(บาท)</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {loadingModal ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>กำลังโหลดข้อมูลครัวเรือน...</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {activeHouseholds.map((h, i) => {
                            const amount20 = (h.garbage_20_amount !== undefined && h.garbage_20_amount !== null && !isNaN(h.garbage_20_amount)) ? Number(h.garbage_20_amount) : 0;
                            const amount40 = (h.garbage_40_amount !== undefined && h.garbage_40_amount !== null && !isNaN(h.garbage_40_amount)) ? Number(h.garbage_40_amount) : 0;
                            const amount60 = (h.garbage_60_amount !== undefined && h.garbage_60_amount !== null && !isNaN(h.garbage_60_amount)) ? Number(h.garbage_60_amount) : 0;
                            const amount100 = (h.garbage_100_amount !== undefined && h.garbage_100_amount !== null && !isNaN(h.garbage_100_amount)) ? Number(h.garbage_100_amount) : 0;
                            const total = (h.garbage_total_amount !== undefined && h.garbage_total_amount !== null && !isNaN(h.garbage_total_amount)) ? Number(h.garbage_total_amount) : 0;

                            return (
                              <tr key={h.id || i} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 text-center sticky left-0 bg-white shadow-[1px_0_0_0_rgba(241,245,249,1)] z-10">{i + 1}</td>
                                <td className="px-4 py-2.5 text-center sticky left-[45px] bg-white shadow-[1px_0_0_0_rgba(241,245,249,1)] z-10 font-bold">{h.house_number || "-"}</td>
                                <td className="px-4 py-2.5 text-left truncate max-w-[150px]">
                                  {h.title_name || ""}{h.first_name || ""} {h.last_name || ""}
                                </td>
                                <td className="px-4 py-2.5 text-center text-slate-600">
                                  {amount20 > 0 ? amount20 : "-"}
                                </td>
                                <td className="px-4 py-2.5 text-center text-slate-600">
                                  {amount40 > 0 ? amount40 : "-"}
                                </td>
                                <td className="px-4 py-2.5 text-center text-slate-600">
                                  {amount60 > 0 ? amount60 : "-"}
                                </td>
                                <td className="px-4 py-2.5 text-center text-slate-600">
                                  {amount100 > 0 ? amount100 : "-"}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                                  {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                          {activeHouseholds.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center py-12 text-slate-400">
                                ไม่มีข้อมูลค่าจัดการขยะในหมู่บ้านนี้
                              </td>
                            </tr>
                          )}
                          {/* Total Row */}
                          {activeHouseholds.length > 0 && (
                            <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-200 sticky bottom-0 z-10 shadow-[0_-1px_0_0_rgba(226,232,240,1)]">
                              <td colSpan={3} className="px-4 py-3 text-center sticky left-0 bg-slate-200/95 shadow-[1px_0_0_0_rgba(226,232,240,1)] z-10">รวมทั้งสิ้น</td>
                              <td className="px-4 py-3 text-center text-slate-700">
                                {garbageTotals.sum20 > 0 ? garbageTotals.sum20 : "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-700">
                                {garbageTotals.sum40 > 0 ? garbageTotals.sum40 : "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-700">
                                {garbageTotals.sum60 > 0 ? garbageTotals.sum60 : "-"}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-700">
                                {garbageTotals.sum100 > 0 ? garbageTotals.sum100 : "-"}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-900 font-extrabold text-sm">
                                {garbageTotals.sumAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100 pt-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleExportExcel("water_village", activeVillage);
                  }}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-2xl text-[14px] shadow-sm transition transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ส่งออกค่าน้ำประปา (EXCEL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportExcel("waste_village", activeVillage);
                  }}
                  className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-2xl text-[14px] shadow-sm transition transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ส่งออกค่าจัดการขยะ (EXCEL)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
