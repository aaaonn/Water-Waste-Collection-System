import { httpClient } from "./http-client";
import { WaterTier, GarbageBin, WaterUnitResponse, GarbageRateResponse } from "../interface/baseSettings";


/**
 * ดึงข้อมูลอัตราค่าน้ำประปา
 */
export async function getWaterTiers(subdistrictId: number = 1): Promise<WaterTier[]> {
  const data = await httpClient.get<WaterUnitResponse[]>(`/water-units?subdistrict_id=${subdistrictId}`);

  const mapped: WaterTier[] = data.map((item) => ({
    id: item.id,
    start: item.start_unit,
    end: item.end_unit === null || item.end_unit === 9999 ? "" : item.end_unit,
    rate: item.cost.toFixed(2)
  }));

  // Sort in ascending order by start unit
  mapped.sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
  return mapped;
}

/**
 * ลบช่วงค่าน้ำประปา
 */
export async function deleteWaterTier(id: number | string): Promise<void> {
  await httpClient.delete(`/water-units/${id}`);
}

/**
 * สร้างช่วงค่าน้ำประปาใหม่
 */
export async function createWaterTier(body: { subdistrict_id: number; start_unit: number; end_unit: number | null; cost: number }): Promise<void> {
  await httpClient.post(`/water-units`, body);
}

/**
 * แก้ไข/อัปเดตช่วงค่าน้ำประปา
 */
export async function updateWaterTier(id: number | string, body: { subdistrict_id: number; start_unit: number; end_unit: number | null; cost: number }): Promise<void> {
  await httpClient.patch(`/water-units/${id}`, body);
}

/**
 * บันทึกข้อมูลค่าน้ำประปาทั้งหมด (ทั้ง ลบ, สร้างใหม่, และ อัปเดต)
 */
export async function saveWaterTiers(
  waterTiers: WaterTier[],
  deletedTierIds: number[],
  subdistrictId: number = 1
): Promise<void> {
  // 1. Deletions (Deduplicate IDs first)
  const uniqueDeletedIds = Array.from(new Set(deletedTierIds));
  for (const id of uniqueDeletedIds) {
    await deleteWaterTier(id);
  }

  // 2. Creates & Updates
  // Find the last tier based on start unit to ensure end_unit is forced to null
  const sortedTiers = [...waterTiers].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
  const lastTierId = sortedTiers.length > 0 ? sortedTiers[sortedTiers.length - 1].id : null;

  for (const tier of waterTiers) {
    const isNew = typeof tier.id === "number" && tier.id >= 1000000000;
    const isLast = tier.id === lastTierId;

    const body = {
      subdistrict_id: subdistrictId,
      start_unit: tier.start === "" ? 0 : Number(tier.start),
      end_unit: isLast ? null : (tier.end === "" ? null : Number(tier.end)),
      cost: parseFloat(tier.rate)
    };

    if (isNew) {
      await createWaterTier(body);
    } else {
      await updateWaterTier(tier.id, body);
    }
  }
}

/**
 * ดึงข้อมูลอัตราค่าบริการขยะ
 */
export async function getGarbageRates(subdistrictId: number = 1): Promise<GarbageBin[]> {
  const data = await httpClient.get<GarbageRateResponse[]>(`/garbage-rates?subdistrict_id=${subdistrictId}`);

  const mapped: GarbageBin[] = data.map((item) => ({
    id: item.id,
    type: item.size_name,
    price: item.cost.toFixed(2)
  }));

  return mapped;
}



/**
 * ลบอัตราค่าบริการขยะ
 */
export async function deleteGarbageRate(id: number | string): Promise<void> {
  await httpClient.delete(`/garbage-rates/${id}`);
}

/**
 * สร้างอัตราค่าบริการขยะใหม่
 */
export async function createGarbageRate(body: { subdistrict_id: number; size_name: string; cost: number }): Promise<void> {
  await httpClient.post(`/garbage-rates`, body);
}

/**
 * แก้ไข/อัปเดตอัตราค่าบริการขยะ
 */
export async function updateGarbageRate(id: number | string, body: { subdistrict_id: number; size_name: string; cost: number }): Promise<void> {
  await httpClient.patch(`/garbage-rates/${id}`, body);
}

/**
 * บันทึกข้อมูลอัตราค่าเก็บขยะทั้งหมด (ทั้ง ลบ, สร้างใหม่, และ อัปเดต)
 */
export async function saveGarbageRates(
  garbageBins: GarbageBin[],
  deletedBinIds: number[] = [],
  subdistrictId: number = 1
): Promise<void> {
  // 1. ลบรายการที่ผู้ใช้กดลบออกจากตาราง
  const uniqueDeletedIds = Array.from(new Set(deletedBinIds));
  for (const id of uniqueDeletedIds) {
    await deleteGarbageRate(id);
  }

  // 2. ลูปตรวจสอบรายการสร้างใหม่ หรือ อัปเดตรายการเดิม
  for (const bin of garbageBins) {
    const isNew = typeof bin.id === "number" && bin.id >= 1000000000;

    const body = {
      subdistrict_id: subdistrictId,
      size_name: bin.type,
      cost: parseFloat(bin.price)
    };

    if (isNew) {
      await createGarbageRate(body);
    } else {
      await updateGarbageRate(bin.id, body);
    }
  }
}

// Export alias for backward compatibility with pages that still import saveGarbageBins
export { saveGarbageRates as saveGarbageBins };



