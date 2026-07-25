export interface WaterTier {
  id: number | string;
  start: number | "";
  end: number | "";
  rate: string;
}

export interface GarbageBin {
  id: number | string;
  type: string;
  price: string;
}

export interface WaterUnitResponse {
  id: number;
  start_unit: number;
  end_unit: number | null;
  cost: number;
}

export interface GarbageRateResponse {
  id: number;
  size_name: string;
  cost: number;
}