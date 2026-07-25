"use client";

import { useState, useEffect } from "react";
import { Droplet, Trash2, Plus } from "lucide-react";
import SuccessToast from "../../../component/success-toast";
import { WaterTier, GarbageBin } from "../../../interface/baseSettings";
import { getWaterTiers, getGarbageRates, saveWaterTiers, saveGarbageRates } from "../../../service/baseSettings";

export default function BaseSettings() {
  // 1. Water Rates Tier State
  const [waterTiers, setWaterTiers] = useState<WaterTier[]>([]);
  const [deletedTierIds, setDeletedTierIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 2. Garbage Rates State
  const [garbageBins, setGarbageBins] = useState<GarbageBin[]>([]);
  const [deletedBinIds, setDeletedBinIds] = useState<number[]>([]);

  // 3. Toasts / Notification states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWaterDirty, setIsWaterDirty] = useState<boolean>(false);
  const [isGarbageDirty, setIsGarbageDirty] = useState<boolean>(false);

  // Fetch water tiers on mount/update
  const fetchWaterTiers = async () => {
    try {
      const data = await getWaterTiers(1);
      setWaterTiers(data);
      setIsWaterDirty(false);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลอัตราค่าน้ำประปา");
    } finally {
      setLoading(false);
    }
  };

  // Fetch garbage rates on mount
  const fetchGarbageRates = async () => {
    try {
      setLoading(true);
      const data = await getGarbageRates(1);
      setGarbageBins(data);
      setIsGarbageDirty(false);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลอัตราค่าเก็บขยะ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWaterTiers();
    fetchGarbageRates();
  }, []);

  // Dynamic Tier addition logic
  const handleAddWaterTier = () => {
    setWaterTiers((prev) => {
      const newTier: WaterTier = {
        id: Date.now(),
        start: "",
        end: "",
        rate: ""
      };
      return [...prev, newTier];
    });
    setIsWaterDirty(true);
  };

  // Delete water tier
  const handleDeleteWaterTier = (id: number | string) => {
    setWaterTiers((prev) => {
      if (prev.length <= 1) {
        alert("ไม่สามารถลบได้อีก ต้องมีช่วงบันไดอย่างน้อย 1 ขั้น!");
        return prev;
      }

      // If the ID is a database ID, add it to deletedTierIds (with duplicate check to handle React StrictMode double invocation)
      const numId = typeof id === "number" ? id : parseInt(id);
      if (!isNaN(numId) && numId < 1000000000) {
        setDeletedTierIds((prevDeleted) =>
          prevDeleted.includes(numId) ? prevDeleted : [...prevDeleted, numId]
        );
      }

      // 1. Sort the previous tiers by start unit to determine which one is the last one
      const sortedPrev = [...prev].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
      const lastTier = sortedPrev[sortedPrev.length - 1];

      // 2. Filter out the deleted tier
      const filtered = prev.filter((t) => t.id !== id);

      // 3. If the deleted tier was indeed the last tier, make the new last tier's end empty ("")
      if (lastTier && lastTier.id === id && filtered.length > 0) {
        const sortedFiltered = [...filtered].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
        const newLastTier = sortedFiltered[sortedFiltered.length - 1];

        return filtered.map((t) => {
          if (t.id === newLastTier.id) {
            return { ...t, end: "" };
          }
          return t;
        });
      }

      return filtered;
    });
    setIsWaterDirty(true);
  };

  // Water inputs change handler
  const handleWaterRateChange = (id: number | string, field: "start" | "end" | "rate", value: string) => {
    setWaterTiers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (field === "rate") {
            return { ...t, rate: value };
          } else if (field === "start") {
            return { ...t, start: value === "" ? "" : parseInt(value) };
          } else {
            return { ...t, end: value === "" ? "" : parseInt(value) };
          }
        }
        return t;
      })
    );
    setIsWaterDirty(true);
  };

  // Validation logic to check for range continuity, overlaps, and negative values
  const validateWaterTiers = (tiers: WaterTier[]): string | null => {
    // 1. Check basic constraints on each tier
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];

      if (t.start === "") {
        return `แถวที่ ${i + 1}: กรุณากรอก "หน่วยเริ่มต้น"`;
      }
      if (t.rate === "") {
        return `แถวที่ ${i + 1}: กรุณากรอก "ราคาต่อหน่วย"`;
      }

      if (t.start < 0) {
        return `แถวที่ ${i + 1}: หน่วยเริ่มต้นต้องไม่ต่ำกว่า 0`;
      }

      // If end is specified, it must be >= start
      if (t.end !== "" && t.end < t.start) {
        return `แถวที่ ${i + 1}: หน่วยสิ้นสุด (${t.end}) ต้องมากกว่าหรือเท่ากับหน่วยเริ่มต้น (${t.start})`;
      }

      const rateNum = parseFloat(t.rate);
      if (isNaN(rateNum) || rateNum < 0) {
        return `แถวที่ ${i + 1}: ราคาต่อหน่วยต้องเป็นตัวเลขเชิงบวก`;
      }
    }

    // 2. Sort tiers by start unit to check continuity
    const sorted = [...tiers].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));

    // 3. Enforce that all but the highest tier must specify an EndUnit
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end === "") {
        return `กรุณากรอก "หน่วยสิ้นสุด" ของทุกช่วงบันไดค่าน้ำ ยกเว้นช่วงสูงสุดสุดท้าย (ที่กรอกว่างเปล่าเพื่อเป็นตัวแทนของค่าไม่จำกัด)`;
      }
    }

    // 4. Enforce that the first tier starts at 0
    if (sorted[0].start !== 0) {
      return `ช่วงหน่วยค่าน้ำต้องเริ่มต้นที่ 0 (ปัจจุบันแถวแรกเริ่มที่ ${sorted[0].start})`;
    }

    // 5. Strict continuity and overlap check
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      // If previous has empty end (unlimited), it's invalid to have a tier after it
      if (prev.end === "") {
        return `ช่วงที่จำกัดหน่วยสูงสุด (ไม่จำกัดปลายเปิด) จะต้องเป็นช่วงสุดท้ายของขั้นบันไดค่าน้ำเสมอ!`;
      }

      const prevEnd = prev.end as number;
      const currStart = curr.start as number;

      const expectedStart = prevEnd + 1;
      if (currStart !== expectedStart) {
        const prevEndStr = prev.end;
        const currEndStr = curr.end === "" ? "ไม่จำกัด" : curr.end;

        if (currStart < expectedStart) {
          // Overlap case
          return `ช่วงหน่วยค่าน้ำมีความทับซ้อนกัน:\n- ช่วงก่อนหน้า: ${prev.start} ถึง ${prevEndStr}\n- ช่วงปัจจุบัน: ${curr.start} ถึง ${currEndStr}\n(ช่วงปัจจุบันเริ่มซ้ำซ้อนกับช่วงก่อนหน้า)`;
        } else {
          // Gap case
          return `ช่วงหน่วยค่าน้ำไม่ต่อเนื่องกัน (มีช่องว่างระหว่างช่วง):\n- ช่วงก่อนหน้า: ${prev.start} ถึง ${prevEndStr}\n- ช่วงปัจจุบัน: ${curr.start} ถึง ${currEndStr}\n(ช่วงปัจจุบันควรจะเริ่มที่ ${expectedStart} เพื่อให้ต่อเนื่องกันพอดี)`;
        }
      }
    }

    return null;
  };

  // Add garbage size handler
  const handleAddGarbageBin = () => {
    const newBin: GarbageBin = {
      id: Date.now(),
      type: "ระบุประเภท/ขนาดถังใหม่",
      price: "100.00"
    };
    setGarbageBins((prev) => [...prev, newBin]);
    setIsGarbageDirty(true);
  };

  // Delete garbage size
  const handleDeleteGarbageBin = (id: number | string) => {
    setGarbageBins((prev) => {
      const numId = typeof id === "number" ? id : parseInt(id);
      if (!isNaN(numId) && numId < 1000000000) {
        setDeletedBinIds((prevDeleted) =>
          prevDeleted.includes(numId) ? prevDeleted : [...prevDeleted, numId]
        );
      }
      return prev.filter((b) => b.id !== id);
    });
    setIsGarbageDirty(true);
  };

  // Garbage input change handler
  const handleGarbageChange = (id: number | string, field: "type" | "price", value: string) => {
    setGarbageBins((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return { ...b, [field]: value };
        }
        return b;
      })
    );
    setIsGarbageDirty(true);
  };

  // Save water tiers to database API
  const handleSaveWater = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Perform range overlap validation first
    const validationError = validateWaterTiers(waterTiers);
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setLoading(true);
      await saveWaterTiers(waterTiers, deletedTierIds, 1);

      // Clear deleted queue
      setDeletedTierIds([]);

      // Refresh list from DB
      await fetchWaterTiers();

      setToastMessage("บันทึกข้อมูลอัตราค่าน้ำประปาเรียบร้อยแล้ว!");
      setIsWaterDirty(false);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  // Save Garbage
  const handleSaveGarbage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await saveGarbageRates(garbageBins, deletedBinIds, 1);
      setDeletedBinIds([]);
      await fetchGarbageRates();
      setIsGarbageDirty(false);
      setToastMessage("บันทึกข้อมูลอัตราค่าเก็บขยะเรียบร้อยแล้ว!");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      alert(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลอัตราค่าเก็บขยะ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans relative">

      {/* Dynamic Slide-in Premium Toast notification */}
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

      {/* Grid of Two Side-by-Side Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ================= CARD 1: อัตราค่าน้ำประปา ================= */}
        <form onSubmit={handleSaveWater} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-115">
          <div className="space-y-6">

            {/* Header droplet icon and link */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0C5AE9] flex items-center justify-center border border-blue-100">
                  <Droplet className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">อัตราค่าน้ำประปา</h3>
              </div>

              {/* Add Tier Link */}
              <button
                type="button"
                onClick={handleAddWaterTier}
                className="flex items-center gap-1.5 text-[#0C5AE9] hover:text-blue-700 text-[13px] font-bold transition select-none cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>เพิ่มช่วงหน่วย (Add Tier)</span>
              </button>
            </div>

            {/* Rates grid table */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center text-slate-400 font-bold text-[11px] uppercase tracking-wider pb-1">
                <span>หน่วยเริ่มต้น (START)</span>
                <span>หน่วยสิ้นสุด (END)</span>
                <span>ราคา/หน่วย (บาท)</span>
              </div>

              <div className="space-y-3">
                {waterTiers.map((tier, idx) => (
                  <div key={tier.id} className="grid grid-cols-3 gap-4 items-center relative group">
                    {/* Start Range input */}
                    <input
                      type="number"
                      min={0}
                      value={tier.start}
                      onChange={(e) => handleWaterRateChange(tier.id, "start", e.target.value)}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-center text-[14px] text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition shadow-sm"
                      placeholder="เช่น 0"
                    />

                    {/* End Range input */}
                    <input
                      type="number"
                      min={0}
                      value={idx === waterTiers.length - 1 ? "" : tier.end}
                      disabled={idx === waterTiers.length - 1}
                      onChange={(e) => handleWaterRateChange(tier.id, "end", e.target.value)}
                      className={`px-4 py-2.5 border rounded-xl text-center text-[14px] font-bold focus:outline-none transition shadow-sm ${idx === waterTiers.length - 1
                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                        }`}
                      placeholder={idx === waterTiers.length - 1 ? "ขึ้นไป" : "เช่น 5"}
                    />

                    {/* Rate per unit input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={tier.rate}
                        onChange={(e) => handleWaterRateChange(tier.id, "rate", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-center text-[14px] text-slate-700 font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition shadow-sm"
                        placeholder="เช่น 4.00"
                      />

                      {/* Delete tier action on hover (allow delete if more than 1 tier exists) */}
                      {waterTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWaterTier(tier.id)}
                          className="absolute -right-2 top-1/2 -translate-y-1/2 p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition shadow-sm"
                          title="ลบช่วงขั้นค่าน้ำ"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
            <button
              type="submit"
              disabled={!isWaterDirty}
              className={`${isWaterDirty
                  ? "bg-[#0B409C] hover:bg-[#09337d] cursor-pointer shadow-md hover:shadow-lg transform active:scale-95 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                } font-bold py-2.5 px-6 rounded-xl transition-all duration-150 text-[14px]`}
            >
              บันทึกค่าน้ำ
            </button>
          </div>
        </form>

        {/* ================= CARD 2: อัตราค่าเก็บขยะ ================= */}
        <form onSubmit={handleSaveGarbage} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-115">
          <div className="space-y-6">

            {/* Header trash icon and link */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">อัตราค่าเก็บขยะ</h3>
              </div>

              {/* Add Size Link */}
              <button
                type="button"
                onClick={handleAddGarbageBin}
                className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-[13px] font-bold transition select-none cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>เพิ่มขนาดถัง (Add Bin Size)</span>
              </button>
            </div>

            {/* Rates table */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center text-slate-400 font-bold text-[11px] uppercase tracking-wider pb-1">
                <span className="text-left pl-4">ขนาดถัง (ลิตร) / ประเภท</span>
                <span>ราคา/เดือน (บาท)</span>
              </div>

              <div className="space-y-3">
                {garbageBins.map((bin) => (
                  <div key={bin.id} className="grid grid-cols-2 gap-4 items-center relative group">
                    {/* Bin size name / description */}
                    <input
                      type="text"
                      value={bin.type}
                      onChange={(e) => handleGarbageChange(bin.id, "type", e.target.value)}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-left text-[14px] text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition shadow-sm pl-4"
                    />

                    {/* Price input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={bin.price}
                        onChange={(e) => handleGarbageChange(bin.id, "price", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-center text-[14px] text-slate-700 font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition shadow-sm"
                      />

                      {/* Delete bin action on hover (don't allow delete if only 2 left) */}
                      {garbageBins.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGarbageBin(bin.id)}
                          className="absolute -right-2 top-1/2 -translate-y-1/2 p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition shadow-sm"
                          title="ลบขนาดถังนี้"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
            <button
              type="submit"
              disabled={!isGarbageDirty}
              className={`${isGarbageDirty
                  ? "bg-[#10B981] hover:bg-[#099268] cursor-pointer shadow-md hover:shadow-lg transform active:scale-95 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                } font-bold py-2.5 px-6 rounded-xl transition-all duration-150 text-[14px]`}
            >
              บันทึกค่าขยะ
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
